import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseRouteHandler, supabaseAdmin } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const supabase = createSupabaseRouteHandler(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not complete" }, { status: 402 });
  }

  // Confirm this session belongs to this user
  if (session.client_reference_id && session.client_reference_id !== user.id) {
    return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
  }

  await supabaseAdmin
    .from("profiles")
    .update({ is_subscribed: true })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
