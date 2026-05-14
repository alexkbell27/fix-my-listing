"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";

const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

const SINGLE_FEATURES = [
  "Full report for 1 listing",
  "3 reruns on the same listing",
  "Title & description rewrites",
  "SEO keyword analysis",
  "Review sentiment analysis",
  "Pricing benchmarks",
  "PDF export",
];

const UNLIMITED_FEATURES = [
  "Everything in Single, plus:",
  "Unlimited listings",
  "Unlimited reruns",
  "Competitor benchmarking",
  "All future features",
  "Priority support",
];

const FAQ = [
  {
    q: "What counts as a rerun?",
    a: "Each time you re-analyze the same listing URL it uses one run. Useful after you've made changes to see your new score.",
  },
  {
    q: "Can I switch listings on the $4 plan?",
    a: "The $4 plan covers one listing URL with 3 runs. For multiple listings, the $9/month plan is the better value.",
  },
  {
    q: "How do I cancel?",
    a: "From your settings page at any time. You keep access until the end of your billing period.",
  },
];

function PricingInner() {
  const router = useRouter();
  const [loading, setLoading] = useState<"single" | "unlimited" | null>(null);
  const [error, setError] = useState("");
  const [betaEmail, setBetaEmail] = useState("");

  const handleCheckout = async (tier: "single" | "unlimited") => {
    setLoading(tier);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/auth?tab=signup&next=${encodeURIComponent("/pricing")}`);
      return;
    }

    try {
      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleBetaSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const dest = betaEmail
      ? `/auth?tab=signup&email=${encodeURIComponent(betaEmail)}`
      : `/auth?tab=signup`;
    router.push(dest);
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-background)", padding: "0" }}>

      {/* Nav */}
      <nav style={{ background: "#FFFFFF", borderBottom: "0.5px solid var(--color-border)", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image src="/logo-full.png" alt="Fix My Listing" height={30} width={150} style={{ height: 30, width: "auto" }} />
        </Link>
        <Link href="/dashboard" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1D3557", textDecoration: "none" }}>My Reports</Link>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 2rem 6rem" }}>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "2.75rem" }}>
          {!PAYMENTS_ENABLED && (
            <div style={{ display: "inline-block", background: "rgba(230,57,70,0.08)", border: "0.5px solid rgba(230,57,70,0.25)", borderRadius: 999, padding: "0.3rem 0.9rem", fontSize: "0.72rem", fontWeight: 600, color: "#E63946", letterSpacing: "0.06em", marginBottom: "1rem" }}>
              BETA — ALL FREE
            </div>
          )}
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "0.5rem", color: "#1D3557" }}>
            {PAYMENTS_ENABLED ? "Choose your plan" : "Free while we're in beta"}
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--muted)" }}>
            {PAYMENTS_ENABLED ? "Start free. Upgrade when you're ready." : "All features are free right now. No credit card, no catch."}
          </p>
        </div>

        {PAYMENTS_ENABLED ? (
          <>
            {/* Two-tier cards */}
            <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "3.5rem" }}>

              {/* Single — $4 */}
              <div style={{ background: "#FFFFFF", border: "1px solid #A8DADC", borderRadius: "var(--radius)", padding: "2rem", display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "0.85rem" }}>SINGLE LISTING</p>
                <p style={{ fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "0.2rem", color: "#1D3557" }}>$4</p>
                <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1.75rem" }}>one-time</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: "0.55rem", flex: 1 }}>
                  {SINGLE_FEATURES.map((f) => (
                    <li key={f} style={{ fontSize: "0.845rem", color: "var(--muted)", display: "flex", gap: "0.5rem" }}>
                      <span style={{ color: "#E63946", flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout("single")}
                  disabled={loading !== null}
                  style={{ width: "100%", height: 44, background: "#FFFFFF", border: "1.5px solid #E63946", color: "#E63946", fontWeight: 600, fontSize: "0.9rem", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", opacity: loading === "single" ? 0.6 : 1, fontFamily: "inherit", transition: "background 0.12s, color 0.12s" }}
                  onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.background = "#E63946"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; (e.currentTarget as HTMLButtonElement).style.color = "#E63946"; }}
                >
                  {loading === "single" ? "Redirecting…" : "Get full report — $4 →"}
                </button>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", textAlign: "center", marginTop: "0.6rem" }}>
                  One-time charge, no subscription
                </p>
              </div>

              {/* Unlimited — $9/mo */}
              <div style={{ background: "#FFFFFF", border: "2px solid #457B9D", borderRadius: "var(--radius)", padding: "2rem", display: "flex", flexDirection: "column", position: "relative" }}>
                <div style={{ position: "absolute", top: -1, right: 16, background: "#457B9D", color: "#FFFFFF", fontSize: "0.65rem", fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: "0 0 7px 7px", letterSpacing: "0.05em" }}>
                  MOST POPULAR
                </div>
                <p style={{ fontSize: "0.7rem", color: "#457B9D", fontWeight: 600, letterSpacing: "0.07em", marginBottom: "0.85rem" }}>UNLIMITED</p>
                <p style={{ fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "0.15rem", color: "#1D3557" }}>$9</p>
                <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "0.1rem" }}>/month</p>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "1.75rem" }}>cancel anytime</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: "0.55rem", flex: 1 }}>
                  {UNLIMITED_FEATURES.map((f, i) => (
                    <li key={f} style={{ fontSize: "0.845rem", color: i === 0 ? "var(--text)" : "var(--muted)", display: "flex", gap: "0.5rem", fontWeight: i === 0 ? 500 : 400 }}>
                      {i > 0 && <span style={{ color: "#E63946", flexShrink: 0 }}>✓</span>} {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout("unlimited")}
                  disabled={loading !== null}
                  style={{ width: "100%", height: 44, background: "#E63946", border: "none", color: "#fff", fontWeight: 600, fontSize: "0.9rem", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", opacity: loading === "unlimited" ? 0.6 : 1, fontFamily: "inherit" }}
                >
                  {loading === "unlimited" ? "Redirecting…" : "Get unlimited access — $9/mo →"}
                </button>
                <p style={{ fontSize: "0.72rem", color: "var(--muted)", textAlign: "center", marginTop: "0.6rem" }}>
                  Cancel anytime from your settings
                </p>
              </div>

            </div>

            {error && (
              <p style={{ fontSize: "0.82rem", color: "#DC2626", textAlign: "center", marginBottom: "1.5rem" }}>{error}</p>
            )}

            {/* FAQ */}
            <div style={{ maxWidth: 520, margin: "0 auto" }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "1.5rem", textAlign: "center" }}>
                FAQ
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {FAQ.map(({ q, a }) => (
                  <div key={q}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.3rem" }}>{q}</p>
                    <p style={{ fontSize: "0.845rem", color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Beta — free signup capture */
          <div style={{ maxWidth: 380, margin: "0 auto", background: "#FFFFFF", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "2rem", textAlign: "left" }}>
            <p style={{ fontSize: "2.1rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "0.15rem", lineHeight: 1, color: "#1D3557" }}>$0</p>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1.75rem" }}>Free during beta · No credit card required</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {[...SINGLE_FEATURES, "Unlimited reports"].map((f) => (
                <li key={f} style={{ fontSize: "0.845rem", color: "var(--muted)", display: "flex", gap: "0.5rem" }}>
                  <span style={{ color: "#E63946", flexShrink: 0 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <form onSubmit={handleBetaSignup} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={betaEmail}
                onChange={(e) => setBetaEmail(e.target.value)}
                style={{ width: "100%", height: 44, padding: "0 0.9rem", borderRadius: 8, border: "1px solid #457B9D", background: "#fff", color: "#1D3557", fontSize: "0.875rem", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              />
              <button
                type="submit"
                style={{ width: "100%", height: 44, background: "#E63946", color: "#fff", fontWeight: 600, fontSize: "0.9rem", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Get free access →
              </button>
            </form>
          </div>
        )}

      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingInner />
    </Suspense>
  );
}
