import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
      <Link href="/" style={{ display: "inline-block", marginBottom: "2.5rem" }}>
        <Image src="/logo-full.png" alt="Fix My Listing" height={40} width={200} style={{ height: 40, width: "auto" }} />
      </Link>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "0.75rem", color: "#1D3557" }}>
        404 — Page not found
      </h1>
      <p style={{ fontSize: "0.875rem", color: "#457B9D", marginBottom: "2rem", maxWidth: 380, lineHeight: 1.6 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        style={{ padding: "0.65rem 1.75rem", background: "#E63946", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: "0.875rem", textDecoration: "none", display: "inline-block" }}
      >
        Back to home
      </Link>
    </div>
  );
}
