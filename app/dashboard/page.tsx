import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer, supabaseAdmin } from "@/lib/supabase-server";

function scoreMeta(score: number) {
  if (score >= 70) return { bg: "#F0FFF4", color: "#16A34A", border: "#BBF7D0", label: "Good" };
  if (score >= 40) return { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", label: "Fair" };
  return { bg: "#FFF5F5", color: "#DC2626", border: "#FECACA", label: "Poor" };
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: reports } = await supabaseAdmin
    .from("reports")
    .select("id, listing_url, created_at, result")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const pillStyle = (bg: string, color: string, border: string): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "0.2rem 0.6rem",
    borderRadius: 999,
    fontSize: "0.73rem",
    fontWeight: 500,
    background: bg,
    color,
    border: `0.5px solid ${border}`,
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>

      {/* Nav */}
      <nav style={{ borderBottom: "0.5px solid var(--border)", background: "var(--surface)", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ fontWeight: 500, fontSize: "1rem", textDecoration: "none", color: "var(--text)" }}>
          Fix My <span style={{ color: "var(--accent)" }}>Listing</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/" style={{ fontSize: "0.82rem", color: "var(--muted)", textDecoration: "none" }}>New Report</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 2rem" }}>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "0.35rem" }}>
          My reports
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "2.5rem" }}>
          {user.email}
        </p>

        {!reports || reports.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "3rem 2rem", textAlign: "center" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
              No reports yet. Analyze your first listing to get started.
            </p>
            <Link
              href="/"
              style={{ display: "inline-block", padding: "0.6rem 1.5rem", background: "var(--accent)", color: "#fff", borderRadius: "var(--radius)", fontWeight: 500, fontSize: "0.875rem", textDecoration: "none" }}
            >
              Analyze a listing →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {reports.map((report) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const result = report.result as any;
              const score: number = result?.overallScore ?? 0;
              const meta = scoreMeta(score);
              const date = new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const listingName: string = result?.listingName || "";
              const displayUrl = report.listing_url
                ? report.listing_url.replace(/https?:\/\/(www\.)?/, "").slice(0, 70)
                : "Manual analysis";

              return (
                <div
                  key={report.id}
                  style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 0.2rem", fontSize: "0.875rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {listingName || displayUrl}
                    </p>
                    <p style={{ margin: "0 0 0.15rem", fontSize: "0.78rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {listingName ? displayUrl : date}
                    </p>
                    {listingName && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>{date}</p>}
                  </div>
                  {score > 0 && (
                    <span style={pillStyle(meta.bg, meta.color, meta.border)}>
                      {score}/100 · {meta.label}
                    </span>
                  )}
                  <Link
                    href={`/results/${report.id}`}
                    style={{ fontSize: "0.82rem", color: "var(--accent)", textDecoration: "none", fontWeight: 500, flexShrink: 0 }}
                  >
                    View report →
                  </Link>
                </div>
              );
            })}
            <Link
              href="/"
              style={{ display: "block", textAlign: "center", padding: "0.75rem", background: "var(--accent)", color: "#fff", borderRadius: "var(--radius)", fontWeight: 500, fontSize: "0.875rem", textDecoration: "none", marginTop: "0.5rem" }}
            >
              New Report →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
