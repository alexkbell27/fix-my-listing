"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

const FEATURES = [
  "Airbnb search ranking score",
  "Keyword gap analysis vs. top competitors",
  "SEO-optimized title rewrites (3 options)",
  "Algorithm factor checklist",
  "Competitor benchmarking (up to 20 listings)",
  "Full ranking action plan",
  "PDF export",
  "Unlimited reports forever",
];

function PricingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const listingUrl = searchParams.get("url") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [betaEmail, setBetaEmail] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingUrl }),
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
      setLoading(false);
    }
  };

  const handleBetaSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const dest = betaEmail
      ? `/auth?tab=signup&email=${encodeURIComponent(betaEmail)}${listingUrl ? `&next=${encodeURIComponent(`/analyze?url=${listingUrl}`)}` : ""}`
      : `/auth?tab=signup${listingUrl ? `&next=${encodeURIComponent(`/analyze?url=${listingUrl}`)}` : ""}`;
    router.push(dest);
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-background)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>

      {/* Logo */}
      <Link href="/" style={{ display: "inline-block", marginBottom: "2.5rem" }}>
        <Image src="/logo-full.png" alt="Fix My Listing" height={40} width={200} style={{ height: 40, width: "auto", display: "block" }} />
      </Link>

      {/* Pricing card */}
      <div style={{ width: "100%", maxWidth: 340, background: "var(--surface)", border: "0.5px solid var(--accent)", borderRadius: "var(--radius)", padding: "2rem", position: "relative" }}>
        <div style={{ position: "absolute", top: -1, right: 18, background: "var(--accent)", color: "#fff", fontSize: "0.68rem", fontWeight: 500, padding: "0.2rem 0.55rem", borderRadius: "0 0 7px 7px", letterSpacing: "0.04em" }}>
          {PAYMENTS_ENABLED ? "POPULAR" : "BETA"}
        </div>

        <p style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 500, marginBottom: "0.5rem", letterSpacing: "0.04em" }}>
          AIRBNB SEO REPORT
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
          A full search ranking audit for your listing. See exactly where you rank, why, and how to climb higher.
        </p>
        <p style={{ fontSize: "2.25rem", fontWeight: 500, letterSpacing: "-0.04em", marginBottom: "0.15rem", lineHeight: 1 }}>
          {PAYMENTS_ENABLED ? "$6" : "Free"}
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1.75rem" }}>
          {PAYMENTS_ENABLED ? "one-time · Unlimited reports, forever" : "During beta · No credit card required"}
        </p>

        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {FEATURES.map((f) => (
            <li key={f} style={{ fontSize: "0.875rem", color: "var(--muted)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ color: "var(--accent)", flexShrink: 0 }}>✓</span> {f}
            </li>
          ))}
        </ul>

        {PAYMENTS_ENABLED ? (
          <>
            <button
              onClick={handleCheckout}
              disabled={loading}
              style={{ width: "100%", height: 44, background: "#E63946", color: "#fff", fontWeight: 600, fontSize: "0.9rem", borderRadius: 8, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}
            >
              {loading ? "Redirecting…" : "Unlock my full SEO report →"}
            </button>
            {error && (
              <p style={{ margin: "0.75rem 0 0", fontSize: "0.78rem", color: "#DC2626", textAlign: "center" }}>
                {error}
              </p>
            )}
            <p style={{ margin: "1.25rem 0 0", fontSize: "0.78rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>
              First report always free. No subscription. Pay once.
            </p>
          </>
        ) : (
          <>
            <div style={{ background: "rgba(69,123,157,0.08)", border: "0.5px solid rgba(69,123,157,0.25)", borderRadius: 8, padding: "0.85rem 1rem", marginBottom: "1.25rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1D3557", margin: "0 0 0.2rem" }}>
                Free during beta
              </p>
              <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                Sign up to get unlimited reports while we&apos;re in beta.
              </p>
            </div>
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
          </>
        )}
      </div>

      <Link href="/dashboard" style={{ marginTop: "1.5rem", fontSize: "0.82rem", color: "var(--muted)", textDecoration: "none" }}>
        ← Back to dashboard
      </Link>

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
