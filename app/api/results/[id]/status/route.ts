import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandler, supabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createSupabaseRouteHandler(req);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ status: "pending" }, { status: 401 });
  }

  const { data: report, error } = await supabaseAdmin
    .from("reports")
    .select("id, result, user_id")
    .eq("id", id)
    .single();

  if (error || !report) {
    // Row not yet written — still processing
    return NextResponse.json({ status: "pending" });
  }

  if (report.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (report.result) {
    return NextResponse.json({ status: "complete" });
  }

  return NextResponse.json({ status: "pending" });
}
