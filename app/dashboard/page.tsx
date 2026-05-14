import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseServer, supabaseAdmin } from "@/lib/supabase-server";

const NAVY = "#1D3557";
const RED  = "#E63946";

function ScoreRing({ score }: { score: number }) {
  const r    = 22;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? "#16A34A" : score >= 50 ? "#F59E0B" : RED;
  return (
    <svg width="52" height="52" viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)" />
      <text x="28" y="33" textAnchor="middle" fontSize="12" fontWeight="600" fill={color}>
        {score || "—"}
      </text>
    </svg>
  );
}

function relativeTime(dateString: string): string {
  const date   = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today at " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [reportsResult, profileResult] = await Promise.all([
    supabaseAdmin
      .from("reports")
      .select("id, listing_url, created_at, result")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single(),
  ]);

  const reports = reportsResult.data ?? [];
  const tier = (profileResult.data?.subscription_tier ?? "free") as "free" | "single" | "unlimited";

  let purchasedMap = new Map<string, { runs_used: number; max_runs: number }>();
  if (tier === "single") {
    const { data: purchases } = await supabaseAdmin
      .from("purchased_reports")
      .select("listing_url_hash, runs_used, max_runs")
      .eq("user_id", user.id);
    for (const p of purchases ?? []) {
      purchasedMap.set(p.listing_url_hash, { runs_used: p.runs_used, max_runs: p.max_runs });
    }
  }

  function getAccessForReport(listingUrl: string | null): "full" | "partial" {
    if (tier === "unlimited") return "full";
    if (tier === "single" && listingUrl) {
      return purchasedMap.has(normalizeUrl(listingUrl)) ? "full" : "partial";
    }
    return "partial";
  }

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh" }}>

      {/* Nav */}
      <nav style={{ background: "#FFFFFF", borderBottom: "0.5px solid #E5E7EB", padding: "0 2rem", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Image src="/logo-full.png" alt="Fix My Listing" height={28} width={140} style={{ height: 28, width: "auto", display: "block" }} />
        </Link>
        <Link href="/" style={{ fontSize: "0.875rem", fontWeight: 600, color: NAVY, textDecoration: "none" }}>
          + New analysis
        </Link>
      </nav>

      {/* Navy header */}
      <section style={{ background: NAVY, padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgba(168,218,220,0.75)", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>
            MY REPORTS
          </p>
          <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 400, color: "#FFFFFF", lineHeight: 1.2, marginBottom: "0.35rem" }}>
            Your listing analyses
          </h1>
          <p style={{ fontSize: "0.82rem", color: "rgba(168,218,220,0.55)", margin: 0 }}>{user.email}</p>
        </div>
      </section>

      {/* Body */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2.5rem 2rem" }}>
        {reports.length === 0 ? (
          <div style={{ background: "#FAFAF8", border: "0.5px solid #E5E7EB", borderRadius: 14, padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <p style={{ fontSize: "1rem", fontWeight: 600, color: NAVY, margin: 0 }}>No reports yet</p>
            <p style={{ color: "#7BA3BF", fontSize: "0.875rem", maxWidth: 380, lineHeight: 1.6, margin: 0 }}>
              Paste your Airbnb listing URL on the home page to get your first free SEO report.
            </p>
            <Link href="/" style={{ display: "inline-block", padding: "0.65rem 1.5rem", background: RED, color: "#fff", borderRadius: 10, fontWeight: 600, fontSize: "0.875rem", textDecoration: "none", marginTop: "0.5rem" }}>
              Analyze my listing →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {reports.map((report) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const result      = report.result as any;
              const score       = (result?.overallScore ?? result?.currentScore ?? 0) as number;
              const listingName = (result?.listingName ?? "") as string;
              const displayUrl  = report.listing_url
                ? report.listing_url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60)
                : "Manual analysis";
              const timeAgo  = relativeTime(report.created_at);
              const access   = getAccessForReport(report.listing_url);
              const purchase = tier === "single" && report.listing_url
                ? purchasedMap.get(normalizeUrl(report.listing_url))
                : undefined;

              return (
                <div key={report.id} style={{ background: "#FFFFFF", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <ScoreRing score={score} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: NAVY, margin: "0 0 0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {listingName || displayUrl}
                    </p>
                    <p style={{ fontSize: "0.72rem", color: "#7BA3BF", margin: 0 }}>
                      {listingName && (
                        <span style={{ fontFamily: "monospace" }}>{displayUrl}{" · "}</span>
                      )}
                      {timeAgo}
                    </p>
                    {purchase && (
                      <p style={{ margin: "0.15rem 0 0", fontSize: "0.72rem", color: "#7BA3BF" }}>
                        {purchase.runs_used} of {purchase.max_runs} reruns used
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexShrink: 0 }}>
                    {access === "full" ? (
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#166534", background: "rgba(34,197,94,0.1)", border: "0.5px solid rgba(34,197,94,0.3)", borderRadius: 999, padding: "0.2rem 0.6rem", whiteSpace: "nowrap" }}>
                        Full report
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.72rem", fontWeight: 500, color: "#7BA3BF", background: "rgba(0,0,0,0.03)", border: "0.5px solid #E5E7EB", borderRadius: 999, padding: "0.2rem 0.6rem", whiteSpace: "nowrap" }}>
                        Free preview
                      </span>
                    )}
                    <Link
                      href={`/results/${report.id}`}
                      style={{ padding: "0.45rem 1rem", borderRadius: 8, border: access === "partial" ? "none" : "0.5px solid #D1D5DB", background: access === "partial" ? RED : "transparent", color: access === "partial" ? "#FFFFFF" : NAVY, fontWeight: 600, fontSize: "0.8rem", textDecoration: "none", whiteSpace: "nowrap" }}
                    >
                      {access === "partial" ? "Unlock →" : "View →"}
                    </Link>
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <Link href="/" style={{ display: "inline-block", padding: "0.65rem 1.75rem", background: NAVY, color: "#fff", borderRadius: 10, fontWeight: 600, fontSize: "0.875rem", textDecoration: "none" }}>
                Analyze another listing →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
