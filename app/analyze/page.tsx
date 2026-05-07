"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const STEPS = [
  "Fetching listing data",
  "Auditing title & keywords",
  "Analyzing competitor rankings",
  "Building your ranking plan",
];

// Elapsed-time thresholds (as fraction of estimated total) for steps 0–2.
// Step 3 only completes when the API promise actually resolves.
const THRESHOLDS = [0.15, 0.40, 0.70];

type ApiOutcome = { id: string | null } | { error: string } | { redirect: true };

function AnalyzePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url");

  // step 0–3: that many steps complete; step 3 active = waiting for API
  // step 4: all complete, redirect pending
  const [step, setStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const didFire = useRef(false);

  useEffect(() => {
    if (didFire.current) return;
    didFire.current = true;

    const startTime = Date.now();
    // No URL = demo mode; resolve automatically so steps still animate nicely
    const estimatedMs = url ? 60_000 : 8_000;

    // ── Fire API call immediately ──────────────────────────────────────────
    const apiPromise: Promise<ApiOutcome> = url
      ? (async (): Promise<ApiOutcome> => {
          try {
            const r = await fetch("/api/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ listingUrl: url }),
            });
            if (r.status === 401) {
              router.push(`/auth?next=${encodeURIComponent(`/analyze?url=${url}`)}`);
              return { redirect: true };
            }
            if (r.status === 402) {
              router.push(`/pricing${url ? `?url=${encodeURIComponent(url)}` : ""}`);
              return { redirect: true };
            }
            const data = await r.json();
            if (r.ok && data.id) return { id: data.id as string };
            return { error: (data.error as string) ?? "Analysis failed. Please try again." };
          } catch {
            return { error: "Network error. Please check your connection and try again." };
          }
        })()
      : new Promise<ApiOutcome>((resolve) =>
          setTimeout(() => resolve({ id: null }), estimatedMs)
        );

    // ── Poll elapsed time every 500 ms → advance steps 0–2 ────────────────
    const poll = setInterval(() => {
      const pct = (Date.now() - startTime) / estimatedMs;
      const met = THRESHOLDS.filter((t) => pct >= t).length;
      // Never auto-advance past step 3; step 3 only completes via API resolve
      setStep((prev) => Math.max(prev, Math.min(met, 3)));
    }, 500);

    // ── When API settles ───────────────────────────────────────────────────
    apiPromise.then((outcome) => {
      clearInterval(poll);
      if ("redirect" in outcome) return; // router.push already called
      if ("error" in outcome) {
        setApiError(outcome.error);
        return;
      }
      setStep(4); // all checkmarks green
      setTimeout(() => {
        router.push(outcome.id ? `/results/${outcome.id}` : "/results/mock");
      }, 600);
    });

    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Error state ────────────────────────────────────────────────────────────
  if (apiError) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ marginBottom: "3rem", textAlign: "center" }}>
          <span style={{ fontWeight: 500, fontSize: "1.1rem", letterSpacing: "-0.01em" }}>
            Fix My <span style={{ color: "var(--accent)" }}>Listing</span>
          </span>
        </div>
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            background: "var(--surface)",
            border: "0.5px solid #FECACA",
            borderRadius: "var(--radius)",
            padding: "2.25rem 2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "#DC2626", marginBottom: "0.75rem" }}>
            Analysis failed
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.75rem" }}>
            {apiError}
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <Link
              href="/analyze"
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: 8,
                border: "0.5px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              ← Try again
            </Link>
            <Link
              href="/results/mock"
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: 8,
                background: "var(--accent)",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              See demo report
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: "3.5rem", textAlign: "center" }}>
        <span style={{ fontWeight: 500, fontSize: "1.1rem", letterSpacing: "-0.01em" }}>
          Fix My <span style={{ color: "var(--accent)" }}>Listing</span>
        </span>
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "var(--surface)",
          border: "0.5px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "2.25rem 2rem",
        }}
      >
        <p
          style={{
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "var(--muted)",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            marginBottom: "1.75rem",
          }}
        >
          Analyzing your listing
        </p>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {STEPS.map((label, i) => {
            const complete = i < step;
            const active = i === step && step < STEPS.length;

            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                {/* Icon */}
                {complete && (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#22C55E",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="#fff"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                {active && (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: "2px solid #FFE0E0",
                      borderTop: "2px solid #FF5A5F",
                      flexShrink: 0,
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                )}
                {!complete && !active && (
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: "1.5px solid var(--border)",
                      flexShrink: 0,
                    }}
                  />
                )}

                {/* Label */}
                <span
                  style={{
                    fontSize: "0.9rem",
                    color: complete || active ? "var(--text)" : "var(--muted)",
                    fontWeight: complete || active ? 500 : 400,
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Static footer line */}
        <p
          style={{
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "0.5px solid var(--border)",
            fontSize: "0.82rem",
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          This usually takes 30–60 seconds
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense>
      <AnalyzePageInner />
    </Suspense>
  );
}
