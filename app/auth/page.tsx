"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "signin";

  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (tab === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); return; }
        router.push(next);
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) { setError(err.message); return; }
        if (data.session) {
          // Signed in immediately (email confirmation disabled)
          router.push(next);
        } else {
          setNotice("Check your email to confirm your account, then sign in.");
          setTab("signin");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (err) setError(err.message);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 42,
    padding: "0 0.9rem",
    borderRadius: "var(--radius)",
    border: "0.5px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    fontSize: "0.875rem",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>

      {/* Logo */}
      <Link href="/" style={{ fontWeight: 500, fontSize: "1.1rem", letterSpacing: "-0.01em", textDecoration: "none", color: "var(--text)", marginBottom: "2.5rem" }}>
        Fix My <span style={{ color: "var(--accent)" }}>Listing</span>
      </Link>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 400, background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "2rem" }}>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "0.5px solid var(--border)", marginBottom: "1.75rem" }}>
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); setNotice(""); }}
              style={{ flex: 1, padding: "0.6rem", border: "none", background: "none", fontSize: "0.875rem", fontWeight: tab === t ? 500 : 400, color: tab === t ? "var(--text)" : "var(--muted)", cursor: "pointer", borderBottom: tab === t ? "1.5px solid var(--text)" : "1.5px solid transparent", fontFamily: "inherit", transition: "color 0.15s" }}
            >
              {t === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {notice && (
          <div style={{ background: "#F0FFF4", border: "0.5px solid #BBF7D0", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.82rem", color: "#16A34A" }}>
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />

          {error && <p style={{ margin: 0, fontSize: "0.78rem", color: "#DC2626" }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ height: 42, background: "var(--accent)", color: "#fff", fontWeight: 500, fontSize: "0.875rem", borderRadius: "var(--radius)", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit", marginTop: "0.25rem" }}
          >
            {loading ? "…" : tab === "signin" ? "Sign in" : "Create account →"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0" }}>
          <div style={{ flex: 1, height: "0.5px", background: "var(--border)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>or</span>
          <div style={{ flex: 1, height: "0.5px", background: "var(--border)" }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          style={{ width: "100%", height: 42, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.65rem", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", cursor: "pointer", fontFamily: "inherit" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.015 17.64 11.707 17.64 9.2z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.177 0 7.552 0 9s.348 2.823.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {tab === "signup" && (
          <p style={{ margin: "1.25rem 0 0", fontSize: "0.72rem", color: "var(--muted)", textAlign: "center", lineHeight: 1.5 }}>
            By signing up you agree to our terms. We never share your listing data.
          </p>
        )}
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
