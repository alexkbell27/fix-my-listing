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

// Step auto-advances every N ms while waiting for the background job
const STEP_INTERVAL_MS = 15_000;
// Max time to poll before giving up
const POLL_TIMEOUT_MS = 120_000;

function AnalyzePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url");

  const [step, setStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const didFire = useRef(false);

  // ── Step 1: POST to /api/analyze → get job ID immediately ─────────────────
  useEffect(() => {
    if (didFire.current) return;
    didFire.current = true;

    if (!url) {
      // Demo mode: skip API, animate, then go to mock report
      const t = setTimeout(() => router.push("/results/mock"), 8_000);
      return () => clearTimeout(t);
    }

    (async () => {
      try {
        const r = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingUrl: url }),
        });
        if (r.status === 401) {
          router.push(`/auth?next=${encodeURIComponent(`/analyze?url=${url}`)}`);
          return;
        }
        if (r.status === 402) {
          router.push(`/pricing?url=${encodeURIComponent(url)}`);
          return;
        }
        const data = await r.json();
        if (r.ok && data.id) {
          setJobId(data.id);
        } else {
          setApiError(data.error ?? "Analysis failed. Please try again.");
        }
      } catch {
        setApiError("Network error. Please check your connection and try again.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step animation — runs independently of API state ──────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // ── Step 2: Poll /api/results/[id] every 3 s until result is ready ─────────
  useEffect(() => {
    if (!jobId) return;

    const started = Date.now();

    const interval = setInterval(async () => {
      if (Date.now() - started > POLL_TIMEOUT_MS) {
        clearInterval(interval);
        setApiError("Analysis is taking longer than expected. Please try again.");
        return;
      }

      try {
        const r = await fetch(`/api/results/${jobId}`);
        if (r.status === 200) {
          clearInterval(interval);
          setStep(4);
          setTimeout(() => router.push(`/results/${jobId}`), 600);
        } else if (r.status === 401) {
          clearInterval(interval);
          router.push(`/auth?next=${encodeURIComponent(`/results/${jobId}`)}`);
        }
        // 404 = still processing — keep polling
      } catch {
        // transient network error — keep polling
      }
    }, 3_000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

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
              href="/"
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
