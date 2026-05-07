import Link from "next/link";
import Image from "next/image";

export default function DashboardLoading() {
  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text-primary)" }}>
      <nav style={{ background: "#FFFFFF", borderBottom: "0.5px solid var(--color-border)", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image src="/logo-full.png" alt="Fix My Listing" height={30} width={150} style={{ height: 30, width: "auto" }} />
        </Link>
      </nav>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 2rem" }}>
        <div className="skeleton" style={{ width: 120, height: 22, marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ width: 200, height: 16, marginBottom: "2.5rem" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "#FFFFFF", border: "0.5px solid var(--color-border)", borderRadius: "var(--radius)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div className="skeleton" style={{ width: "60%", height: 16 }} />
                <div className="skeleton" style={{ width: "40%", height: 13 }} />
              </div>
              <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 999 }} />
              <div className="skeleton" style={{ width: 90, height: 16 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
