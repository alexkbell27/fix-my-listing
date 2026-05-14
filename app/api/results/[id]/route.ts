import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandler, supabaseAdmin } from "@/lib/supabase-server";

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createSupabaseRouteHandler(req);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: report, error } = await supabaseAdmin
    .from("reports")
    .select("result, user_id, listing_url")
    .eq("id", id)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (report.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Determine access level for this user + listing
  const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
  let access: "full" | "partial" = "partial";

  if (!paymentsEnabled) {
    access = "full";
  } else {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const tier = (profile?.subscription_tier ?? "free") as string;

    if (tier === "unlimited") {
      access = "full";
    } else if (tier === "single" && report.listing_url) {
      const hash = normalizeUrl(report.listing_url);
      const { data: purchase } = await supabaseAdmin
        .from("purchased_reports")
        .select("runs_used, max_runs")
        .eq("user_id", user.id)
        .eq("listing_url_hash", hash)
        .single();
      if (purchase && purchase.runs_used <= purchase.max_runs) {
        access = "full";
      }
    }
  }

  return NextResponse.json({ ...report.result, _access: access });
}
