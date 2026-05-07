"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ResultsReport, sanitize, type ReportData } from "@/app/components/ResultsReport";
import { MOCK } from "./mockData";

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "mock";
  const router = useRouter();

  const [data, setData] = useState<ReportData | null>(id === "mock" ? sanitize(MOCK) : null);
  const [loading, setLoading] = useState(id !== "mock");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id === "mock") return;

    fetch(`/api/results/${id}`)
      .then((r) => {
        if (r.status === 401) {
          router.push(`/auth?next=${encodeURIComponent(`/results/${id}`)}`);
          return null;
        }
        if (r.status === 403 || r.status === 404) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((raw) => {
        if (!raw) return;
        setData(sanitize(raw));
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading report…</p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <p style={{ color: "var(--text)", fontSize: "1rem", fontWeight: 500 }}>Report not found</p>
        <Link href="/dashboard" style={{ fontSize: "0.875rem", color: "var(--accent)", textDecoration: "none" }}>← My reports</Link>
      </div>
    );
  }

  return <ResultsReport data={data} />;
}
