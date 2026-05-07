import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseServer, supabaseAdmin } from "@/lib/supabase-server";

function scoreMeta(score: number) {
  if (score >= 75) return { bg: "rgba(168,218,220,0.3)", color: "#1D3557", border: "#A8DADC", label: "Good" };
  if (score >= 50) return { bg: "rgba(69,123,157,0.15)", color: "#457B9D", border: "#457B9D", label: "Fair" };
  return { bg: "rgba(230,57,70,0.12)", color: "#E63946", border: "#E63946", label: "Poor" };
}

function relativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today at " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
    <div style={{ background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text-primary)" }}>

      {/* Nav */}
      <nav style={{ background: "#FFFFFF", borderBottom: "0.5px solid var(--color-border)", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image src="/logo-full.png" alt="Fix My Listing" height={30} width={150} style={{ height: 30, width: "auto" }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1D3557", textDecoration: "none" }}>New Report</Link>
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
          <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 80, height: 80, background: "#A8DADC", borderRadius: 12, flexShrink: 0 }} />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 500, margin: 0, color: "var(--text)" }}>
              No reports yet
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", maxWidth: 380, lineHeight: 1.6, margin: 0 }}>
              Paste your Airbnb listing URL on the home page to get your first free SEO report — it&apos;s free.
            </p>
            <Link
              href="/"
              style={{ display: "inline-block", padding: "0.65rem 1.5rem", background: "#E63946", color: "#fff", borderRadius: "var(--radius)", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none", marginTop: "0.5rem" }}
            >
              Analyze my listing →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {reports.map((report) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const result = report.result as any;
              const score: number = result?.overallScore ?? result?.currentScore ?? 0;
              const meta = scoreMeta(score);
              const timeAgo = relativeTime(report.created_at);
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
                      {listingName ? displayUrl : timeAgo}
                    </p>
                    {listingName && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>{timeAgo}</p>}
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
