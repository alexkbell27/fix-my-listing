import Link from "next/link";
import Image from "next/image";

export default function ResultsLoading() {
  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text-primary)" }}>
      <nav style={{ background: "#FFFFFF", borderBottom: "0.5px solid var(--color-border)", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image src="/logo-full.png" alt="Fix My Listing" height={30} width={150} style={{ height: 30, width: "auto" }} />
        </Link>
      </nav>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 2rem" }}>
        {/* Score area skeleton */}
        <div className="skeleton" style={{ width: "45%", height: 20, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ width: "70%", height: 28, marginBottom: "2rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.75rem", marginBottom: "2rem" }}>
          <div className="skeleton" style={{ width: 220, height: 120, borderRadius: "var(--radius)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: "var(--radius)" }} />
            ))}
          </div>
        </div>
        {/* Section card skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ background: "#FFFFFF", border: "0.5px solid var(--color-border)", borderRadius: "var(--radius)", padding: "1.75rem", marginBottom: "0.75rem" }}>
            <div className="skeleton" style={{ width: "30%", height: 18, marginBottom: "1rem" }} />
            <div className="skeleton" style={{ width: "100%", height: 14, marginBottom: "0.5rem" }} />
            <div className="skeleton" style={{ width: "90%", height: 14, marginBottom: "0.5rem" }} />
            <div className="skeleton" style={{ width: "80%", height: 14 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
