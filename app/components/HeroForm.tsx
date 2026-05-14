"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HeroFormProps {
  onNavigate?: (url: string) => void;
  buttonLabel?: string;
}

export default function HeroForm({ onNavigate, buttonLabel = "Get my SEO report →" }: HeroFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validate = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "Please enter a valid Airbnb listing URL (airbnb.com/rooms/...)";
    if (!trimmed.includes("airbnb.com") || !trimmed.includes("/rooms/")) {
      return "Please enter a valid Airbnb listing URL (airbnb.com/rooms/...)";
    }
    return "";
  };

  const handleBlur = () => {
    if (url.trim()) setError(validate(url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate(url);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    const trimmed = url.trim();
    if (onNavigate) {
      onNavigate(trimmed);
    } else {
      router.push(`/auth?next=${encodeURIComponent(`/analyze?url=${trimmed}`)}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", width: "100%" }}
    >
      <div className="hero-input-row" style={{ display: "flex", gap: "0.4rem", width: "100%", maxWidth: 520 }}>
        <input
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); if (error) setError(""); }}
          onBlur={handleBlur}
          placeholder="https://www.airbnb.com/rooms/..."
          disabled={loading}
          style={{
            flex: 1,
            height: 44,
            padding: "0 1rem",
            borderRadius: 8,
            border: `1px solid ${error ? "#E63946" : "#D1D5DB"}`,
            boxShadow: error ? "none" : "0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
            background: "#FFFFFF",
            color: "#1D3557",
            fontSize: "0.9rem",
            outline: "none",
            fontFamily: "inherit",
            opacity: loading ? 0.7 : 1,
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            height: 44,
            padding: "0 1.4rem",
            background: "#E63946",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.9rem",
            borderRadius: 8,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            fontFamily: "inherit",
            transition: "background 0.15s ease",
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#C1121F"; }}
          onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#E63946"; }}
        >
          {loading ? "Analyzing…" : buttonLabel}
        </button>
      </div>
      {error && (
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#E63946" }}>{error}</p>
      )}
    </form>
  );
}
