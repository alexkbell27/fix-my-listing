import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandler, supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const supabase = createSupabaseRouteHandler(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rows } = await supabaseAdmin
    .from("reports")
    .select("id, listing_url, created_at, result")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const reports = rows ?? [];
  const totalReports = reports.length;
  const distinctListings = new Set(reports.map((r) => r.listing_url).filter(Boolean)).size;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scores = reports.map((r) => (r.result as any)?.currentScore ?? (r.result as any)?.overallScore ?? 0).filter((s: number) => s > 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

  return NextResponse.json({
    totalReports,
    distinctListings,
    avgScore,
    recentReports: reports.slice(0, 3).map((r) => ({
      id: r.id,
      listing_url: r.listing_url,
      created_at: r.created_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      score: (r.result as any)?.currentScore ?? (r.result as any)?.overallScore ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      listingName: (r.result as any)?.listingName ?? "",
    })),
  });
}
