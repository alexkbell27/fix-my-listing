"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ResultsReport, sanitize, type ReportData } from "@/app/components/ResultsReport";
import { MOCK } from "./mockData";
import { createClient } from "@/lib/supabase";

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "mock";
  const router = useRouter();
  const searchParams = useSearchParams();
  const justUpgraded = searchParams.get("upgraded") === "true";

  const [data, setData] = useState<ReportData | null>(id === "mock" ? sanitize(MOCK) : null);
  const [access, setAccess] = useState<"full" | "partial">(id === "mock" ? "full" : "partial");
  const [tier, setTier] = useState<"free" | "single" | "unlimited">("free");
  const [runsRemaining, setRunsRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(id !== "mock");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id === "mock") return;

    // Fetch report + access level
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
        const { _access, ...result } = raw;
        setAccess(_access ?? "partial");
        setData(sanitize(result));
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });

    // Fetch user tier + runs remaining for this listing
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();
      const t = (profile?.subscription_tier ?? "free") as "free" | "single" | "unlimited";
      setTier(t);

      if (t === "single") {
        // Fetch run count for this report's listing URL
        const { data: reportRow } = await supabase
          .from("reports")
          .select("listing_url")
          .eq("id", id)
          .single();
        if (reportRow?.listing_url) {
          const { data: purchase } = await supabase
            .from("purchased_reports")
            .select("runs_used, max_runs")
            .eq("listing_url_hash", normalizeUrlClient(reportRow.listing_url))
            .eq("user_id", user.id)
            .single();
          if (purchase) {
            setRunsRemaining(Math.max(0, purchase.max_runs - purchase.runs_used));
          }
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  return (
    <ResultsReport
      data={data}
      access={access}
      tier={tier}
      runsRemaining={runsRemaining}
      reportId={id}
      justUpgraded={justUpgraded}
    />
  );
}

function normalizeUrlClient(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}
