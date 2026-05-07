export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid #A8DADC",
          borderTopColor: "#E63946",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0 }}>Loading…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
