"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
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
      <circle cx="9" cy="6.5" r="3" fill="#999" />
      <path d="M2 16c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ free_runs_used: number; is_subscribed: boolean } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [invisibleOpacity, setInvisibleOpacity] = useState(1);
  const [contactFields, setContactFields] = useState({ name: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const t1 = setTimeout(() => setInvisibleOpacity(0), 400);
    const t2 = setTimeout(() => setInvisibleOpacity(1), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
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
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)", display: "flex", flexDirection: "column" }}>

      {/* ── Nav ───────────────────────────────────────────────────────────────── */}
      <nav style={{
        borderBottom: "0.5px solid var(--border)",
        background: "var(--surface)",
        padding: "0 2rem",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <span style={{ fontWeight: 500, fontSize: "1rem", letterSpacing: "-0.01em" }}>
          Fix My <span style={{ color: "var(--accent)" }}>Listing</span>
        </span>

        {user ? (
          /* ── Logged-in nav: My reports + profile dropdown ── */
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <Link href="/dashboard" style={{ fontSize: "0.875rem", color: "var(--muted)", textDecoration: "none" }}>
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
                  background: dropdownOpen ? "#EEEEEE" : "#F5F5F5",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#EEEEEE"; }}
                onMouseLeave={(e) => { if (!dropdownOpen) (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5"; }}
                aria-label="Profile menu"
              >
                <ProfileIcon />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: "#fff",
                  border: "1px solid #E5E5E5",
                  borderRadius: 8,
                  padding: 4,
                  minWidth: 140,
                  zIndex: 100,
                }}>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: "block",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.875rem",
                      color: "var(--text)",
                      textDecoration: "none",
                      borderRadius: 5,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#F5F5F5"; }}
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
                      color: "var(--text)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      borderRadius: 5,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5"; }}
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
            <a href="#how-it-works" style={{ fontSize: "0.875rem", color: "var(--muted)", textDecoration: "none" }}>
              How it works
            </a>
            <a href="#pricing" style={{ fontSize: "0.875rem", color: "var(--muted)", textDecoration: "none" }}>
              Pricing
            </a>
            {/* Sign in link → /auth */}
            <Link href="/auth" style={{ fontSize: "0.875rem", color: "var(--muted)", textDecoration: "none" }}>
              Sign in
            </Link>
            {/* Nav CTA → /auth */}
            <Link
              href="/auth"
              style={{ background: "var(--accent)", color: "#fff", fontSize: "0.875rem", fontWeight: 500, padding: "0.4rem 1rem", borderRadius: "var(--radius)", textDecoration: "none" }}
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
          background: "#FFF8F8",
          padding: user ? "5rem 2rem" : "4.5rem 2rem 3.5rem",
          textAlign: "center",
          flex: !user ? undefined : undefined,
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto" }}>

          {/* Badge — logged-out only */}
          {!user && (
            <div style={{
              display: "inline-block",
              background: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderRadius: 999,
              padding: "0.25rem 0.85rem",
              fontSize: "0.72rem",
              color: "var(--muted)",
              marginBottom: "1.5rem",
              letterSpacing: "0.04em",
            }}>
              AIRBNB SEO & SEARCH RANKING
            </div>
          )}

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(2rem, 5.5vw, 3.1rem)",
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            marginBottom: "0.85rem",
            color: "var(--text)",
          }}>
            {user ? "Find out why you're not ranking" : (
              <>
                Most Airbnb listings<br />
                are{" "}<span style={{ color: "var(--accent)", fontStyle: "italic", opacity: invisibleOpacity, transition: "opacity 0.7s ease-in-out" }}>invisible</span> in search.
              </>
            )}
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: "1rem",
            color: "var(--muted)",
            marginBottom: user ? "1.75rem" : "0.5rem",
            fontStyle: user ? "normal" : "italic",
          }}>
            {user
              ? "Paste your listing URL to run a full Airbnb SEO analysis"
              : "Is yours?"}
          </p>

          {/* Sales copy — logged-out only */}
          {!user && (
            <>
              <p style={{ fontSize: "1.05rem", color: "var(--text)", fontWeight: 500, marginBottom: "1.75rem" }}>
                Fix My Listing analyzes your listing against Airbnb's ranking algorithm, competitor keywords, and search signals — then tells you exactly how to rank higher.
              </p>
              <p style={{ fontSize: "0.69rem", color: "var(--muted)", marginBottom: "0.6rem", letterSpacing: "0.01em" }}>
                🔒 Your listing data is never stored or shared
              </p>
            </>
          )}

          {/* URL input — routes based on auth + credit state */}
          <HeroForm onNavigate={handleFormNavigate} />

          <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--muted)" }}>
            ✓ First report free · Airbnb SEO analysis in minutes · No subscription
          </p>
        </div>
      </section>

      {/* ── How it works — logged-in only ──────────────────────────────────────── */}
      {user && (
        <section style={{ background: "var(--surface)", borderTop: "0.5px solid var(--border)", borderBottom: "0.5px solid var(--border)", padding: "4rem 2rem" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 500, letterSpacing: "-0.025em", marginBottom: "0.5rem", textAlign: "center" }}>How it works</h2>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2.25rem", textAlign: "center" }}>
                {STATS.map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: "1.55rem", fontWeight: 500, letterSpacing: "-0.03em", color: "var(--text)", lineHeight: 1.1 }}>{s.value}</div>
                    <div style={{ fontSize: "0.76rem", color: "var(--muted)", marginTop: "0.3rem" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.65rem", marginBottom: "2rem" }}>
                {TESTIMONIALS.map((t) => (
                  <div key={t.name} style={{ background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem 1.1rem" }}>
                    <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "var(--text)", margin: "0 0 0.65rem", fontStyle: "italic" }}>"{t.quote}"</p>
                    <p style={{ fontSize: "0.76rem", color: "var(--muted)", margin: 0, fontWeight: 500 }}>— {t.name}, <span style={{ fontWeight: 400 }}>{t.handle}</span></p>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.7rem", color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.6rem" }}>As seen in</p>
                <p style={{ fontSize: "0.85rem", color: "#BBBBBB", margin: 0, letterSpacing: "0.02em" }}>Skift&nbsp;&nbsp;·&nbsp;&nbsp;The Points Guy&nbsp;&nbsp;·&nbsp;&nbsp;STR Insider</p>
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
          <section id="pricing" style={{ maxWidth: 720, margin: "0 auto", padding: "4.25rem 2rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 500, letterSpacing: "-0.025em", marginBottom: "0.6rem" }}>Simple pricing</h2>
            <p style={{ color: "var(--muted)", marginBottom: "2.5rem", fontSize: "0.9rem" }}>Pay once. Yours to keep.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.65rem" }}>
              <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem", textAlign: "left" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 500, marginBottom: "0.85rem", letterSpacing: "0.04em" }}>FREE</p>
                <p style={{ fontSize: "2rem", fontWeight: 500, letterSpacing: "-0.03em", marginBottom: "0.2rem" }}>$0</p>
                <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1.5rem" }}>SEO score preview</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {["Search ranking score", "Top 3 ranking blockers", "Keyword gap preview"].map((item) => (
                    <li key={item} style={{ fontSize: "0.845rem", color: "var(--muted)", display: "flex", gap: "0.5rem" }}>
                      <span style={{ color: "var(--accent)" }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                {/* Free CTA → /auth */}
                <Link href="/auth" style={{ display: "block", textAlign: "center", padding: "0.6rem 1rem", borderRadius: "var(--radius)", border: "0.5px solid var(--border)", color: "var(--text)", fontWeight: 500, fontSize: "0.845rem", textDecoration: "none" }}>
                  Start free
                </Link>
              </div>

              <div style={{ background: "var(--surface)", border: "0.5px solid var(--accent)", borderRadius: "var(--radius)", padding: "1.5rem", textAlign: "left", position: "relative" }}>
                <div style={{ position: "absolute", top: -1, right: 18, background: "var(--accent)", color: "#fff", fontSize: "0.68rem", fontWeight: 500, padding: "0.2rem 0.55rem", borderRadius: "0 0 7px 7px", letterSpacing: "0.04em" }}>
                  POPULAR
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 500, marginBottom: "0.85rem", letterSpacing: "0.04em" }}>FULL SEO REPORT</p>
                <p style={{ fontSize: "2rem", fontWeight: 500, letterSpacing: "-0.03em", marginBottom: "0.2rem" }}>$6</p>
                <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1.5rem" }}>One-time · Unlimited reports, forever</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {["Full search ranking score", "Keyword gap analysis vs. competitors", "SEO-optimized title rewrites (3 options)", "Algorithm factor checklist", "Competitor benchmarking (20 listings)", "Full ranking action plan", "PDF export"].map((item) => (
                    <li key={item} style={{ fontSize: "0.845rem", color: "var(--muted)", display: "flex", gap: "0.5rem" }}>
                      <span style={{ color: "var(--accent)" }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                {/* Full report CTA → /auth */}
                <Link href="/auth" style={{ display: "block", textAlign: "center", padding: "0.6rem 1rem", borderRadius: "var(--radius)", background: "var(--accent)", color: "#fff", fontWeight: 500, fontSize: "0.845rem", textDecoration: "none" }}>
                  Get my SEO report →
                </Link>
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
            <div style={{ background: "#F0FFF4", border: "0.5px solid #BBF7D0", borderRadius: "var(--radius)", padding: "1.5rem", textAlign: "center" }}>
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
                  style={{ height: 42, padding: "0 0.9rem", borderRadius: "var(--radius)", border: "0.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.875rem", outline: "none", fontFamily: "inherit" }}
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={contactFields.email}
                  onChange={(e) => setContactFields((f) => ({ ...f, email: e.target.value }))}
                  required
                  style={{ height: 42, padding: "0 0.9rem", borderRadius: "var(--radius)", border: "0.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.875rem", outline: "none", fontFamily: "inherit" }}
                />
              </div>
              <textarea
                placeholder="How can we help?"
                value={contactFields.message}
                onChange={(e) => setContactFields((f) => ({ ...f, message: e.target.value }))}
                required
                rows={4}
                style={{ padding: "0.75rem 0.9rem", borderRadius: "var(--radius)", border: "0.5px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.875rem", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.55 }}
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
        borderTop: "0.5px solid var(--border)",
        padding: "1.25rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>
          Fix My <span style={{ color: "var(--accent)" }}>Listing</span>
        </span>
        <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0 }}>
          © {new Date().getFullYear()} Fix My Listing. Not affiliated with Airbnb, Inc.
        </p>
      </footer>

    </div>
  );
}
