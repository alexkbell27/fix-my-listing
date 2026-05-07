"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";

interface Profile {
  email: string;
  free_runs_used: number;
  is_subscribed: boolean;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("email, free_runs_used, is_subscribed")
        .eq("id", user.id)
        .single();

      setProfile(data ?? { email: user.email ?? "", free_runs_used: 0, is_subscribed: false });
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>Loading…</span>
      </main>
    );
  }

  const isSubscribed = profile?.is_subscribed ?? false;
  const hasFreeRunLeft = (profile?.free_runs_used ?? 0) < 1;

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

        {/* Subscription */}
        <section style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
            Subscription
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            {isSubscribed ? (
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "rgba(168,218,220,0.25)",
                border: "0.5px solid #A8DADC",
                color: "#1D3557",
                fontSize: "0.82rem",
                fontWeight: 500,
                padding: "0.35rem 0.75rem",
                borderRadius: 999,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                Active — unlimited access
              </span>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "var(--color-background)",
                  border: "0.5px solid var(--color-border)",
                  color: "var(--muted)",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  padding: "0.35rem 0.75rem",
                  borderRadius: 999,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--muted)", display: "inline-block" }} />
                  {hasFreeRunLeft ? "Free tier — 1 report remaining" : "Free tier — 0 reports remaining"}
                </span>
                <Link href="/pricing" style={{ fontSize: "0.82rem", color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
                  Upgrade for $6 →
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
