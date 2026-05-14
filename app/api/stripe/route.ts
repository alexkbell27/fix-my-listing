import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseRouteHandler } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rateLimit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(ip, 5, 3600000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = createSupabaseRouteHandler(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { tier, listingUrl, reportId } = await req.json();
  if (tier !== "single" && tier !== "unlimited") {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL!;

  try {
    let session: Stripe.Checkout.Session;

    if (tier === "single") {
      if (!listingUrl || !reportId) {
        return NextResponse.json({ error: "listingUrl and reportId are required for single tier" }, { status: 400 });
      }
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: user.email,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 400,
            product_data: {
              name: "Fix My Listing — Single Report",
              description: "Full report for 1 listing, up to 3 reruns",
            },
          },
        }],
        metadata: { userId: user.id, tier: "single", listingUrl, reportId },
        success_url: `${base}/results/${reportId}?upgraded=true`,
        cancel_url: `${base}/results/${reportId}`,
      });
    } else {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: user.email,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 900,
            recurring: { interval: "month" },
            product_data: {
              name: "Fix My Listing — Unlimited",
              description: "Unlimited listings and reruns, every month",
            },
          },
        }],
        metadata: { userId: user.id, tier: "unlimited", reportId: reportId ?? "" },
        success_url: reportId ? `${base}/results/${reportId}?upgraded=true` : `${base}/dashboard`,
        cancel_url: reportId ? `${base}/results/${reportId}` : `${base}/pricing`,
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe] error:", error);
    return NextResponse.json({ error: "Payment session creation failed" }, { status: 500 });
  }
}
