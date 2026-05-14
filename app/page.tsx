"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import HeroForm from "./components/HeroForm";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ─── Constants ────────────────────────────────────────────────────────────────

const RED = "#E63B2E";
const NAVY = "#1D3557";
const DARK_NAVY = "#12243a";

const STATS = [
  { value: "2,300+", label: "listings ranked higher" },
  { value: "+$340/mo", label: "avg. revenue lift" },
  { value: "+14", label: "avg. positions gained" },
  { value: "6 wks", label: "avg. time to results" },
];

const STEPS = [
  { num: "01", title: "Paste your Airbnb URL", body: "Drop in your listing link. We pull your title, description, amenities, pricing, and photos automatically." },
  { num: "02", title: "SEO analysis runs", body: "We score your listing against Airbnb's algorithm, scan competitor keywords, and identify every ranking gap." },
  { num: "03", title: "Get your fix plan", body: "A prioritized action plan with SEO-optimized titles ready to copy — and an exact score to track progress." },
];

const TESTIMONIALS = [
  {
    quote: "I had no idea my title was missing the keywords guests actually search for. After fixing it I jumped from page 4 to page 1 in my area.",
    name: "Sarah K.",
    handle: "San Diego Superhost",
  },
  {
    quote: "The keyword gap analysis alone was worth it. My listing went from 61% to 84% occupancy in 6 weeks.",
    name: "Marcus T.",
    handle: "Austin host",
  },
];

// ─── Before/After types & components ─────────────────────────────────────────

interface BACard {
  position: string;
  score: number;
  photoSrc?: string;
  title: string;
  tags: string[];
  insight: string;
}

function BeforeAfterCard({ card, variant }: { card: BACard; variant: "before" | "after" }) {
  const isBefore = variant === "before";
  const accentColor = isBefore ? RED : "#16A34A";
  const headerBg = isBefore ? "rgba(230,59,46,0.07)" : "rgba(22,163,74,0.07)";
  const headerBorder = isBefore ? "rgba(230,59,46,0.2)" : "rgba(22,163,74,0.2)";
  const tagBg = isBefore ? "rgba(230,59,46,0.09)" : "rgba(22,163,74,0.09)";
  const tagBorder = isBefore ? "rgba(230,59,46,0.28)" : "rgba(22,163,74,0.28)";
  const insightBg = isBefore ? "rgba(230,59,46,0.04)" : "rgba(22,163,74,0.04)";

  return (
    <div style={{ background: "#FFFFFF", border: "0.5px solid #E5E7EB", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      {/* Header bar */}
      <div style={{ background: headerBg, borderBottom: `0.5px solid ${headerBorder}`, padding: "0.55rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: accentColor, letterSpacing: "0.09em", whiteSpace: "nowrap" }}>
          {isBefore ? "BEFORE" : "AFTER"}
        </span>
        <span style={{ fontSize: "0.65rem", color: accentColor, fontWeight: 400 }}>—</span>
        <span style={{ fontSize: "0.65rem", color: accentColor, fontWeight: 500, flex: 1 }}>{card.position}</span>
        <span style={{ fontSize: "0.63rem", fontWeight: 600, color: accentColor, background: isBefore ? "rgba(230,59,46,0.12)" : "rgba(22,163,74,0.12)", border: `0.5px solid ${headerBorder}`, borderRadius: 999, padding: "0.1rem 0.5rem", whiteSpace: "nowrap" }}>
          Score {card.score}
        </span>
      </div>

      {/* Photo */}
      {card.photoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.photoSrc} alt="" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ height: 130, background: "linear-gradient(135deg, #EAF1F8 0%, #D6E4F0 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" fill="#AABFD4" />
            <circle cx="8.5" cy="10.5" r="1.5" fill="#7A9FBE" />
            <path d="M3 17l4-4 3 3 4-5 7 6" stroke="#7A9FBE" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Listing info */}
      <div style={{ padding: "0.85rem 1rem 0" }}>
        <p style={{ fontSize: "0.83rem", fontWeight: 600, color: NAVY, margin: "0 0 0.45rem", lineHeight: 1.35 }}>{card.title}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.85rem" }}>
          {card.tags.map((tag) => (
            <span key={tag} style={{ fontSize: "0.63rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: 999, background: tagBg, color: accentColor, border: `0.5px solid ${tagBorder}` }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Insight */}
      <div style={{ margin: "0 1rem 1rem", padding: "0.7rem 0.9rem", borderLeft: `3px solid ${accentColor}`, background: insightBg, borderRadius: "0 8px 8px 0" }}>
        <p style={{ fontSize: "0.77rem", color: "#457B9D", margin: 0, lineHeight: 1.6 }}>{card.insight}</p>
      </div>
    </div>
  );
}

// ─── Profile icon ─────────────────────────────────────────────────────────────

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" fill="#457B9D" />
      <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" fill="#457B9D" />
    </svg>
  );
}

type ReportSummary = { id: string; listing_url: string | null; created_at: string; score: number; listingName: string };

// ─── Signed-in helpers ───────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function ScoreRing({ score }: { score: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? "#16A34A" : score >= 50 ? "#F59E0B" : RED;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" style={{ flexShrink: 0 }}>
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)" />
      <text x="28" y="33" textAnchor="middle" fontSize="12" fontWeight="600" fill={color}>{score}</text>
    </svg>
  );
}

function NavyUrlForm({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = value.trim();
    if (!url.includes("airbnb.com")) {
      setError("Please enter a valid Airbnb listing URL");
      return;
    }
    onNavigate(url);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
        <input
          type="url"
          className="li-dark-input"
          placeholder="Paste your Airbnb listing URL…"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          style={{
            flex: 1,
            height: 46,
            padding: "0 1rem",
            borderRadius: 10,
            border: `1px solid ${error ? "#E63946" : "rgba(168,218,220,0.3)"}`,
            background: "rgba(255,255,255,0.08)",
            color: "#FFFFFF",
            fontSize: "0.9rem",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          type="submit"
          style={{ height: 46, padding: "0 1.25rem", borderRadius: 10, background: RED, color: "#FFFFFF", fontWeight: 600, fontSize: "0.875rem", border: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
        >
          Analyze →
        </button>
      </form>
      {error && <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "#FCA5A5" }}>{error}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<{ subscription_tier: string; free_report_used: boolean; first_name: string | null } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentReports, setRecentReports] = useState<ReportSummary[]>([]);
  const [userStats, setUserStats] = useState<{ total: number; distinct: number; avgScore: number } | null>(null);
  const [contactFields, setContactFields] = useState({ name: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase
      .from("profiles")
      .select("subscription_tier, free_report_used, first_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) { setRecentReports([]); setUserStats(null); return; }
    fetch("/api/user/stats")
      .then((r) => r.json())
      .then((data) => {
        setRecentReports(data.recentReports ?? []);
        setUserStats({ total: data.totalReports ?? 0, distinct: data.distinctListings ?? 0, avgScore: data.avgScore ?? 0 });
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleContact = useCallback(async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setContactStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactFields),
      });
      setContactStatus(res.ok ? "sent" : "error");
    } catch {
      setContactStatus("error");
    }
  }, [contactFields]);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleFormNavigate = useCallback((url: string) => {
    const encoded = encodeURIComponent(url);
    if (!user) {
      router.push(`/preview?url=${encoded}`);
    } else {
      router.push(`/analyze?url=${encoded}`);
    }
  }, [user, router]);

  // While auth is resolving, render a blank white page to avoid flashing logged-out content
  if (user === undefined) {
    return <div style={{ background: "#FFFFFF", minHeight: "100vh" }} />;
  }

  // ── Shared nav ──────────────────────────────────────────────────────────────
  const nav = (
    <nav style={{ background: "#FFFFFF", borderBottom: "0.5px solid #E5E7EB", padding: "0 2rem", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
      <Link href="/" style={{ textDecoration: "none" }}>
        <Image src="/logo-full.png" alt="Fix My Listing" height={28} width={140} style={{ height: 28, width: "auto", display: "block" }} />
      </Link>

      {user ? (
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <Link href="/dashboard" style={{ fontSize: "0.875rem", fontWeight: 500, color: NAVY, textDecoration: "none" }}>My Reports</Link>
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              style={{ width: 32, height: 32, borderRadius: "50%", background: dropdownOpen ? "rgba(29,53,87,0.08)" : "rgba(29,53,87,0.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-label="Profile menu"
            >
              <ProfileIcon />
            </button>
            {dropdownOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10, padding: 4, minWidth: 140, zIndex: 100, boxShadow: "0 4px 24px rgba(29,53,87,0.12)" }}>
                <Link href="/settings" onClick={() => setDropdownOpen(false)} style={{ display: "block", padding: "0.5rem 0.75rem", fontSize: "0.875rem", color: NAVY, textDecoration: "none", borderRadius: 7 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}>
                  Settings
                </Link>
                <button onClick={handleSignOut} style={{ display: "block", width: "100%", textAlign: "left", padding: "0.5rem 0.75rem", fontSize: "0.875rem", color: NAVY, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", borderRadius: 7 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
            <a href="#how-it-works" style={{ fontSize: "0.875rem", fontWeight: 500, color: NAVY, textDecoration: "none" }}>How it works</a>
            <a href="#before-after" style={{ fontSize: "0.875rem", fontWeight: 500, color: NAVY, textDecoration: "none" }}>Examples</a>
            <a href="#pricing" style={{ fontSize: "0.875rem", fontWeight: 500, color: NAVY, textDecoration: "none" }}>Pricing</a>
          </div>
          <Link href="/auth" style={{ background: NAVY, color: "#FFFFFF", fontSize: "0.875rem", fontWeight: 600, padding: "0.45rem 1.1rem", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap" }}>
            Get free report →
          </Link>
        </div>
      )}
    </nav>
  );

  // ── Logged-in view ──────────────────────────────────────────────────────────
  if (user) {
    const firstName = profile?.first_name ?? (user.user_metadata?.first_name as string | undefined) ?? null;
    const isUnlimited = profile?.subscription_tier === "unlimited";
    const canRunReport = isUnlimited || !profile?.free_report_used;

    return (
      <div style={{ background: "#FFFFFF", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {nav}

        {/* Navy hero */}
        <section style={{ background: NAVY, padding: "3rem 2rem" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", gap: "3rem", alignItems: "center" }}>

            {/* Left: all text + form */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "rgba(168,218,220,0.75)", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>
                {firstName ? `WELCOME BACK, ${firstName.toUpperCase()}` : "WELCOME BACK"}
              </p>
              <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 400, color: "#FFFFFF", lineHeight: 1.2, marginBottom: "0.5rem" }}>
                Analyze another listing
              </h1>
              <p style={{ fontSize: "0.9rem", color: "rgba(168,218,220,0.7)", marginBottom: "0.85rem" }}>
                Paste your Airbnb URL for a full ranking analysis and prioritized action plan.
              </p>

              {canRunReport ? (
                <>
                  <NavyUrlForm onNavigate={handleFormNavigate} />
                  <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "rgba(168,218,220,0.5)" }}>
                    {isUnlimited ? "Unlimited reports on your account" : "✓ Free partial report · Upgrade for the full analysis"}
                  </p>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <p style={{ fontSize: "0.9rem", color: "rgba(168,218,220,0.8)", margin: 0 }}>You&apos;ve used your free report.</p>
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    <Link href="/dashboard" style={{ padding: "0.6rem 1.25rem", borderRadius: 8, border: "1px solid rgba(168,218,220,0.5)", color: "#A8DADC", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
                      View my report →
                    </Link>
                    <Link href="/pricing" style={{ padding: "0.6rem 1.25rem", borderRadius: 8, background: RED, color: "#fff", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
                      Unlock full report →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Right: stat boxes, centered against all left content */}
            {canRunReport && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                {[
                  { label: "Total reports",    value: userStats ? String(userStats.total)    : "—" },
                  { label: "Listings tracked", value: userStats ? String(userStats.distinct) : "—" },
                  { label: "Avg. score",       value: userStats ? String(userStats.avgScore) : "—" },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(168,218,220,0.18)", borderRadius: 10, padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 160 }}>
                    <div style={{ fontSize: "1.4rem", fontWeight: 600, color: "#FFFFFF", letterSpacing: "-0.04em", lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(168,218,220,0.65)" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>

        {/* White body */}
        <section style={{ flex: 1, padding: "2.5rem 2rem" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>

            {/* Upsell strip */}
            {!isUnlimited && (
              <div style={{ background: "rgba(230,59,46,0.05)", border: "0.5px solid rgba(230,59,46,0.18)", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <p style={{ fontSize: "0.875rem", color: NAVY, margin: 0 }}>
                  Get the full report — keyword gap analysis, review sentiment, PDF export, and 3 reruns.
                </p>
                <Link href="/pricing" style={{ padding: "0.5rem 1rem", borderRadius: 8, background: RED, color: "#FFFFFF", fontWeight: 600, fontSize: "0.82rem", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Upgrade — from $4 →
                </Link>
              </div>
            )}

            {/* Recent reports */}
            <h2 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "1.1rem", fontWeight: 400, color: NAVY, marginBottom: "1.25rem" }}>
              Recent reports
            </h2>

            {recentReports.length === 0 ? (
              <div style={{ background: "#FAFAF8", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: "2rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.875rem", color: "#7BA3BF", margin: 0 }}>No reports yet. Analyze your first listing above.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {recentReports.map((r) => (
                  <div key={r.id} style={{ background: "#FFFFFF", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <ScoreRing score={r.score} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: NAVY, margin: "0 0 0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.listingName || r.listing_url || "Untitled listing"}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "#7BA3BF", margin: 0 }}>
                        {r.listing_url && (
                          <span style={{ fontFamily: "monospace" }}>
                            {r.listing_url.replace(/^https?:\/\//, "").slice(0, 44)}{r.listing_url.replace(/^https?:\/\//, "").length > 44 ? "…" : ""}
                          </span>
                        )}
                        {r.listing_url && r.created_at ? " · " : ""}
                        {r.created_at ? relativeTime(r.created_at) : ""}
                      </p>
                    </div>
                    <Link href={`/results/${r.id}`} style={{ padding: "0.45rem 1rem", borderRadius: 8, border: "0.5px solid #D1D5DB", color: NAVY, fontWeight: 600, fontSize: "0.8rem", textDecoration: "none", whiteSpace: "nowrap" }}>
                      View →
                    </Link>
                  </div>
                ))}
                {userStats && userStats.total > 3 && (
                  <Link href="/dashboard" style={{ display: "block", textAlign: "center", fontSize: "0.82rem", color: "#457B9D", textDecoration: "none", padding: "0.5rem" }}>
                    View all {userStats.total} reports →
                  </Link>
                )}
              </div>
            )}

          </div>
        </section>

        <SupportSection contactFields={contactFields} setContactFields={setContactFields} contactStatus={contactStatus} handleContact={handleContact} />
        <PageFooter />
      </div>
    );
  }

  // ── Logged-out landing page ─────────────────────────────────────────────────
  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {nav}

      {/* ── Hero ── */}
      <section className="lp-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 620 }}>

        {/* Left — white */}
        <div style={{ background: "#FFFFFF", padding: "5rem 4rem 5rem 5vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 600, color: RED, letterSpacing: "0.12em", marginBottom: "1.25rem" }}>
            AIRBNB SEO &amp; SEARCH RANKING
          </p>
          <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "clamp(2rem, 3.5vw, 2.75rem)", fontWeight: 400, color: NAVY, lineHeight: 1.18, letterSpacing: "-0.01em", marginBottom: "1.1rem" }}>
            Your listing is invisible.<br />
            Let&apos;s <em style={{ color: RED, fontStyle: "italic" }}>fix that.</em>
          </h1>
          <p style={{ fontSize: "1rem", color: "#457B9D", lineHeight: 1.7, marginBottom: "1.75rem", maxWidth: 420 }}>
            Fix My Listing analyzes your listing against Airbnb&apos;s search algorithm, competitor keywords, and every ranking factor — then gives you a step-by-step plan to rank higher.
          </p>
          <HeroForm onNavigate={handleFormNavigate} buttonLabel="Analyze free →" />
          <p style={{ marginTop: "0.9rem", fontSize: "0.75rem", color: "#7BA3BF", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true"><rect x="1" y="5" width="10" height="8" rx="2" stroke="#7BA3BF" strokeWidth="1.3" /><path d="M4 5V3.5a2 2 0 1 1 4 0V5" stroke="#7BA3BF" strokeWidth="1.3" strokeLinecap="round" /></svg>
            First report free · No credit card · Listing data never stored
          </p>
        </div>

        {/* Right — navy browser mockup
            To swap in a <video>: replace the contents of the .lp-hero-right div
            with <video src="..." autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} /> */}
        <div className="lp-hero-right" style={{ background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 2.5rem", position: "relative", overflow: "hidden" }}>
          {/* Subtle grid pattern */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(168,218,220,0.08) 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none" }} />

          {/* Browser frame */}
          <div style={{ width: "100%", maxWidth: 460, borderRadius: 12, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.4)", position: "relative" }}>
            {/* Chrome bar */}
            <div style={{ background: "#1a2a3a", padding: "0.65rem 1rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
              {/* Traffic lights */}
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28CA41" }} />
              </div>
              {/* URL bar */}
              <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "0.25rem 0.75rem", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                airbnb.com/rooms/…
              </div>
            </div>

            {/* Listing body */}
            <div style={{ background: "#FFFFFF" }}>
              {/* Photo placeholder */}
              <div style={{ height: 180, background: "linear-gradient(135deg, #D6E4F0 0%, #BDD0E5 100%)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="14" rx="2" fill="#8BAFC9" />
                  <circle cx="8.5" cy="10.5" r="2" fill="#6A94B8" />
                  <path d="M3 17l5-5 3.5 3.5 4.5-6L21 17" stroke="#6A94B8" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {/* Analyzing pill — top left */}
                <div style={{ position: "absolute", top: "0.7rem", left: "0.7rem", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", borderRadius: 999, padding: "0.3rem 0.7rem", display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <div className="lp-pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#28CA41", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.65rem", color: "#FFFFFF", fontWeight: 500, whiteSpace: "nowrap" }}>Analyzing ranking signals…</span>
                </div>
              </div>

              {/* Title bar */}
              <div style={{ padding: "0.85rem 1rem 0.5rem" }}>
                <div style={{ height: 14, background: "#E5E7EB", borderRadius: 4, width: "78%", marginBottom: "0.45rem" }} />
                <div style={{ height: 11, background: "#F3F4F6", borderRadius: 4, width: "52%" }} />
              </div>

              {/* Meta bar */}
              <div style={{ padding: "0 1rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <div style={{ height: 10, background: "#F3F4F6", borderRadius: 4, width: 48 }} />
                  <div style={{ height: 10, background: "#F3F4F6", borderRadius: 4, width: 36 }} />
                </div>
                <div style={{ height: 13, background: "#E5E7EB", borderRadius: 4, width: 56 }} />
              </div>
            </div>
          </div>

          {/* SEO score badge — bottom-right of frame */}
          <div style={{ position: "absolute", bottom: "3.5rem", right: "2rem", background: RED, borderRadius: 12, padding: "0.65rem 1rem", textAlign: "center", boxShadow: "0 8px 32px rgba(230,59,46,0.4)" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#FFFFFF", lineHeight: 1, letterSpacing: "-0.04em" }}>38</div>
            <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.1em", marginTop: "0.1rem" }}>SEO SCORE</div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ background: NAVY }}>
        <div className="lp-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", maxWidth: 960, margin: "0 auto", padding: "2.25rem 2rem" }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <div className="lp-stat-divider" style={{ width: "0.5px", height: 36, background: "rgba(168,218,220,0.25)", marginRight: "auto" }} />}
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 600, color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(168,218,220,0.75)", marginTop: "0.3rem" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Before / After ── */}
      <section id="before-after" style={{ background: "#FAFAF8", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: RED, letterSpacing: "0.12em", textAlign: "center", marginBottom: "0.6rem" }}>REAL RESULTS</p>
          <h2 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "clamp(1.6rem, 3vw, 2.1rem)", fontWeight: 400, color: NAVY, textAlign: "center", marginBottom: "0.65rem", letterSpacing: "-0.01em" }}>
            What changes after a Fix My Listing report
          </h2>
          <p style={{ color: "#457B9D", textAlign: "center", fontSize: "0.9rem", marginBottom: "3rem" }}>
            Real listings, real results — same price, better ranking.
          </p>

          {/* Two columns: BEFORE (left) | AFTER (right). Each row = one listing. */}
          <div className="lp-ba-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* Left column — all BEFORE cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <BeforeAfterCard
                card={{ position: "Page 4 in search", score: 43, title: "Cozy place in San Diego · Private room", tags: ["Weak title", "No keywords", "56% occupancy"], insight: "Title missing 6 high-volume search terms. Description 40% shorter than top-ranked competitors. No mention of beach proximity despite being 4 min walk." }}
                variant="before"
              />
              <BeforeAfterCard
                card={{ position: "Page 3 in search", score: 38, title: "Modern apartment downtown Austin", tags: ["Generic title", "Missing amenities", "Competitor gap"], insight: "12 competitor listings ranking for '6th Street,' 'live music,' and 'walkable' — none mentioned in listing." }}
                variant="before"
              />
            </div>
            {/* Right column — all AFTER cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <BeforeAfterCard
                card={{ position: "Page 1, position 3", score: 74, title: "4-min walk to beach · Bright private room · Parking + fast WiFi · San Diego", tags: ["SEO title", "Keywords added", "84% occupancy"], insight: "Jumped from page 4 to page 1, position 3. Occupancy 56%→84%. Revenue up $340/mo with zero price change." }}
                variant="after"
              />
              <BeforeAfterCard
                card={{ position: "Top 3 ranked", score: 78, title: "Walk to 6th St · Modern 1BR · Fast WiFi · Rooftop Access · Austin TX", tags: ["Local keywords", "Full amenities", "Top-3 ranked"], insight: "Occupancy 61%→84%. Revenue up $410/mo." }}
                variant="after"
              />
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link href="/auth" style={{ display: "inline-block", background: RED, color: "#FFFFFF", fontWeight: 600, fontSize: "0.95rem", padding: "0.75rem 2rem", borderRadius: 10, textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#C0392B"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = RED; }}>
              See your listing&apos;s potential →
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ background: "#F4F6F8", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: RED, letterSpacing: "0.12em", textAlign: "center", marginBottom: "0.6rem" }}>HOW IT WORKS</p>
          <h2 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "clamp(1.6rem, 3vw, 2.1rem)", fontWeight: 400, color: NAVY, textAlign: "center", marginBottom: "3rem", letterSpacing: "-0.01em" }}>
            From URL to action plan in minutes
          </h2>
          <div className="lp-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
            {STEPS.map((s) => (
              <div key={s.num} style={{ background: "#FFFFFF", border: "0.5px solid #E5E7EB", borderRadius: 14, padding: "2rem 1.75rem", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "2.5rem", fontWeight: 400, color: "rgba(230,59,46,0.18)", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "1.25rem" }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: NAVY, marginBottom: "0.5rem" }}>{s.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "#457B9D", lineHeight: 1.65, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ background: "#FFFFFF", padding: "5rem 2rem", borderTop: "0.5px solid #E5E7EB" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: RED, letterSpacing: "0.12em", textAlign: "center", marginBottom: "0.6rem" }}>PRICING</p>
          <h2 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "clamp(1.6rem, 3vw, 2.1rem)", fontWeight: 400, color: NAVY, textAlign: "center", marginBottom: "0.65rem", letterSpacing: "-0.01em" }}>
            Simple, honest pricing
          </h2>
          <p style={{ color: "#457B9D", textAlign: "center", fontSize: "0.9rem", marginBottom: "3rem" }}>
            Start free. Pay once for one listing, or go unlimited.
          </p>
          <div className="lp-pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>

            {/* Free */}
            <div style={{ background: "#FFFFFF", border: "0.5px solid #E5E7EB", borderRadius: 14, padding: "2rem 1.5rem", display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#457B9D", letterSpacing: "0.1em", marginBottom: "1rem" }}>FREE</p>
              <p style={{ fontSize: "2.2rem", fontWeight: 600, color: NAVY, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "0.2rem" }}>$0</p>
              <p style={{ fontSize: "0.8rem", color: "#7BA3BF", marginBottom: "1.5rem" }}>no credit card</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                {["SEO ranking score", "Top 3 ranking issues", "1 title suggestion"].map((f) => (
                  <li key={f} style={{ fontSize: "0.84rem", color: "#457B9D", display: "flex", gap: "0.5rem" }}>
                    <span style={{ color: "#A8DADC", flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth" style={{ display: "block", textAlign: "center", padding: "0.65rem 1rem", borderRadius: 10, border: "0.5px solid #D1D5DB", color: "#457B9D", fontWeight: 600, fontSize: "0.84rem", textDecoration: "none", background: "#F9FAFB" }}>
                Get free report →
              </Link>
            </div>

            {/* Single — featured */}
            <div style={{ background: "#FFFFFF", border: `2px solid ${NAVY}`, borderRadius: 14, padding: "2rem 1.5rem", display: "flex", flexDirection: "column", position: "relative" }}>
              <div style={{ position: "absolute", top: -1, right: 16, background: NAVY, color: "#FFFFFF", fontSize: "0.6rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "0 0 7px 7px", letterSpacing: "0.06em" }}>
                MOST POPULAR
              </div>
              <p style={{ fontSize: "0.65rem", fontWeight: 700, color: NAVY, letterSpacing: "0.1em", marginBottom: "1rem" }}>SINGLE LISTING</p>
              <p style={{ fontSize: "2.2rem", fontWeight: 600, color: NAVY, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "0.2rem" }}>$4</p>
              <p style={{ fontSize: "0.8rem", color: "#7BA3BF", marginBottom: "1.5rem" }}>one-time</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                {["Full report", "3 reruns on this listing", "3 title rewrites", "Keyword gap analysis", "Review sentiment analysis", "PDF export"].map((f) => (
                  <li key={f} style={{ fontSize: "0.84rem", color: "#457B9D", display: "flex", gap: "0.5rem" }}>
                    <span style={{ color: RED, flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/pricing" style={{ display: "block", textAlign: "center", padding: "0.65rem 1rem", borderRadius: 10, background: RED, color: "#FFFFFF", fontWeight: 600, fontSize: "0.84rem", textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#C0392B"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = RED; }}>
                Get full report — $4 →
              </Link>
            </div>

            {/* Unlimited */}
            <div style={{ background: "#FFFFFF", border: "0.5px solid #E5E7EB", borderRadius: 14, padding: "2rem 1.5rem", display: "flex", flexDirection: "column" }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 700, color: NAVY, letterSpacing: "0.1em", marginBottom: "1rem" }}>UNLIMITED</p>
              <p style={{ fontSize: "2.2rem", fontWeight: 600, color: NAVY, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "0.2rem" }}>$9</p>
              <p style={{ fontSize: "0.8rem", color: "#7BA3BF", marginBottom: "1.5rem" }}>/month · cancel anytime</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                {["Everything in Single, plus:", "Unlimited listings", "Unlimited reruns", "Competitor benchmarking", "All future features", "Priority support"].map((f, i) => (
                  <li key={f} style={{ fontSize: "0.84rem", color: i === 0 ? NAVY : "#457B9D", display: "flex", gap: "0.5rem", fontWeight: i === 0 ? 600 : 400 }}>
                    {i > 0 && <span style={{ color: NAVY, flexShrink: 0 }}>✓</span>}
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/pricing" style={{ display: "block", textAlign: "center", padding: "0.65rem 1rem", borderRadius: 10, background: NAVY, color: "#FFFFFF", fontWeight: 600, fontSize: "0.84rem", textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#152843"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = NAVY; }}>
                Get unlimited — $9/mo →
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ background: "#FAFAF8", padding: "5rem 2rem", borderTop: "0.5px solid #E5E7EB" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: RED, letterSpacing: "0.12em", textAlign: "center", marginBottom: "0.6rem" }}>TESTIMONIALS</p>
          <h2 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "clamp(1.5rem, 2.8vw, 2rem)", fontWeight: 400, color: NAVY, textAlign: "center", marginBottom: "2.5rem", letterSpacing: "-0.01em" }}>
            Hosts who ranked higher
          </h2>
          <div className="lp-testi-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{ background: "#FFFFFF", border: "0.5px solid #E5E7EB", borderRadius: 14, padding: "1.75rem", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                {/* Stars */}
                <div style={{ display: "flex", gap: "0.2rem", marginBottom: "1rem" }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="15" height="15" viewBox="0 0 20 20" fill="#F59E0B">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p style={{ fontSize: "0.9rem", color: NAVY, lineHeight: 1.7, margin: "0 0 1.25rem", fontStyle: "italic" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p style={{ fontSize: "0.8rem", margin: 0 }}>
                  <strong style={{ color: NAVY }}>{t.name}</strong>
                  <span style={{ color: "#7BA3BF" }}> · {t.handle}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{ background: NAVY, padding: "5rem 2rem", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 400, color: "#FFFFFF", lineHeight: 1.25, marginBottom: "1.25rem", letterSpacing: "-0.01em" }}>
            Find out exactly why guests aren&apos;t finding you.
          </h2>
          <HeroForm onNavigate={handleFormNavigate} buttonLabel="Analyze free →" />
          <p style={{ marginTop: "0.9rem", fontSize: "0.75rem", color: "rgba(168,218,220,0.65)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
            <svg width="11" height="13" viewBox="0 0 12 14" fill="none" aria-hidden="true"><rect x="1" y="5" width="10" height="8" rx="2" stroke="rgba(168,218,220,0.65)" strokeWidth="1.3" /><path d="M4 5V3.5a2 2 0 1 1 4 0V5" stroke="rgba(168,218,220,0.65)" strokeWidth="1.3" strokeLinecap="round" /></svg>
            First report free · No credit card · Listing data never stored
          </p>
        </div>
      </section>

      {/* ── Support ── */}
      <SupportSection contactFields={contactFields} setContactFields={setContactFields} contactStatus={contactStatus} handleContact={handleContact} />

      <PageFooter />
    </div>
  );
}

// ─── Shared sub-sections ──────────────────────────────────────────────────────

function SupportSection({
  contactFields,
  setContactFields,
  contactStatus,
  handleContact,
}: {
  contactFields: { name: string; email: string; message: string };
  setContactFields: React.Dispatch<React.SetStateAction<{ name: string; email: string; message: string }>>;
  contactStatus: "idle" | "sending" | "sent" | "error";
  handleContact: (e: React.SyntheticEvent) => void;
}) {
  return (
    <section id="support" style={{ borderTop: "0.5px solid #E5E7EB", background: "#FFFFFF", padding: "4rem 2rem" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "1.25rem", fontWeight: 400, color: NAVY, marginBottom: "0.4rem" }}>Support</h2>
        <p style={{ fontSize: "0.875rem", color: "#457B9D", marginBottom: "2rem" }}>
          Questions or feedback? We usually respond within a few hours.
        </p>
        {contactStatus === "sent" ? (
          <div style={{ background: "rgba(168,218,220,0.2)", border: "0.5px solid #A8DADC", borderRadius: 12, padding: "1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.9rem", color: "#16A34A", fontWeight: 500, margin: 0 }}>Message sent — we&apos;ll be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={handleContact} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <input type="text" placeholder="Your name" value={contactFields.name} onChange={(e) => setContactFields((f) => ({ ...f, name: e.target.value }))} required style={{ height: 42, padding: "0 0.9rem", borderRadius: 10, border: "0.5px solid #D1D5DB", background: "#FFFFFF", color: NAVY, fontSize: "0.875rem", outline: "none", fontFamily: "inherit" }} />
              <input type="email" placeholder="Email address" value={contactFields.email} onChange={(e) => setContactFields((f) => ({ ...f, email: e.target.value }))} required style={{ height: 42, padding: "0 0.9rem", borderRadius: 10, border: "0.5px solid #D1D5DB", background: "#FFFFFF", color: NAVY, fontSize: "0.875rem", outline: "none", fontFamily: "inherit" }} />
            </div>
            <textarea placeholder="How can we help?" value={contactFields.message} onChange={(e) => setContactFields((f) => ({ ...f, message: e.target.value }))} required rows={4} style={{ padding: "0.75rem 0.9rem", borderRadius: 10, border: "0.5px solid #D1D5DB", background: "#FFFFFF", color: NAVY, fontSize: "0.875rem", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.55 }} />
            {contactStatus === "error" && (
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#DC2626" }}>Something went wrong — please try again or email alexkbell25@gmail.com</p>
            )}
            <button type="submit" disabled={contactStatus === "sending"} style={{ height: 42, background: NAVY, color: "#fff", fontWeight: 600, fontSize: "0.875rem", borderRadius: 10, border: "none", cursor: contactStatus === "sending" ? "not-allowed" : "pointer", opacity: contactStatus === "sending" ? 0.7 : 1, fontFamily: "inherit", alignSelf: "flex-start", padding: "0 1.5rem" }}>
              {contactStatus === "sending" ? "Sending…" : "Send message →"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function PageFooter() {
  return (
    <footer style={{ background: DARK_NAVY, padding: "1.5rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
      <Link href="/" style={{ textDecoration: "none" }}>
        <Image src="/logo-full.png" alt="Fix My Listing" height={24} width={120} style={{ height: 24, width: "auto", display: "block", filter: "brightness(0) invert(1)" }} />
      </Link>
      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
        © {new Date().getFullYear()} Fix My Listing. Not affiliated with Airbnb, Inc.
      </p>
    </footer>
  );
}
