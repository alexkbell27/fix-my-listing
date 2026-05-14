import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (error) {
    console.error("[webhook] signature verification failed:", error);
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, tier, listingUrl, reportId } = session.metadata ?? {};

      if (!userId || !tier) {
        console.error("[webhook] missing metadata on session", session.id);
        return NextResponse.json({ received: true });
      }

      if (tier === "single") {
        if (!listingUrl) {
          console.error("[webhook] single purchase missing listingUrl");
          return NextResponse.json({ received: true });
        }
        const hash = normalizeUrl(listingUrl);
        const { error } = await supabaseAdmin.from("purchased_reports").insert({
          user_id: userId,
          listing_url: listingUrl,
          listing_url_hash: hash,
          runs_used: 1,
          max_runs: 3,
        });
        if (error) console.error("[webhook] failed to insert purchased_report:", error);
      }

      if (tier === "unlimited") {
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_tier: "unlimited",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", userId);
        if (error) console.error("[webhook] failed to update profile tier:", error);
      }

      void reportId; // unused but present in metadata for success_url
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ subscription_tier: "free", stripe_subscription_id: null })
        .eq("stripe_subscription_id", sub.id);
      if (error) console.error("[webhook] failed to downgrade on cancellation:", error);
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as unknown as { subscription?: string | null };
      if (invoice.subscription) {
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ subscription_tier: "unlimited" })
          .eq("stripe_subscription_id", invoice.subscription);
        if (error) console.error("[webhook] failed to confirm subscription on invoice.paid:", error);
      }
    }
  } catch (error) {
    console.error("[webhook] handler error:", error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
