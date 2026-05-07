"use client";

import Link from "next/link";
import Image from "next/image";

export default function ResultsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <Link href="/" style={{ display: "inline-block", marginBottom: "2.5rem" }}>
        <Image src="/logo-full.png" alt="Fix My Listing" height={40} width={200} style={{ height: 40, width: "auto" }} />
      </Link>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "0.75rem", color: "#1D3557" }}>
        Couldn&apos;t load this report
      </h1>
      <p style={{ fontSize: "0.875rem", color: "#457B9D", marginBottom: "2rem", maxWidth: 440, lineHeight: 1.6 }}>
        We couldn&apos;t load this report. It may still be processing — try refreshing in a moment.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{ padding: "0.6rem 1.5rem", background: "#E63946", color: "#fff", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit" }}
        >
          Refresh
        </button>
        <Link
          href="/dashboard"
          style={{ padding: "0.6rem 1.5rem", background: "transparent", color: "#1D3557", borderRadius: 8, border: "0.5px solid #A8DADC", fontWeight: 500, fontSize: "0.875rem", textDecoration: "none", display: "inline-block" }}
        >
          ← My reports
        </Link>
      </div>
    </div>
  );
}
