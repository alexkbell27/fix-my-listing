"use client";

import Link from "next/link";
import Image from "next/image";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <Link href="/" style={{ display: "inline-block", marginBottom: "2.5rem" }}>
        <Image src="/logo-full.png" alt="Fix My Listing" height={40} width={200} style={{ height: 40, width: "auto" }} />
      </Link>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "0.75rem", color: "#1D3557" }}>
        Something went wrong — this is on us
      </h1>
      <p style={{ fontSize: "0.875rem", color: "#457B9D", marginBottom: "2rem", maxWidth: 400, lineHeight: 1.6 }}>
        We hit an unexpected error. You can try again or head back to the home page.
        {error.digest && (
          <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.75rem", color: "#A8DADC" }}>
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{ padding: "0.6rem 1.5rem", background: "#E63946", color: "#fff", borderRadius: 8, border: "none", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit" }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{ padding: "0.6rem 1.5rem", background: "transparent", color: "#1D3557", borderRadius: 8, border: "0.5px solid #A8DADC", fontWeight: 500, fontSize: "0.875rem", textDecoration: "none", display: "inline-block" }}
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
