import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandler, supabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check
  const supabase = createSupabaseRouteHandler(req);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Fetch from Supabase
  const { data: report, error } = await supabaseAdmin
    .from("reports")
    .select("result, user_id")
    .eq("id", id)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Ownership check
  if (report.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(report.result);
}
