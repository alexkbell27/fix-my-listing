"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function hashSeed(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h;
}

function seededInt(seed: number, offset: number, min: number, max: number): number {
  const x = Math.sin(seed + offset) * 10000;
  const t = x - Math.floor(x);
  return Math.floor(min + t * (max - min + 1));
}

// ─── Loading screen ───────────────────────────────────────────────────────────

const LOADING_STEPS = [
  "Fetching listing data…",
  "Scanning title keywords…",
  "Analyzing competitor listings…",
  "Checking algorithm signals…",
  "Identifying keyword gaps…",
  "Running search ranking audit…",
  "Building your fix plan…",
  "Finalizing your SEO report…",
];

function LoadingScreen({ listingId }: { listingId: string }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const total = 10000;
    const stepInterval = total / LOADING_STEPS.length;
    const tick = 80;

    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + (tick / total) * 100, 99);
        const step = Math.min(Math.floor((next / 100) * LOADING_STEPS.length), LOADING_STEPS.length - 1);
        setStepIndex(step);
        return next;
      });
    }, tick);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: "3rem", fontWeight: 500, fontSize: "1rem", color: "var(--text)" }}>
        Fix My <span style={{ color: "var(--accent)" }}>Listing</span>
      </div>

      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Analyzing listing #{listingId}
        </p>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 500, letterSpacing: "-0.02em", margin: "0 0 2rem" }}>
          Building your report…
        </h2>

        {/* Progress bar */}
        <div style={{
          height: 4,
          background: "#E5E5E5",
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: "1.25rem",
        }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "var(--accent)",
            borderRadius: 999,
            transition: "width 0.08s linear",
          }} />
        </div>

        {/* Current step */}
        <p style={{
          fontSize: "0.84rem",
          color: "var(--muted)",
          minHeight: "1.4em",
          transition: "opacity 0.2s",
        }}>
          {LOADING_STEPS[stepIndex]}
        </p>

        {/* Step dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: "1.5rem" }}>
          {LOADING_STEPS.map((_, i) => (
            <div key={i} style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: i <= stepIndex ? "var(--accent)" : "#E5E5E5",
              transition: "background 0.2s",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Placeholder blocks ───────────────────────────────────────────────────────

function PlaceholderLine({ width, height = 12 }: { width: string; height?: number }) {
  return (
    <div style={{
      height,
      borderRadius: 4,
      background: "#E8E8E8",
      width,
      marginBottom: 8,
    }} />
  );
}

function PlaceholderCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "0.5px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "1.5rem",
      marginBottom: "1rem",
    }}>
      {children}
    </div>
  );
}

function PlaceholderSection({ title }: { title: string }) {
  return (
    <PlaceholderCard>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F0F0F0" }} />
          <div>
            <div style={{ fontWeight: 500, fontSize: "0.95rem", color: "#111", marginBottom: 4 }}>{title}</div>
            <div style={{ width: 80, height: 10, borderRadius: 3, background: "#E8E8E8" }} />
          </div>
        </div>
        <div style={{ width: 56, height: 24, borderRadius: 999, background: "#F0F0F0" }} />
      </div>
      <PlaceholderLine width="90%" />
      <PlaceholderLine width="75%" />
      <PlaceholderLine width="82%" />
      <PlaceholderLine width="60%" height={10} />
      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {[88, 70, 95].map((w, i) => (
          <div key={i} style={{ height: 28, width: w, borderRadius: 6, background: "#F0F0F0" }} />
        ))}
      </div>
    </PlaceholderCard>
  );
}

// ─── Main preview ─────────────────────────────────────────────────────────────

function PreviewInner() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") || "";
  const [ready, setReady] = useState(false);

  const listingIdMatch = url.match(/\/rooms\/(\d+)/);
  const listingId = listingIdMatch ? listingIdMatch[1] : "unknown";
  const seed = hashSeed(listingId);

  const score = seededInt(seed, 1, 38, 61);
  const revenueLift = seededInt(seed, 2, 22, 44);
  const criticalFixes = seededInt(seed, 3, 3, 6);
  const nightlyRate = seededInt(seed, 4, 89, 229);

  const scoreColor = score >= 70 ? "#16A34A" : score >= 40 ? "#D97706" : "#DC2626";
  const scoreBg = score >= 70 ? "#F0FFF4" : score >= 40 ? "#FFFBEB" : "#FFF5F5";
  const scoreBorder = score >= 70 ? "#BBF7D0" : score >= 40 ? "#FDE68A" : "#FECACA";
  const scoreLabel = score >= 70 ? "Good" : score >= 40 ? "Fair" : "Needs work";

  const encodedUrl = encodeURIComponent(url);
  const authNext = encodeURIComponent(`/analyze?url=${encodedUrl}`);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 10000);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <LoadingScreen listingId={listingId} />;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>

      {/* Nav */}
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
        <Link href="/" style={{ fontWeight: 500, fontSize: "1rem", textDecoration: "none", color: "var(--text)" }}>
          Fix My <span style={{ color: "var(--accent)" }}>Listing</span>
        </Link>
        <Link href={`/auth?next=${encodeURIComponent(`/preview?url=${encodedUrl}`)}`} style={{ fontSize: "0.82rem", color: "var(--muted)", textDecoration: "none" }}>
          Sign in
        </Link>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2.5rem 2rem 12rem" }}>

        {/* Listing meta */}
        <div style={{
          background: "var(--surface)",
          border: "0.5px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          <div>
            <p style={{ margin: "0 0 0.25rem", fontSize: "0.78rem", color: "var(--muted)" }}>airbnb.com</p>
            <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 500, letterSpacing: "-0.02em" }}>
              Airbnb Listing #{listingId}
            </h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.35rem 0.85rem",
              borderRadius: 999,
              background: scoreBg,
              border: `0.5px solid ${scoreBorder}`,
              color: scoreColor,
              fontSize: "0.82rem",
              fontWeight: 500,
            }}>
              <span style={{ fontSize: "1rem", fontWeight: 600 }}>{score}</span>
              <span style={{ opacity: 0.7 }}>/100 · {scoreLabel}</span>
            </div>
          </div>
        </div>

        {/* Score hero — blurred */}
        <div style={{
          background: "var(--surface)",
          border: "0.5px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "2rem",
          marginBottom: "1.5rem",
          textAlign: "center",
          filter: "blur(6px)",
          pointerEvents: "none",
          userSelect: "none",
        }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.82rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Search ranking score
          </p>
          <div style={{ fontSize: "4.5rem", fontWeight: 600, color: scoreColor, lineHeight: 1, marginBottom: "0.5rem" }}>
            66
          </div>
          <p style={{ margin: "0 0 1.75rem", fontSize: "0.875rem", color: "var(--muted)" }}>out of 100</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "2.5rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 600, color: "var(--text)" }}>+{revenueLift}%</div>
              <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>Est. ranking improvement</div>
            </div>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 600, color: "var(--text)" }}>{criticalFixes}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>Ranking blockers found</div>
            </div>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 600, color: "var(--text)" }}>${nightlyRate}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>Area median nightly</div>
            </div>
          </div>
        </div>

        {/* Blurred placeholder sections */}
        <div style={{ position: "relative" }}>
          <div style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none" }}>
            <PlaceholderSection title="Title" />
            <PlaceholderSection title="Description" />
            <PlaceholderSection title="Photos" />
            <PlaceholderSection title="Pricing" />
            <PlaceholderSection title="Amenities" />
            <PlaceholderSection title="SEO" />
          </div>

          {/* Gradient overlay — sibling, not inside blurred div */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0.7) 50%, rgba(250,250,250,1) 100%)",
            pointerEvents: "none",
          }} />
        </div>

      </div>

      {/* Unlock card — fixed, fully centered in viewport */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        pointerEvents: "none",
      }}>
        <div style={{
          background: "#fff",
          border: "1px solid #E5E5E5",
          borderRadius: 12,
          padding: "1.75rem 2rem",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 0 60px rgba(0,0,0,0.08), 0 0 0 9999px rgba(250,250,250,0.5)",
          pointerEvents: "auto",
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 500, letterSpacing: "-0.02em", margin: "0 0 0.35rem" }}>
            Your Airbnb SEO report for listing #{listingId} is ready
          </h2>
          <p style={{ fontSize: "0.84rem", color: "var(--muted)", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
            <strong style={{ color: "#DC2626" }}>{criticalFixes} ranking blockers</strong> identified — fix them for a potential <strong style={{ color: "#16A34A" }}>+{revenueLift}% more visibility</strong> in Airbnb search.
          </p>
          <Link
            href={`/auth?tab=signup&next=${authNext}`}
            style={{
              display: "block",
              padding: "0.75rem 1.5rem",
              background: "var(--accent)",
              color: "#fff",
              borderRadius: "var(--radius)",
              fontWeight: 500,
              fontSize: "0.9rem",
              textDecoration: "none",
              marginBottom: "0.6rem",
            }}
          >
            Get my free SEO report →
          </Link>
          <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0 0 1rem" }}>
            ✓ Free to sign up · No credit card required · First report on us
          </p>
          <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: "0.85rem" }}>
            <Link
              href={`/auth?next=${encodeURIComponent(`/preview?url=${encodedUrl}`)}`}
              style={{ fontSize: "0.82rem", color: "var(--muted)", textDecoration: "none" }}
            >
              Already have an account? Sign in →
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense>
      <PreviewInner />
    </Suspense>
  );
}
