"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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
  const listingUrl = searchParams.get("url") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>

      {/* Logo */}
      <Link href="/" style={{ fontWeight: 500, fontSize: "1.1rem", letterSpacing: "-0.01em", textDecoration: "none", color: "var(--text)", marginBottom: "2.5rem" }}>
        Fix My <span style={{ color: "var(--accent)" }}>Listing</span>
      </Link>

      {/* Pricing card */}
      <div style={{ width: "100%", maxWidth: 340, background: "var(--surface)", border: "0.5px solid var(--accent)", borderRadius: "var(--radius)", padding: "2rem", position: "relative" }}>
        <div style={{ position: "absolute", top: -1, right: 18, background: "var(--accent)", color: "#fff", fontSize: "0.68rem", fontWeight: 500, padding: "0.2rem 0.55rem", borderRadius: "0 0 7px 7px", letterSpacing: "0.04em" }}>
          POPULAR
        </div>

        <p style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 500, marginBottom: "0.5rem", letterSpacing: "0.04em" }}>
          AIRBNB SEO REPORT
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
          A full search ranking audit for your listing. See exactly where you rank, why, and how to climb higher.
        </p>
        <p style={{ fontSize: "2.25rem", fontWeight: 500, letterSpacing: "-0.04em", marginBottom: "0.15rem", lineHeight: 1 }}>
          $6
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1.75rem" }}>
          one-time · Unlimited reports, forever
        </p>

        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.75rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {FEATURES.map((f) => (
            <li key={f} style={{ fontSize: "0.875rem", color: "var(--muted)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ color: "var(--accent)", flexShrink: 0 }}>✓</span> {f}
            </li>
          ))}
        </ul>

        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{ width: "100%", height: 44, background: "var(--accent)", color: "#fff", fontWeight: 500, fontSize: "0.9rem", borderRadius: "var(--radius)", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}
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
