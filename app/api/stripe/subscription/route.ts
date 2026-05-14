import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseRouteHandler, supabaseAdmin } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const supabase = createSupabaseRouteHandler(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_subscription_id || !profile?.stripe_customer_id) {
    return NextResponse.json({ nextBillingDate: null });
  }

  try {
    const upcoming = await stripe.invoices.createPreview({
      customer: profile.stripe_customer_id,
      subscription: profile.stripe_subscription_id,
    });
    const ts = upcoming.next_payment_attempt;
    const nextBillingDate = ts
      ? new Date(ts * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : null;
    return NextResponse.json({ nextBillingDate });
  } catch {
    return NextResponse.json({ nextBillingDate: null });
  }
}
