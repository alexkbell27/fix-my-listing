"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";

interface Profile {
  email: string;
  subscription_tier: string;
}

interface Purchase {
  id: string;
  listing_url: string;
  runs_used: number;
  max_runs: number;
  purchased_at: string;
}

function truncateUrl(url: string, max = 52): string {
  try {
    const u = new URL(url);
    const s = u.hostname + u.pathname;
    return s.length > max ? s.slice(0, max) + "…" : s;
  } catch {
    return url.length > max ? url.slice(0, max) + "…" : url;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelConfirming, setCancelConfirming] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("email, subscription_tier")
        .eq("id", user.id)
        .single();

      const p: Profile = data ?? { email: user.email ?? "", subscription_tier: "free" };
      setProfile(p);

      if (p.subscription_tier === "single") {
        const { data: rows } = await supabase
          .from("purchased_reports")
          .select("id, listing_url, runs_used, max_runs, purchased_at")
          .eq("user_id", user.id)
          .order("purchased_at", { ascending: false });
        setPurchases(rows ?? []);
      }

      setLoading(false);

      if (p.subscription_tier === "unlimited") {
        fetch("/api/stripe/subscription")
          .then((r) => r.json())
          .then((d) => setNextBillingDate(d.nextBillingDate ?? null))
          .catch(() => {});
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async () => {
    setCancelLoading(true);
    setCancelError("");
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error ?? "Something went wrong.");
        setCancelLoading(false);
        return;
      }
      setProfile((prev) => prev ? { ...prev, subscription_tier: "free" } : prev);
      setCancelConfirming(false);
    } catch {
      setCancelError("Network error. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>Loading…</span>
      </main>
    );
  }

  const tier = profile?.subscription_tier ?? "free";

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-background)", padding: "0" }}>

      {/* Nav */}
      <nav style={{ background: "#FFFFFF", borderBottom: "0.5px solid var(--color-border)", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image src="/logo-full.png" alt="Fix My Listing" height={30} width={150} style={{ height: 30, width: "auto" }} />
        </Link>
        <Link href="/dashboard" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1D3557", textDecoration: "none" }}>
          ← Dashboard
        </Link>
      </nav>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "3rem 2rem" }}>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 500, letterSpacing: "-0.025em", marginBottom: "2rem" }}>
          Settings
        </h1>

        {/* Account */}
        <section style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem", marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
            Account
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text)", margin: 0 }}>
            {profile?.email}
          </p>
        </section>

        {/* Plan — Free */}
        {tier === "free" && (
          <section style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
              Plan
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "var(--color-background)", border: "0.5px solid var(--color-border)", color: "var(--muted)", fontSize: "0.82rem", fontWeight: 500, padding: "0.35rem 0.75rem", borderRadius: 999 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--muted)", display: "inline-block" }} />
                Free
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
              Free includes partial reports on any listing. Upgrade for the full analysis.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <Link
                href="/pricing"
                style={{ display: "inline-flex", alignItems: "center", height: 36, padding: "0 1rem", borderRadius: 8, border: "1.5px solid #E63946", background: "#FFFFFF", color: "#E63946", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}
              >
                Upgrade to Single — $4
              </Link>
              <Link
                href="/pricing"
                style={{ display: "inline-flex", alignItems: "center", height: 36, padding: "0 1rem", borderRadius: 8, background: "#E63946", color: "#fff", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}
              >
                Upgrade to Unlimited — $9/mo
              </Link>
            </div>
          </section>
        )}

        {/* Plan — Single */}
        {tier === "single" && (
          <section style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
              Plan
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(168,218,220,0.2)", border: "0.5px solid #A8DADC", color: "#1D3557", fontSize: "0.82rem", fontWeight: 500, padding: "0.35rem 0.75rem", borderRadius: 999 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D3557", display: "inline-block" }} />
                Single Report
              </span>
            </div>

            {purchases.length > 0 ? (
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--muted)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                  Purchased listings
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {purchases.map((p) => (
                    <div
                      key={p.id}
                      style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.75rem", alignItems: "center", padding: "0.75rem 0.875rem", background: "var(--color-background)", border: "0.5px solid var(--border)", borderRadius: 8 }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: "0 0 0.2rem", fontSize: "0.8rem", fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {truncateUrl(p.listing_url)}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.73rem", color: "var(--muted)" }}>
                          {p.runs_used} of {p.max_runs} reruns used · {formatDate(p.purchased_at)}
                        </p>
                      </div>
                      <Link
                        href={`/analyze?url=${encodeURIComponent(p.listing_url)}`}
                        style={{ fontSize: "0.78rem", color: "#457B9D", fontWeight: 600, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}
                      >
                        Rerun →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                No purchased listings found.
              </p>
            )}

            <div style={{ paddingTop: "1.25rem", borderTop: "0.5px solid var(--border)" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "0.875rem", lineHeight: 1.6 }}>
                Have more listings? Upgrade to unlimited.
              </p>
              <Link
                href="/pricing"
                style={{ display: "inline-flex", alignItems: "center", height: 36, padding: "0 1rem", borderRadius: 8, background: "#E63946", color: "#fff", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}
              >
                Upgrade to Unlimited — $9/mo →
              </Link>
            </div>
          </section>
        )}

        {/* Plan — Unlimited */}
        {tier === "unlimited" && (
          <section style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
              Plan
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: nextBillingDate ? "0.75rem" : "1.25rem", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(34,197,94,0.1)", border: "0.5px solid rgba(34,197,94,0.3)", color: "#166534", fontSize: "0.82rem", fontWeight: 500, padding: "0.35rem 0.75rem", borderRadius: 999 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                Unlimited plan — active
              </span>
            </div>

            {nextBillingDate && (
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "1.25rem" }}>
                Next billing date: <span style={{ color: "var(--text)", fontWeight: 500 }}>{nextBillingDate}</span>
              </p>
            )}

            {!cancelConfirming ? (
              <button
                onClick={() => setCancelConfirming(true)}
                style={{ background: "none", border: "none", padding: 0, fontSize: "0.8rem", color: "#DC2626", cursor: "pointer", fontFamily: "inherit", opacity: 0.75, textDecoration: "underline", textDecorationStyle: "dotted" }}
              >
                Cancel subscription
              </button>
            ) : (
              <div style={{ padding: "1rem", background: "rgba(220,38,38,0.05)", border: "0.5px solid rgba(220,38,38,0.2)", borderRadius: 8 }}>
                <p style={{ fontSize: "0.82rem", color: "var(--text)", marginBottom: "0.875rem", lineHeight: 1.5 }}>
                  Cancel your subscription? Your access will end immediately.
                </p>
                {cancelError && (
                  <p style={{ fontSize: "0.78rem", color: "#DC2626", marginBottom: "0.75rem" }}>{cancelError}</p>
                )}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={handleCancel}
                    disabled={cancelLoading}
                    style={{ height: 34, padding: "0 0.875rem", borderRadius: 7, background: "#DC2626", color: "#fff", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: cancelLoading ? "not-allowed" : "pointer", opacity: cancelLoading ? 0.6 : 1, fontFamily: "inherit" }}
                  >
                    {cancelLoading ? "Cancelling…" : "Yes, cancel"}
                  </button>
                  <button
                    onClick={() => { setCancelConfirming(false); setCancelError(""); }}
                    disabled={cancelLoading}
                    style={{ height: 34, padding: "0 0.875rem", borderRadius: 7, background: "var(--color-background)", color: "var(--text)", fontSize: "0.8rem", fontWeight: 500, border: "0.5px solid var(--border)", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Never mind
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
