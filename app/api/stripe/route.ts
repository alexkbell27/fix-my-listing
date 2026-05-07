import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseRouteHandler } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseRouteHandler(req);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const listingUrl: string = body.listingUrl ?? "";

    const base = process.env.NEXT_PUBLIC_BASE_URL!;
    const encodedListing = listingUrl ? encodeURIComponent(listingUrl) : "";
    const successUrl = encodedListing
      ? `${base}/analyze?url=${encodedListing}&session_id={CHECKOUT_SESSION_ID}`
      : `${base}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${base}/pricing`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: user.id,
      metadata: { userId: user.id, listingUrl },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: 600,
          product_data: { name: "Fix My Listing Unlimited" },
        },
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe] error:", error);
    return NextResponse.json({ error: "Payment session creation failed" }, { status: 500 });
  }
}
