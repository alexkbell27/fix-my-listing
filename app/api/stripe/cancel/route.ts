import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseRouteHandler, supabaseAdmin } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const supabase = createSupabaseRouteHandler(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  try {
    await stripe.subscriptions.cancel(profile.stripe_subscription_id);
  } catch (error) {
    console.error("[stripe/cancel] error:", error);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }

  await supabaseAdmin
    .from("profiles")
    .update({ subscription_tier: "free", stripe_subscription_id: null })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
