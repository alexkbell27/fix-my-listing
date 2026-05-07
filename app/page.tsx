"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import HeroForm from "./components/HeroForm";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const FEATURES = [
  { icon: "✦", title: "Keyword Gap Analysis", body: "See the exact search terms your top competitors rank for that your listing is completely missing." },
  { icon: "✦", title: "SEO Title Rewrites", body: "Get 3 ready-to-use titles written around the keywords guests actually search — not generic descriptions." },
  { icon: "✦", title: "Algorithm Factor Audit", body: "We check every signal Airbnb's search algorithm uses — instant book, response rate, photo count, and more." },
  { icon: "✦", title: "Competitor Benchmarking", body: "Your listing ranked against up to 20 nearby listings with similar bedroom counts and price range." },
  { icon: "✦", title: "Pricing Intelligence", body: "Benchmark your nightly rate against local comps and find out if your price is hurting your search position." },
  { icon: "✦", title: "Search Ranking Score", body: "A 0–100 ranking score across every algorithm factor — so you know exactly what's holding you back." },
];

const STEPS = [
  { num: "01", title: "Paste your URL", body: "Drop in your Airbnb listing link. We pull title, description, amenities, photos, and pricing automatically." },
  { num: "02", title: "SEO analysis runs", body: "We score your listing against Airbnb's ranking algorithm, analyze competitor keywords, and find every gap." },
  { num: "03", title: "Get your ranking report", body: "A prioritized fix plan lands on your screen — with SEO-optimized titles ready to copy and paste." },
];

const STATS = [
  { value: "2,300+", label: "listings ranked higher" },
  { value: "+$340/mo", label: "avg. revenue lift" },
  { value: "+14", label: "avg. search positions gained" },
];

const TESTIMONIALS = [
  { quote: "I had no idea my title was missing the keywords guests actually search for. After fixing it I jumped from page 4 to page 1 in my area.", name: "Sarah K.", handle: "San Diego Superhost" },
  { quote: "The keyword gap analysis alone was worth it. My listing went from 61% to 84% occupancy in 6 weeks.", name: "Marcus T.", handle: "Austin host" },
];

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="6.5" r="3" fill="#457B9D" />
      <path d="M2 16c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#457B9D" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ free_runs_used: number; is_subscribed: boolean } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [invisibleOpacity, setInvisibleOpacity] = useState(0);
  const [contactFields, setContactFields] = useState({ name: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const t = setTimeout(() => setInvisibleOpacity(1), 50);
    return () => clearTimeout(t);
  }, []);

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
      .select("free_runs_used, is_subscribed")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Close dropdown on outside click
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
    } else if (profile?.is_subscribed || (profile?.free_runs_used ?? 0) < 1) {
      router.push(`/analyze?url=${encoded}`);
    } else {
      router.push(`/pricing?url=${encoded}`);
    }
  }, [user, profile, router]);

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text-primary)", display: "flex", flexDirection: "column" }}>

      {/* ── Nav ───────────────────────────────────────────────────────────────── */}
      <nav style={{
        background: "#FFFFFF",
        borderBottom: "0.5px solid var(--color-border)",
        padding: "0 2rem",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image src="/logo-full.png" alt="Fix My Listing" height={30} width={150} style={{ height: 30, width: "auto" }} />
        </Link>

        {user ? (
          /* ── Logged-in nav ── */
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <Link href="/dashboard" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1D3557", textDecoration: "none" }}>
              My Reports →
            </Link>

            {/* Profile icon + dropdown */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: dropdownOpen ? "rgba(29,53,87,0.08)" : "rgba(29,53,87,0.05)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(29,53,87,0.08)"; }}
                onMouseLeave={(e) => { if (!dropdownOpen) (e.currentTarget as HTMLButtonElement).style.background = "rgba(29,53,87,0.05)"; }}
                aria-label="Profile menu"
              >
                <ProfileIcon />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "#FFFFFF",
                  border: "1px solid #A8DADC",
                  borderRadius: 10,
                  padding: 4,
                  minWidth: 140,
                  zIndex: 100,
                  boxShadow: "0 4px 24px rgba(29,53,87,0.12)",
                }}>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: "block",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.875rem",
                      color: "#1D3557",
                      textDecoration: "none",
                      borderRadius: 7,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#F1FAEE"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.875rem",
                      color: "#1D3557",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      borderRadius: 7,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F1FAEE"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Logged-out nav ── */
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <a href="#how-it-works" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1D3557", textDecoration: "none" }}>
                How it works
              </a>
              <a href="#pricing" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1D3557", textDecoration: "none" }}>
                Pricing
              </a>
              <Link href="/auth" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1D3557", textDecoration: "none" }}>
                Sign in
              </Link>
            </div>
            <Link
              href="/auth"
              style={{ background: "#E63946", color: "#fff", fontSize: "0.875rem", fontWeight: 600, padding: "0.45rem 1rem", borderRadius: 8, textDecoration: "none" }}
            >
              Get report
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero — shown in both states ────────────────────────────────────────── */}
      <section
        id="hero-input"
        style={{
          background: "#1D3557",
          padding: user ? "5rem 2rem" : "5rem 2rem 4rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 580, margin: "0 auto" }}>

          {/* Badge — logged-out only */}
          {!user && (
            <div style={{
              display: "inline-block",
              background: "rgba(168,218,220,0.15)",
              border: "0.5px solid rgba(168,218,220,0.4)",
              borderRadius: 999,
              padding: "0.25rem 0.9rem",
              fontSize: "0.7rem",
              color: "#A8DADC",
              marginBottom: "1.5rem",
              letterSpacing: "0.1em",
              fontWeight: 300,
            }}>
              AIRBNB SEO & SEARCH RANKING
            </div>
          )}

          {/* Headline */}
          <h1 style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontStyle: "italic",
            fontSize: "clamp(2rem, 5.5vw, 3.2rem)",
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            marginBottom: "0.85rem",
            color: "#F1FAEE",
          }}>
            {user ? "Find out why you're not ranking" : (
              <>
                Most Airbnb listings<br />
                are{" "}<span style={{ color: "#E63946", opacity: invisibleOpacity, transition: "opacity 5s ease-out" }}>invisible</span> in search.
              </>
            )}
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: "1.05rem",
            color: "#A8DADC",
            marginBottom: user ? "1.75rem" : "0.5rem",
          }}>
            {user
              ? "Paste your listing URL to run a full Airbnb SEO analysis"
              : "Is yours?"}
          </p>

          {/* Sales copy — logged-out only */}
          {!user && (
            <>
              <p style={{ fontSize: "1rem", color: "rgba(241,250,238,0.8)", fontWeight: 400, marginBottom: "1.75rem", lineHeight: 1.7 }}>
                Fix My Listing analyzes your listing against Airbnb's ranking algorithm, competitor keywords, and search signals — then tells you exactly how to rank higher.
              </p>
              <p style={{ fontSize: "0.72rem", color: "rgba(168,218,220,0.7)", marginBottom: "0.75rem", letterSpacing: "0.01em" }}>
                🔒 Your listing data is never stored or shared
              </p>
            </>
          )}

          {/* URL input — routes based on auth + credit state */}
          <HeroForm onNavigate={handleFormNavigate} />

          <p style={{ marginTop: "0.85rem", fontSize: "0.78rem", color: "rgba(168,218,220,0.8)" }}>
            {user
              ? profile?.is_subscribed
                ? "Welcome back — unlimited reports on your account"
                : (profile?.free_runs_used ?? 0) < 1
                  ? "✓ 1 free report remaining on your account"
                  : "You've used your free report"
              : "✓ First report free · Airbnb SEO analysis in minutes · No subscription"}
          </p>
          {user && !profile?.is_subscribed && (profile?.free_runs_used ?? 0) >= 1 && (
            <Link
              href="/pricing"
              style={{
                display: "inline-block",
                marginTop: "0.75rem",
                padding: "0.55rem 1.25rem",
                background: "#E63946",
                color: "#fff",
                borderRadius: 8,
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Unlock unlimited access — $6 →
            </Link>
          )}
        </div>
      </section>

      {/* ── How it works — logged-in only ──────────────────────────────────────── */}
      {user && (
        <section style={{ background: "var(--color-background)", borderTop: "none", borderBottom: "0.5px solid var(--color-border)", padding: "4rem 2rem" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 400, letterSpacing: "-0.01em", marginBottom: "0.5rem", textAlign: "center", color: "#1D3557" }}>How it works</h2>
            <p style={{ color: "var(--muted)", textAlign: "center", marginBottom: "2.75rem", fontSize: "0.875rem" }}>From URL to action plan in minutes.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {STEPS.map((s) => (
                <div key={s.num} style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "var(--radius)", border: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 500, color: "var(--accent)", letterSpacing: "0.03em" }}>
                    {s.num}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 500, fontSize: "0.95rem", marginBottom: "0.3rem" }}>{s.title}</h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── All sections below are logged-out only ─────────────────────────────── */}
      {!user && (
        <>
          <div style={{ height: 1, background: "#F0F0F0" }} />

          {/* Stats + Testimonials + As seen in */}
          <section style={{ background: "var(--surface)", borderBottom: "0.5px solid var(--border)", padding: "2.5rem 2rem" }}>
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2.25rem", textAlign: "center" }}>
                {STATS.map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: "1.55rem", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--text)", lineHeight: 1.1 }}>{s.value}</div>
                    <div style={{ fontSize: "0.76rem", color: "var(--muted)", marginTop: "0.3rem" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.65rem", marginBottom: "2rem" }}>
                {TESTIMONIALS.map((t) => (
                  <div key={t.name} style={{ background: "#FFFFFF", borderLeft: "3px solid #A8DADC", borderRadius: "var(--radius)", padding: "1rem 1.1rem" }}>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "#1D3557", margin: "0 0 0.65rem", fontStyle: "italic" }}>"{t.quote}"</p>
                    <p style={{ fontSize: "0.76rem", color: "#457B9D", margin: 0, fontWeight: 600 }}>— {t.name}, <span style={{ fontWeight: 400 }}>{t.handle}</span></p>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.7rem", color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.6rem" }}>As seen in</p>
                <p style={{ fontSize: "0.85rem", color: "#A8DADC", margin: 0, letterSpacing: "0.02em" }}>Skift&nbsp;&nbsp;·&nbsp;&nbsp;The Points Guy&nbsp;&nbsp;·&nbsp;&nbsp;STR Insider</p>
              </div>
            </div>
          </section>

          {/* Features grid */}
          <section style={{ maxWidth: 960, margin: "0 auto", padding: "4.25rem 2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 500, letterSpacing: "-0.025em", marginBottom: "0.6rem", textAlign: "center" }}>
              Everything Airbnb's algorithm looks at
            </h2>
            <p style={{ color: "var(--muted)", textAlign: "center", marginBottom: "2.5rem", fontSize: "0.9rem" }}>One report. Every ranking factor covered.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.65rem" }}>
              {FEATURES.map((f) => (
                <div key={f.title} style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "1.1rem 1.25rem" }}>
                  <span style={{ color: "var(--accent)", fontSize: "0.85rem", display: "block", marginBottom: "0.6rem" }}>{f.icon}</span>
                  <h3 style={{ fontWeight: 500, fontSize: "0.9rem", marginBottom: "0.4rem" }}>{f.title}</h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.835rem", lineHeight: 1.55, margin: 0 }}>{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section id="how-it-works" style={{ background: "var(--surface)", borderTop: "0.5px solid var(--border)", borderBottom: "0.5px solid var(--border)", padding: "4.25rem 2rem" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 500, letterSpacing: "-0.025em", marginBottom: "0.6rem", textAlign: "center" }}>How it works</h2>
              <p style={{ color: "var(--muted)", textAlign: "center", marginBottom: "3rem", fontSize: "0.9rem" }}>From URL to action plan in minutes.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {STEPS.map((s, i) => (
                  <div key={s.num} style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
                    <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "var(--radius)", border: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 500, color: "var(--accent)", letterSpacing: "0.03em" }}>
                      {s.num}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 500, fontSize: "0.95rem", marginBottom: "0.3rem" }}>{s.title}</h3>
                      <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>{s.body}</p>
                      {i < STEPS.length - 1 && (
                        <div style={{ width: 1, height: 20, background: "var(--border)", marginTop: "1rem", marginLeft: 36 / 2 - 0.5 - 26 }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" style={{ background: "var(--surface)", borderTop: "0.5px solid var(--border)", borderBottom: "0.5px solid var(--border)", padding: "4.25rem 2rem", textAlign: "center" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 500, letterSpacing: "-0.025em", marginBottom: "0.6rem" }}>Simple pricing</h2>
              <p style={{ color: "var(--muted)", marginBottom: "2.5rem", fontSize: "0.9rem" }}>Your first report is on us. Pay once to run unlimited reports, forever.</p>
              <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", textAlign: "left" }}>

                {/* Free tier */}
                <div style={{ background: "#FFFFFF", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "1.75rem", display: "flex", flexDirection: "column" }}>
                  <p style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 500, marginBottom: "0.85rem", letterSpacing: "0.07em" }}>FIRST REPORT</p>
                  <p style={{ fontSize: "2.1rem", fontWeight: 500, letterSpacing: "-0.03em", marginBottom: "0.2rem", lineHeight: 1 }}>$0</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1.5rem" }}>No credit card required</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                    {[
                      "Full ranking score (0–100)",
                      "All 7 audit sections",
                      "Keyword gap vs. competitors",
                      "3 SEO-optimized title rewrites",
                      "Ranked action plan",
                      "PDF export",
                    ].map((item) => (
                      <li key={item} style={{ fontSize: "0.845rem", color: "var(--muted)", display: "flex", gap: "0.5rem" }}>
                        <span style={{ color: "var(--accent)", flexShrink: 0 }}>✓</span> {item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth" style={{ display: "block", textAlign: "center", padding: "0.65rem 1rem", borderRadius: "var(--radius)", border: "0.5px solid var(--border)", color: "var(--text)", fontWeight: 500, fontSize: "0.845rem", textDecoration: "none" }}>
                    Get my free report →
                  </Link>
                </div>

                {/* Paid tier */}
                <div style={{ background: "var(--surface)", border: "0.5px solid var(--accent)", borderRadius: "var(--radius)", padding: "1.75rem", display: "flex", flexDirection: "column", position: "relative" }}>
                  <div style={{ position: "absolute", top: -1, right: 18, background: "var(--accent)", color: "#fff", fontSize: "0.68rem", fontWeight: 500, padding: "0.2rem 0.55rem", borderRadius: "0 0 7px 7px", letterSpacing: "0.04em" }}>
                    BEST VALUE
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 500, marginBottom: "0.85rem", letterSpacing: "0.07em" }}>UNLIMITED ACCESS</p>
                  <p style={{ fontSize: "2.1rem", fontWeight: 500, letterSpacing: "-0.03em", marginBottom: "0.2rem", lineHeight: 1 }}>$6</p>
                  <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1.5rem" }}>One-time · Never pay again</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                    {[
                      "Everything in Free",
                      "Unlimited reports on any listing",
                      "Re-run anytime after updates",
                      "Track ranking improvements over time",
                    ].map((item) => (
                      <li key={item} style={{ fontSize: "0.845rem", color: "var(--muted)", display: "flex", gap: "0.5rem" }}>
                        <span style={{ color: "var(--accent)", flexShrink: 0 }}>✓</span> {item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth" style={{ display: "block", textAlign: "center", padding: "0.65rem 1rem", borderRadius: "var(--radius)", background: "#E63946", color: "#fff", fontWeight: 500, fontSize: "0.845rem", textDecoration: "none" }}>
                    Unlock unlimited →
                  </Link>
                </div>

              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section style={{ background: "var(--surface)", borderTop: "0.5px solid var(--border)", padding: "4.25rem 2rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 500, letterSpacing: "-0.025em", marginBottom: "0.75rem" }}>
              Find out exactly why guests aren't finding you.
            </h2>
            <p style={{ color: "var(--muted)", marginBottom: "0.5rem", fontSize: "0.9rem" }}>✓ First report free · Airbnb SEO analysis in minutes · No subscription</p>
            <p style={{ fontSize: "0.69rem", color: "var(--muted)", marginBottom: "1.5rem" }}>🔒 Your listing data is never stored or shared</p>
            {/* Bottom CTA → /auth */}
            <Link href="/auth" className="cta-hover" style={{ background: "var(--accent)", color: "#fff", fontWeight: 500, fontSize: "0.95rem", padding: "0.75rem 2.25rem", borderRadius: "var(--radius)", textDecoration: "none", display: "inline-block" }}>
              Get my SEO report →
            </Link>
          </section>
        </>
      )}

      {/* ── Support — always visible ──────────────────────────────────────────── */}
      <section id="support" style={{ borderTop: "0.5px solid var(--border)", background: "var(--surface)", padding: "4rem 2rem" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 500, letterSpacing: "-0.025em", marginBottom: "0.4rem" }}>
            Support
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "2rem" }}>
            Questions or feedback? We usually respond within a few hours.
          </p>

          {contactStatus === "sent" ? (
            <div style={{ background: "rgba(168,218,220,0.25)", border: "0.5px solid #A8DADC", borderRadius: "var(--radius)", padding: "1.5rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.9rem", color: "#16A34A", fontWeight: 500, margin: 0 }}>
                Message sent — we'll be in touch soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContact} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={contactFields.name}
                  onChange={(e) => setContactFields((f) => ({ ...f, name: e.target.value }))}
                  required
                  style={{ height: 42, padding: "0 0.9rem", borderRadius: "var(--radius)", border: "0.5px solid var(--border)", background: "#FFFFFF", color: "var(--text)", fontSize: "0.875rem", outline: "none", fontFamily: "inherit" }}
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={contactFields.email}
                  onChange={(e) => setContactFields((f) => ({ ...f, email: e.target.value }))}
                  required
                  style={{ height: 42, padding: "0 0.9rem", borderRadius: "var(--radius)", border: "0.5px solid var(--border)", background: "#FFFFFF", color: "var(--text)", fontSize: "0.875rem", outline: "none", fontFamily: "inherit" }}
                />
              </div>
              <textarea
                placeholder="How can we help?"
                value={contactFields.message}
                onChange={(e) => setContactFields((f) => ({ ...f, message: e.target.value }))}
                required
                rows={4}
                style={{ padding: "0.75rem 0.9rem", borderRadius: "var(--radius)", border: "0.5px solid var(--border)", background: "#FFFFFF", color: "var(--text)", fontSize: "0.875rem", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.55 }}
              />
              {contactStatus === "error" && (
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#DC2626" }}>
                  Something went wrong — please try again or email us directly at alexkbell25@gmail.com
                </p>
              )}
              <button
                type="submit"
                disabled={contactStatus === "sending"}
                style={{ height: 42, background: "var(--accent)", color: "#fff", fontWeight: 500, fontSize: "0.875rem", borderRadius: "var(--radius)", border: "none", cursor: contactStatus === "sending" ? "not-allowed" : "pointer", opacity: contactStatus === "sending" ? 0.7 : 1, fontFamily: "inherit", alignSelf: "flex-start", padding: "0 1.5rem" }}
              >
                {contactStatus === "sending" ? "Sending…" : "Send message →"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer — always visible ────────────────────────────────────────────── */}
      <footer style={{
        background: "#FFFFFF",
        borderTop: "0.5px solid var(--color-border)",
        padding: "1.25rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <Image src="/logo-full.png" alt="Fix My Listing" height={24} width={120} style={{ height: 24, width: "auto" }} />
        <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0 }}>
          © {new Date().getFullYear()} Fix My Listing. Not affiliated with Airbnb, Inc.
        </p>
      </footer>

    </div>
  );
}
