"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const STEPS = [
  "Fetching listing data",
  "Auditing title & keywords",
  "Analyzing competitor rankings",
  "Building your ranking plan",
];

const STEP_INTERVAL_MS = 15_000;
const POLL_TIMEOUT_MS  = 300_000; // 5 minutes
const SLOW_LINK_MS     = 90_000;  // show "check my reports" link after 90s

function AnalyzePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url");

  const sessionId = searchParams.get("session_id");

  const [step, setStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [showSlowLink, setShowSlowLink] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const didFire = useRef(false);

  // ── Step 1: POST to /api/analyze → get job ID immediately ──────────────────
  useEffect(() => {
    if (didFire.current) return;
    didFire.current = true;

    if (!url) {
      const t = setTimeout(() => router.push("/results/mock"), 8_000);
      return () => clearTimeout(t);
    }

    (async () => {
      // If arriving from Stripe success, verify the session directly so we
      // don't race the webhook when checking subscription status.
      if (sessionId) {
        await fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      }

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

  // ── Step animation — runs independently of API state ───────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // ── Step 2: Poll /api/results/[id]/status every 3s ─────────────────────────
  useEffect(() => {
    if (!jobId) return;

    const started = Date.now();
    const slowTimer = setTimeout(() => setShowSlowLink(true), SLOW_LINK_MS);

    const interval = setInterval(async () => {
      if (Date.now() - started > POLL_TIMEOUT_MS) {
        clearInterval(interval);
        clearTimeout(slowTimer);
        setTimedOut(true);
        return;
      }

      try {
        const r = await fetch(`/api/results/${jobId}/status`);

        if (r.status === 401) {
          clearInterval(interval);
          clearTimeout(slowTimer);
          router.push(`/auth?next=${encodeURIComponent(`/results/${jobId}`)}`);
          return;
        }

        if (r.status === 403) {
          clearInterval(interval);
          clearTimeout(slowTimer);
          setApiError("You don't have access to this report.");
          return;
        }

        const data = await r.json();

        if (data.status === "complete") {
          clearInterval(interval);
          clearTimeout(slowTimer);
          setStep(4);
          setTimeout(() => router.push(`/results/${jobId}`), 600);
        } else if (data.status === "failed") {
          clearInterval(interval);
          clearTimeout(slowTimer);
          setApiError("Analysis failed. Please try again.");
        }
        // "pending" → keep polling
      } catch {
        // transient network error — keep polling
      }
    }, 3_000);

    return () => {
      clearInterval(interval);
      clearTimeout(slowTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // ── Hard error state ────────────────────────────────────────────────────────
  if (apiError) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--color-background)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ marginBottom: "3rem" }}>
          <Image src="/logo-full.png" alt="Fix My Listing" height={36} width={180} style={{ height: 36, width: "auto", display: "block" }} />
        </div>
        <div style={{ width: "100%", maxWidth: 440, background: "var(--surface)", border: "0.5px solid rgba(230,57,70,0.35)", borderRadius: "var(--radius)", padding: "2.25rem 2rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "#DC2626", marginBottom: "0.75rem" }}>
            Analysis failed
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.75rem" }}>
            {apiError}
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <Link href="/" style={{ padding: "0.6rem 1.25rem", borderRadius: 8, border: "0.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>
              ← Try again
            </Link>
            <Link href="/results/mock" style={{ padding: "0.6rem 1.25rem", borderRadius: 8, background: "var(--accent)", color: "#fff", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>
              See demo report
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Timeout (informational) state ───────────────────────────────────────────
  if (timedOut) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--color-background)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ marginBottom: "3rem" }}>
          <Image src="/logo-full.png" alt="Fix My Listing" height={36} width={180} style={{ height: 36, width: "auto", display: "block" }} />
        </div>
        <div style={{ width: "100%", maxWidth: 440, background: "var(--surface)", border: "0.5px solid #A8DADC", borderRadius: "var(--radius)", padding: "2.25rem 2rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "#457B9D", marginBottom: "0.75rem" }}>
            Your report is still being generated…
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.75rem" }}>
            This is taking a bit longer than usual. Check My Reports in a moment — your report will appear there automatically when it&apos;s ready.
          </p>
          <Link
            href="/dashboard"
            style={{ display: "inline-block", padding: "0.65rem 1.5rem", borderRadius: 8, background: "#457B9D", color: "#fff", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}
          >
            View My Reports →
          </Link>
        </div>
      </main>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", background: "var(--color-background)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>

      {/* Logo */}
      <div style={{ marginBottom: "3.5rem" }}>
        <Image src="/logo-full.png" alt="Fix My Listing" height={36} width={180} style={{ height: 36, width: "auto", display: "block" }} />
      </div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 440, background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "2.25rem 2rem" }}>
        <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "1.75rem" }}>
          Analyzing your listing
        </p>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {STEPS.map((label, i) => {
            const complete = i < step;
            const active   = i === step && step < STEPS.length;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                {complete && (
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#1D3557", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                {active && (
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(230,57,70,0.2)", borderTop: "2px solid #E63946", flexShrink: 0, animation: "spin 0.8s linear infinite" }} />
                )}
                {!complete && !active && (
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid var(--border)", flexShrink: 0 }} />
                )}
                <span style={{ fontSize: "0.9rem", color: complete || active ? "var(--text)" : "var(--muted)", fontWeight: complete || active ? 500 : 400 }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "0.5px solid var(--border)", fontSize: "0.82rem", color: "var(--muted)", textAlign: "center" }}>
          This usually takes 30–60 seconds
        </p>
      </div>

      {/* Slow link — appears after 90s */}
      {showSlowLink && (
        <p style={{ marginTop: "1.5rem", fontSize: "0.78rem", textAlign: "center", lineHeight: 1.6 }}>
          Taking longer than usual?{" "}
          <Link href="/dashboard" style={{ color: "#457B9D", textDecoration: "none", fontWeight: 500 }}>
            Your report will appear in My Reports when ready →
          </Link>
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
