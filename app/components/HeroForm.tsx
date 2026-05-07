"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HeroFormProps {
  onNavigate?: (url: string) => void;
}

export default function HeroForm({ onNavigate }: HeroFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste your Airbnb listing URL to get started.");
      return;
    }
    if (!trimmed.includes("airbnb.com")) {
      setError("Please enter a valid Airbnb listing URL.");
      return;
    }
    setError("");
    if (onNavigate) {
      onNavigate(trimmed);
    } else {
      router.push(`/preview?url=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", width: "100%" }}
    >
      <div style={{ display: "flex", gap: "0.4rem", width: "100%", maxWidth: 500 }}>
        <input
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(""); }}
          placeholder="https://www.airbnb.com/rooms/..."
          style={{
            flex: 1,
            height: 42,
            padding: "0 0.9rem",
            borderRadius: "var(--radius)",
            border: `0.5px solid ${error ? "#FECACA" : "var(--border)"}`,
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: "0.875rem",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          type="submit"
          style={{
            height: 42,
            padding: "0 1.25rem",
            background: "var(--accent)",
            color: "#fff",
            fontWeight: 500,
            fontSize: "0.875rem",
            borderRadius: "var(--radius)",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: "inherit",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          Get my SEO report →
        </button>
      </div>
      {error && (
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#DC2626" }}>{error}</p>
      )}
    </form>
  );
}
