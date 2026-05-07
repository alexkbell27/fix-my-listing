import Link from "next/link";
import Image from "next/image";

export default function SettingsLoading() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--color-background)", padding: 0 }}>
      <nav style={{ background: "#FFFFFF", borderBottom: "0.5px solid var(--color-border)", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image src="/logo-full.png" alt="Fix My Listing" height={30} width={150} style={{ height: 30, width: "auto" }} />
        </Link>
      </nav>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "3rem 2rem" }}>
        <div className="skeleton" style={{ width: 100, height: 24, marginBottom: "2rem" }} />
        <div style={{ background: "#FFFFFF", border: "0.5px solid var(--color-border)", borderRadius: "var(--radius)", padding: "1.5rem", marginBottom: "1rem" }}>
          <div className="skeleton" style={{ width: 70, height: 12, marginBottom: "1rem" }} />
          <div className="skeleton" style={{ width: "60%", height: 16 }} />
        </div>
        <div style={{ background: "#FFFFFF", border: "0.5px solid var(--color-border)", borderRadius: "var(--radius)", padding: "1.5rem" }}>
          <div className="skeleton" style={{ width: 90, height: 12, marginBottom: "1rem" }} />
          <div className="skeleton" style={{ width: "80%", height: 32, borderRadius: 999 }} />
        </div>
      </div>
    </main>
  );
}
