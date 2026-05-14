"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { MOCK } from "@/app/results/[id]/mockData";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DescTab { label: string; current: string; optimized: string; }

export interface ReportData {
  listingName: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  url?: string | null;
  highlights?: string[];
  currentScore: number;
  projectedScore: number;
  revenueLift: number;
  currentNightlyRate: number;
  suggestedNightlyRate: number;
  criticalFixCount: number;
  title: {
    current: string;
    currentCharCount: number;
    score: number;
    issues: string[];
    suggestions: string[];
    alternatives: Array<{ text: string; charCount: number; keywords: string[] }>;
  };
  description: {
    tabs: Record<string, DescTab>;
    score: number;
    issues: string[];
    suggestions: string[];
    clichesFound?: string[];
    missingAnswers?: string[];
  };
  photos: {
    score: number;
    issues: Array<{ severity: "critical" | "warning" | "tip"; description: string }>;
    suggestions: string[];
    recommendedOrder: Array<{ slot: number; shotType: string; tip: string }>;
  };
  amenities: {
    score: number;
    issues: string[];
    suggestions: string[];
    present: string[];
    missing: string[];
    quickWins: Array<{ item: string; estimatedImpact: number; cost: string }>;
    highlightThese: string[];
  };
  pricing: {
    score: number;
    issues: string[];
    suggestions: string[];
    currentBase: number;
    areaMedian: number;
    topTenPercent: number;
    recommendedBase: number;
    recommendedWeekend: number;
    recommendedPeakSeason: number;
    recommendedCleaningFee: number;
    benchmarkNote: string;
    nextHighDemandEvent: { name: string; date: string; suggestedPrice: number };
  };
  seo: {
    score: number;
    issues: string[];
    suggestions: string[];
    detectedKeywords: string[];
    missingKeywords: string[];
    instantBook: boolean;
    estimatedResponseRate: string;
    reviewCount: number;
  };
  actionPlan: Array<{ action: string; effort: string; impact: "high" | "medium" | "low" }>;
  topPriorities: string[];
  reviews: {
    totalCount: number;
    sentimentScore: number;
    velocityNote: string;
    hostResponseQuality: "excellent" | "good" | "poor" | "none";
    praisedThemes: Array<{ theme: string; frequency: number; exampleQuote: string }>;
    complaintThemes: Array<{ theme: string; frequency: number; exampleQuote: string }>;
    hiddenInsights: Array<{ insight: string; suggestedAddition: string }>;
    redFlags: Array<{ issue: string; severity: "critical" | "warning"; suggestedFix: string }>;
  } | null;
}

// ─── Sanitize ─────────────────────────────────────────────────────────────────

function toArr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

const DESC_TAB_LABELS: Record<string, string> = {
  opening: "Opening",
  theSpace: "The Space",
  gettingAround: "Getting Around",
  houseRules: "House Rules",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitize(raw: unknown): ReportData {
  if (!raw || typeof raw !== "object") return sanitize(MOCK);
  const r = raw as Record<string, unknown>;

  // API shape: has overallScore + sections but no listingName
  if ("overallScore" in r && "sections" in r && !("listingName" in r)) {
    const sec = (r.sections ?? {}) as Record<string, Record<string, unknown>>;
    const t = sec.title ?? {};
    const d = sec.description ?? {};
    const ph = sec.photos ?? {};
    const am = sec.amenities ?? {};
    const pr = sec.pricing ?? {};
    const se = sec.seo ?? {};

    const overall = Number(r.overallScore ?? 0);
    const top = toArr<string>(r.topPriorities);
    const dRewrite = String(d.rewrite ?? "");
    const tRewrite = String(t.rewrite ?? "");
    const benchNote = String(pr.benchmarkNote ?? "");
    const priceMatches = [...benchNote.matchAll(/\$(\d+)/g)].map((m) => Number(m[1]));
    const areaMedian = priceMatches[0] ?? 0;
    const topTenPct = priceMatches[1] ?? 0;

    return {
      listingName: "SEO Report",
      location: "",
      bedrooms: 0,
      bathrooms: 0,
      url: (r.url as string) ?? null,
      highlights: toArr<string>(r.highlights),
      currentScore: overall,
      projectedScore: Math.min(99, overall + 30),
      revenueLift: 0,
      currentNightlyRate: 0,
      suggestedNightlyRate: 0,
      criticalFixCount: top.length,
      title: {
        current: "",
        currentCharCount: 0,
        score: Number(t.score ?? 0),
        issues: toArr<string>(t.issues),
        suggestions: toArr<string>(t.suggestions),
        alternatives: tRewrite
          ? [{ text: tRewrite, charCount: tRewrite.length, keywords: toArr<string>(se.keywords).slice(0, 4) }]
          : [],
      },
      description: {
        score: Number(d.score ?? 0),
        issues: toArr<string>(d.issues),
        suggestions: toArr<string>(d.suggestions),
        tabs: dRewrite ? { opening: { label: "Rewrite", current: "", optimized: dRewrite } } : {},
      },
      photos: {
        score: Number(ph.score ?? 0),
        issues: toArr<string>(ph.issues).map((s) => ({ severity: "tip" as const, description: s })),
        suggestions: toArr<string>(ph.suggestions),
        recommendedOrder: toArr<string>(ph.missingShots).map((shot, i) => ({ slot: i + 1, shotType: shot, tip: "" })),
      },
      amenities: {
        score: Number(am.score ?? 0),
        issues: toArr<string>(am.issues),
        suggestions: toArr<string>(am.suggestions),
        present: [],
        missing: [],
        quickWins: [],
        highlightThese: toArr<string>(am.highlightThese),
      },
      pricing: {
        score: Number(pr.score ?? 0),
        issues: toArr<string>(pr.issues),
        suggestions: toArr<string>(pr.suggestions),
        currentBase: 0,
        areaMedian,
        topTenPercent: topTenPct,
        recommendedBase: areaMedian,
        recommendedWeekend: 0,
        recommendedPeakSeason: 0,
        recommendedCleaningFee: 0,
        benchmarkNote: benchNote,
        nextHighDemandEvent: { name: "", date: "", suggestedPrice: 0 },
      },
      seo: {
        score: Number(se.score ?? 0),
        issues: toArr<string>(se.issues),
        suggestions: toArr<string>(se.suggestions),
        detectedKeywords: [],
        missingKeywords: toArr<string>(se.keywords),
        instantBook: false,
        estimatedResponseRate: "N/A",
        reviewCount: 0,
      },
      actionPlan: top.map((a) => ({ action: a, effort: "~5 min", impact: "high" as const })),
      topPriorities: top,
      reviews: null,
    };
  }

  // Mock / rich shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = r as any;
  return {
    listingName: String(m.listingName ?? "SEO Report"),
    location: String(m.location ?? ""),
    bedrooms: Number(m.bedrooms ?? 0),
    bathrooms: Number(m.bathrooms ?? 0),
    url: (m.url as string) ?? null,
    highlights: toArr<string>(m.highlights),
    currentScore: Number(m.currentScore ?? 0),
    projectedScore: Number(m.projectedScore ?? 0),
    revenueLift: Number(m.revenueLift ?? 0),
    currentNightlyRate: Number(m.currentNightlyRate ?? 0),
    suggestedNightlyRate: Number(m.suggestedNightlyRate ?? 0),
    criticalFixCount: Number(m.criticalFixCount ?? 0),
    title: {
      current: String(m.title?.current ?? ""),
      currentCharCount: Number(m.title?.currentCharCount ?? 0),
      score: 0,
      issues: [],
      suggestions: [],
      alternatives: toArr(m.title?.alternatives).map((a: any) => ({
        text: String(a.text ?? ""),
        charCount: Number(a.charCount ?? 0),
        keywords: toArr<string>(a.keywords),
      })),
    },
    description: (() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawDesc = (m.description ?? {}) as Record<string, any>;
      const tabs = Object.fromEntries(
        Object.entries(rawDesc)
          .filter(([, v]) => v && typeof v === "object" && !Array.isArray(v) && v.optimized)
          .map(([k, v]) => [
            k,
            {
              label: DESC_TAB_LABELS[k] ?? k,
              current: String(v?.current ?? ""),
              optimized: String(v?.optimized ?? ""),
            },
          ])
      );
      return {
        score: 0,
        issues: [],
        suggestions: [],
        tabs,
        clichesFound: toArr<string>(rawDesc.clichesFound),
        missingAnswers: toArr<string>(rawDesc.missingAnswers),
      };
    })(),
    photos: {
      score: 0,
      issues: toArr(m.photos?.issues).map((issue: any) => ({
        severity: (issue?.severity ?? "tip") as "critical" | "warning" | "tip",
        description: String(issue?.description ?? ""),
      })),
      suggestions: [],
      recommendedOrder: toArr(m.photos?.recommendedOrder).map((shot: any) => ({
        slot: Number(shot?.slot ?? 0),
        shotType: String(shot?.shotType ?? ""),
        tip: String(shot?.tip ?? ""),
      })),
    },
    amenities: {
      score: 0,
      issues: [],
      suggestions: [],
      present: toArr<string>(m.amenities?.present),
      missing: toArr<string>(m.amenities?.missing),
      quickWins: toArr(m.amenities?.quickWins).map((win: any) => ({
        item: String(win?.item ?? ""),
        estimatedImpact: Number(win?.estimatedImpact ?? 0),
        cost: String(win?.cost ?? ""),
      })),
      highlightThese: toArr<string>(m.amenities?.highlightThese ?? []),
    },
    pricing: {
      score: 0,
      issues: [],
      suggestions: [],
      currentBase: Number(m.pricing?.currentBase ?? 0),
      areaMedian: Number(m.pricing?.areaMedian ?? 0),
      topTenPercent: Number(m.pricing?.topTenPercent ?? 0),
      recommendedBase: Number(m.pricing?.recommendedBase ?? 0),
      recommendedWeekend: Number(m.pricing?.recommendedWeekend ?? 0),
      recommendedPeakSeason: Number(m.pricing?.recommendedPeakSeason ?? 0),
      recommendedCleaningFee: Number(m.pricing?.recommendedCleaningFee ?? 0),
      benchmarkNote: String(m.pricing?.benchmarkNote ?? ""),
      nextHighDemandEvent: {
        name: String(m.pricing?.nextHighDemandEvent?.name ?? ""),
        date: String(m.pricing?.nextHighDemandEvent?.date ?? ""),
        suggestedPrice: Number(m.pricing?.nextHighDemandEvent?.suggestedPrice ?? 0),
      },
    },
    seo: {
      score: 0,
      issues: [],
      suggestions: [],
      detectedKeywords: toArr<string>(m.seo?.detectedKeywords),
      missingKeywords: toArr<string>(m.seo?.missingKeywords),
      instantBook: Boolean(m.seo?.instantBook),
      estimatedResponseRate: String(m.seo?.estimatedResponseRate ?? "N/A"),
      reviewCount: Number(m.seo?.reviewCount ?? 0),
    },
    actionPlan: toArr(m.actionPlan).map((item: any) => ({
      action: String(item?.action ?? ""),
      effort: String(item?.effort ?? ""),
      impact: (item?.impact ?? "medium") as "high" | "medium" | "low",
    })),
    topPriorities: toArr<string>(m.topPriorities ?? []),
    reviews: m.reviews == null ? null : {
      totalCount: Number(m.reviews.totalCount ?? 0),
      sentimentScore: Number(m.reviews.sentimentScore ?? 0),
      velocityNote: String(m.reviews.velocityNote ?? ""),
      hostResponseQuality: (m.reviews.hostResponseQuality ?? "none") as "excellent" | "good" | "poor" | "none",
      praisedThemes: toArr(m.reviews.praisedThemes).map((t: any) => ({
        theme: String(t?.theme ?? ""), frequency: Number(t?.frequency ?? 0), exampleQuote: String(t?.exampleQuote ?? ""),
      })),
      complaintThemes: toArr(m.reviews.complaintThemes).map((t: any) => ({
        theme: String(t?.theme ?? ""), frequency: Number(t?.frequency ?? 0), exampleQuote: String(t?.exampleQuote ?? ""),
      })),
      hiddenInsights: toArr(m.reviews.hiddenInsights).map((ins: any) => ({
        insight: String(ins?.insight ?? ""), suggestedAddition: String(ins?.suggestedAddition ?? ""),
      })),
      redFlags: toArr(m.reviews.redFlags).map((f: any) => ({
        issue: String(f?.issue ?? ""), severity: (f?.severity ?? "warning") as "critical" | "warning", suggestedFix: String(f?.suggestedFix ?? ""),
      })),
    },
  };
}

// ─── Design tokens ────────────────────────────────────────────────────────────

export const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "0.5px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "1.75rem",
  boxShadow: "0 2px 12px rgba(29,53,87,0.07)",
};

const label: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 500,
  color: "var(--muted)",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  display: "block",
};

const pill = (bg: string, color: string, border: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "0.2rem 0.6rem",
  borderRadius: 999,
  fontSize: "0.73rem",
  fontWeight: 500,
  background: bg,
  color,
  border: `0.5px solid ${border}`,
  whiteSpace: "nowrap",
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ n, title, sub }: { n: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "var(--accent)", letterSpacing: "0.08em" }}>{n}</span>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
      </div>
      {sub && <p style={{ color: "var(--muted)", fontSize: "0.83rem", margin: "0.3rem 0 0 1.4rem", lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="pdf-hide"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copied!");
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{ flexShrink: 0, padding: "0.35rem 0.8rem", borderRadius: 8, border: "0.5px solid var(--border)", background: copied ? "rgba(168,218,220,0.25)" : "var(--surface)", color: copied ? "#1D3557" : "var(--muted)", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", transition: "color 0.15s, background 0.15s" }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function Divider() {
  return <div style={{ height: "0.5px", background: "var(--border)", margin: "1.5rem 0" }} />;
}

function BulletList({ items, accent }: { items: string[]; accent?: boolean }) {
  if (!items.length) return null;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "0.875rem", lineHeight: 1.55 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 6, background: accent ? "var(--accent)" : "#D97706" }} />
          <span style={{ color: accent ? "var(--text)" : "var(--muted)" }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ScoreBadge({ score }: { score: number }) {
  if (!score) return null;
  const bg = score >= 75 ? "rgba(168,218,220,0.3)" : score >= 50 ? "rgba(69,123,157,0.15)" : "rgba(230,57,70,0.12)";
  const color = score >= 75 ? "#1D3557" : score >= 50 ? "#457B9D" : "#E63946";
  const border = score >= 75 ? "#A8DADC" : score >= 50 ? "#457B9D" : "#E63946";
  const lbl = score >= 75 ? "Good" : score >= 50 ? "Fair" : "Poor";
  const tagClass = score >= 75 ? "tag-good" : score >= 50 ? "tag-warn" : "tag-bad";
  return <span className={tagClass} style={pill(bg, color, border)}>{score}/100 · {lbl}</span>;
}

// ─── Print stylesheet ─────────────────────────────────────────────────────────

const PRINT_STYLES = `
  /* Hide print-only elements on screen */
  .report-header-print { display: none; }
  .report-footer { display: none; }

  @media print {
    @page {
      margin: 24mm 20mm;
      size: A4;
    }

    /* Hide non-report elements */
    nav,
    header,
    .pdf-hide,
    button,
    .download-btn {
      display: none !important;
    }

    /* Remove backgrounds and shadows for print */
    * {
      box-shadow: none !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Page break rules */
    .report-section {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 24px;
    }

    .report-section + .report-section {
      break-before: auto;
    }

    /* Never break inside these elements */
    .before-after-card,
    .photo-grid,
    .amenity-gap,
    .pricing-table,
    .action-plan-item {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* Score gauge and metrics row stay together */
    .score-section {
      break-inside: avoid;
    }

    /* Typography adjustments for print */
    body {
      font-size: 11pt;
      color: #000;
    }

    h1, h2, h3 {
      color: #000;
    }

    /* Keep colored badges readable in print */
    .tag-bad  { background: #FCEBEB !important; color: #A32D2D !important; }
    .tag-warn { background: #FAEEDA !important; color: #854F0B !important; }
    .tag-good { background: #EAF3DE !important; color: #3B6D11 !important; }

    /* Running footer on every page */
    .report-footer {
      display: block;
      position: fixed;
      bottom: 8mm;
      left: 20mm;
      right: 20mm;
      font-size: 8pt;
      color: #999;
      border-top: 0.5px solid #E5E5E5;
      padding-top: 4mm;
      text-align: center;
    }

    /* Print-only branding header */
    .report-header-print {
      display: block !important;
    }
  }
`;

// ─── Main component ───────────────────────────────────────────────────────────

export function ResultsReport({
  data,
  showNav = true,
  access = "full",
  tier = "free",
  runsRemaining = null,
  reportId = "",
  justUpgraded = false,
}: {
  data: ReportData;
  showNav?: boolean;
  access?: "full" | "partial";
  tier?: "free" | "single" | "unlimited";
  runsRemaining?: number | null;
  reportId?: string;
  justUpgraded?: boolean;
}) {
  const tabKeys = Object.keys(data.description.tabs);
  const [descTab, setDescTab] = useState<string>(tabKeys[0] ?? "opening");
  const [descView, setDescView] = useState<"before" | "after">("after");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [printTip, setPrintTip] = useState(false);
  const [runBannerDismissed, setRunBannerDismissed] = useState(false);
  const [paywallLoading, setPaywallLoading] = useState<"single" | "unlimited" | null>(null);
  const [paywallError, setPaywallError] = useState("");

  const toggle = (i: number) =>
    setChecked((prev) => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; });

  const handleUpgrade = async (upgradeTier: "single" | "unlimited") => {
    setPaywallLoading(upgradeTier);
    setPaywallError("");
    try {
      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: upgradeTier,
          listingUrl: data.url ?? "",
          reportId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setPaywallError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setPaywallError("Network error. Please check your connection.");
    } finally {
      setPaywallLoading(null);
    }
  };

  const handleDownload = () => {
    toast.success("Opening print dialog…");
    const key = "ll_print_tip_shown";
    if (typeof window !== "undefined" && !localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      setPrintTip(true);
      setTimeout(() => setPrintTip(false), 4000);
      setTimeout(() => window.print(), 1500);
    } else {
      window.print();
    }
  };

  const BAR_MAX = Math.max(300, data.pricing.topTenPercent * 1.15, data.pricing.recommendedBase * 1.25);
  const actionItems = data.actionPlan.length > 0
    ? data.actionPlan
    : data.topPriorities.map((a) => ({ action: a, effort: "~5 min", impact: "high" as const }));

  const headerMeta = [
    data.location,
    data.bedrooms > 0 ? `${data.bedrooms} bed` : null,
    data.bathrooms > 0 ? `${data.bathrooms} bath` : null,
  ].filter(Boolean).join(" · ");

  const printDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh", color: "var(--color-text-primary)" }}>
      <style>{PRINT_STYLES}</style>

      {/* Print-only branding header — hidden on screen */}
      <div className="report-header-print">
        <span style={{ fontSize: "13pt", fontWeight: 500 }}>Fix My Listing</span>
        <span style={{ fontSize: "9pt", color: "#999", marginLeft: 12 }}>Airbnb SEO Report</span>
        <hr style={{ border: "none", borderTop: "0.5px solid #E5E5E5", margin: "8px 0" }} />
      </div>

      {/* Print-only running footer — hidden on screen */}
      <div className="report-footer">
        Generated by Fix My Listing · fixmylisting.com · {printDate}
      </div>

      {showNav && (
        <nav style={{ background: "#FFFFFF", borderBottom: "0.5px solid var(--color-border)", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Image src="/logo-full.png" alt="Fix My Listing" height={30} width={150} style={{ height: 30, width: "auto" }} />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              className="download-btn"
              onClick={handleDownload}
              style={{ padding: "0.35rem 0.85rem", borderRadius: 8, border: "1px solid var(--color-border)", background: "transparent", color: "#1D3557", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              Download PDF
            </button>
            <Link href="/dashboard" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1D3557", textDecoration: "none" }}>My Reports</Link>
            <Link href="/" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1D3557", textDecoration: "none" }}>New Report</Link>
          </div>
        </nav>
      )}

      {/* Run-limit banner — single tier only, dismissed per session */}
      {access === "full" && tier === "single" && runsRemaining !== null && runsRemaining <= 2 && !runBannerDismissed && (
        <div style={{ background: "rgba(69,123,157,0.08)", borderBottom: "0.5px solid #A8DADC", padding: "0.65rem 2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", color: "#457B9D", lineHeight: 1.5 }}>
            You have <strong>{runsRemaining} rerun{runsRemaining !== 1 ? "s" : ""}</strong> remaining for this listing.{" "}
            <button
              onClick={() => handleUpgrade("unlimited")}
              style={{ background: "none", border: "none", color: "#457B9D", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", textDecoration: "underline", padding: 0, fontFamily: "inherit" }}
            >
              Upgrade to unlimited for endless reruns on all your listings →
            </button>
          </span>
          <button
            onClick={() => setRunBannerDismissed(true)}
            style={{ background: "none", border: "none", color: "#457B9D", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: "0 0.25rem", flexShrink: 0 }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Upgrade success banner */}
      {justUpgraded && (
        <div style={{ background: "rgba(168,218,220,0.2)", borderBottom: "0.5px solid #A8DADC", padding: "0.65rem 2rem", textAlign: "center", fontSize: "0.82rem", color: "#1D3557", fontWeight: 500 }}>
          Your full report is now unlocked.
        </div>
      )}

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 2rem 7rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "0.5px solid var(--border)" }}>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "0.5rem", lineHeight: 1.3 }}>{data.listingName}</h1>

          {headerMeta && (
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: data.url ? "0.35rem" : (data.highlights?.length ? "0.75rem" : 0) }}>
              {headerMeta}
            </p>
          )}

          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", fontSize: "0.75rem", color: "#457B9D", marginBottom: data.highlights?.length ? "0.75rem" : 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none" }}
            >
              {data.url}
            </a>
          )}

          {(data.highlights?.length ?? 0) > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {data.highlights!.map((h) => (
                <span key={h} style={{ padding: "0.25rem 0.7rem", borderRadius: 999, fontSize: "0.72rem", fontWeight: 500, background: "rgba(168,218,220,0.18)", color: "#1D3557", border: "0.5px solid #A8DADC" }}>
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Score hero */}
        <div className="score-section report-section" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.75rem", marginBottom: "0.75rem", alignItems: "stretch" }}>
          <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", padding: "1.5rem 2.25rem" }}>
            <span style={{ ...label, marginBottom: "0.5rem" }}>Search ranking score</span>
            <div style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 1, color: "var(--muted)" }}>{data.currentScore}</div>
                <span style={{ ...label, marginTop: "0.4rem" }}>Current</span>
              </div>
              <div style={{ color: "var(--border)", fontSize: "1.5rem" }}>→</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 1, color: "var(--accent)" }}>{data.projectedScore}</div>
                <span style={{ ...label, marginTop: "0.4rem" }}>Projected</span>
              </div>
            </div>
          </div>
          <div className="metric-cards" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            <div style={{ ...card, borderColor: "var(--accent)" }}>
              <span style={label}>Ranking blockers</span>
              <div style={{ fontSize: "1.75rem", fontWeight: 500, letterSpacing: "-0.04em", marginTop: "0.5rem", color: "var(--accent)" }}>{data.criticalFixCount}</div>
            </div>
            <div style={card}>
              <span style={label}>Est. visibility lift</span>
              <div style={{ fontSize: "1.75rem", fontWeight: 500, letterSpacing: "-0.04em", marginTop: "0.5rem", color: "var(--accent)" }}>{data.revenueLift > 0 ? `+${data.revenueLift}%` : "—"}</div>
            </div>
            <div style={card}>
              <span style={label}>Suggested nightly rate</span>
              <div style={{ fontSize: "0.95rem", fontWeight: 500, marginTop: "0.5rem", letterSpacing: "-0.01em" }}>
                {data.currentNightlyRate > 0
                  ? <>${data.currentNightlyRate} <span style={{ color: "var(--border)" }}>→</span> <span style={{ color: "var(--accent)" }}>${data.suggestedNightlyRate}</span></>
                  : data.suggestedNightlyRate > 0
                    ? <span style={{ color: "var(--accent)" }}>${data.suggestedNightlyRate} suggested</span>
                    : "—"}
              </div>
            </div>
          </div>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "2rem", lineHeight: 1.5 }}>
          Score is calculated across title keywords, description SEO, amenity completeness, pricing competitiveness, and Airbnb algorithm signals.
        </p>

        {/* 01 Title */}
        <div className="report-section" style={{ ...card, marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <SectionTitle n="01" title="Title & Keyword Analysis" sub={data.title.current ? `Your current title is ${data.title.currentCharCount} characters — well below the 50-char sweet spot.` : undefined} />
            <ScoreBadge score={data.title.score} />
          </div>
          {data.title.current && (
            <>
              <span style={label}>Current</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
                <div style={{ flex: 1, background: "#FFFFFF", border: "0.5px solid var(--border)", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.9rem", color: "var(--muted)" }}>{data.title.current}</div>
                <span className="tag-bad" style={pill("rgba(230,57,70,0.1)", "#E63946", "rgba(230,57,70,0.35)")}>Poor</span>
                <span style={pill("#FFFFFF", "var(--muted)", "var(--border)")}>{data.title.currentCharCount} chars</span>
              </div>
            </>
          )}
          {(data.title.issues.length > 0 || data.title.suggestions.length > 0) && (
            <div style={{ marginBottom: "1.25rem" }}>
              {data.title.issues.length > 0 && <div style={{ marginBottom: "1rem" }}><span style={{ ...label, marginBottom: "0.5rem" }}>Issues</span><BulletList items={data.title.issues} /></div>}
              {data.title.suggestions.length > 0 && <div><span style={{ ...label, marginBottom: "0.5rem" }}>Suggestions</span><BulletList items={data.title.suggestions} accent /></div>}
            </div>
          )}
          {data.title.alternatives.length > 0 && (
            <>
              <span style={label}>SEO-optimized titles</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.65rem" }}>
                {data.title.alternatives.map((alt, i) => (
                  <div key={i} className="before-after-card" style={{ background: "#FFFFFF", border: "0.5px solid var(--border)", borderRadius: 10, padding: "1rem 1rem 0.85rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.9rem", fontWeight: 500, margin: "0 0 0.5rem", lineHeight: 1.4 }}>{alt.text}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.73rem", color: "var(--muted)", marginRight: "0.25rem" }}>{alt.charCount} chars ·</span>
                        {alt.keywords.map((kw) => <span key={kw} style={pill("rgba(230,57,70,0.1)", "#E63946", "rgba(230,57,70,0.35)")}>{kw}</span>)}
                      </div>
                    </div>
                    <CopyBtn text={alt.text} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top action item teaser — partial access only */}
        {access === "partial" && data.actionPlan.length > 0 && (
          <div className="report-section" style={{ ...card, marginBottom: "0.75rem", borderColor: "rgba(230,57,70,0.2)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.85rem" }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "var(--accent)", letterSpacing: "0.08em" }}>TOP FIX</span>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 500, margin: 0, letterSpacing: "-0.02em" }}>Your #1 Ranking Blocker</h2>
            </div>
            <div style={{ background: "#FFFFFF", border: "0.5px solid rgba(230,57,70,0.25)", borderRadius: 8, padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E63946", flexShrink: 0 }} />
              <span style={{ fontSize: "0.9rem", fontWeight: 500, flex: 1 }}>{data.actionPlan[0].action}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--muted)", flexShrink: 0 }}>{data.actionPlan[0].effort}</span>
            </div>
            {data.actionPlan.length > 1 && (
              <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: "0.75rem", marginBottom: 0 }}>
                + {data.actionPlan.length - 1} more fixes in the full report
              </p>
            )}
          </div>
        )}

        {/* ── Reviews section — custom partial handling ── */}
        {data.reviews === null ? (
          <div className="report-section" style={{ ...card, marginBottom: "0.75rem" }}>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
              Review analysis unavailable for this listing — this can happen if the listing has fewer than 3 reviews or if review data is temporarily unavailable.
            </p>
          </div>
        ) : data.reviews ? (
          <div className="report-section" style={{ ...card, marginBottom: "0.75rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <h2 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontStyle: "italic", fontSize: "1.2rem", fontWeight: 400, margin: 0, letterSpacing: "-0.01em" }}>
                What guests are really saying
              </h2>
              <span style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--muted)", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 999, padding: "0.2rem 0.65rem" }}>
                {data.reviews.totalCount} reviews analyzed
              </span>
            </div>

            {/* Sentiment bar */}
            {(() => {
              const s = data.reviews!.sentimentScore;
              const barColor = s >= 76 ? "#A8DADC" : s >= 50 ? "#457B9D" : "#E63946";
              return (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)", flexShrink: 0 }}>Overall sentiment</span>
                    <div style={{ flex: 1, height: 8, background: "var(--color-border)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${s}%`, background: barColor, borderRadius: 999, transition: "width 0.6s ease" }} />
                    </div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: barColor, flexShrink: 0 }}>{s}/100</span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic", margin: 0 }}>{data.reviews!.velocityNote}</p>
                </div>
              );
            })()}

            {/* Red flags — shown above columns if any exist (full access only) */}
            {access === "full" && (data.reviews?.redFlags?.length ?? 0) > 0 && (
              <div style={{ background: "rgba(230,57,70,0.06)", border: "0.5px solid rgba(230,57,70,0.3)", borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{ color: "#E63946", fontSize: "1rem" }}>⚠</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#E63946", letterSpacing: "0.06em" }}>NEEDS IMMEDIATE ATTENTION</span>
                </div>
                {data.reviews!.redFlags.map((flag, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: i < data.reviews!.redFlags.length - 1 ? "0.75rem" : 0 }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, padding: "0.15rem 0.5rem", borderRadius: 999, background: flag.severity === "critical" ? "rgba(230,57,70,0.15)" : "rgba(69,123,157,0.12)", color: flag.severity === "critical" ? "#E63946" : "#457B9D", flexShrink: 0, marginTop: "0.1rem" }}>
                      {flag.severity.toUpperCase()}
                    </span>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, margin: "0 0 0.2rem", color: "var(--text)" }}>{flag.issue}</p>
                      <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>{flag.suggestedFix}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Two columns — praised vs complaints */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              {/* Praised */}
              <div>
                <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#3B6D11", letterSpacing: "0.07em", marginBottom: "0.65rem" }}>✓ WHAT GUESTS LOVE</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {(access === "partial" ? data.reviews!.praisedThemes.slice(0, 1) : data.reviews!.praisedThemes).map((t, i) => (
                    <div key={i} style={{ background: "#FFFFFF", border: "0.5px solid var(--border)", borderLeft: "3px solid #A8DADC", borderRadius: 8, padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{t.theme}</span>
                        <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "#1D3557", background: "rgba(168,218,220,0.3)", border: "0.5px solid #A8DADC", borderRadius: 999, padding: "0.1rem 0.45rem", flexShrink: 0 }}>
                          {t.frequency}×
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "#457B9D", fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>&ldquo;{t.exampleQuote}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complaints */}
              <div>
                <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#E63946", letterSpacing: "0.07em", marginBottom: "0.65rem" }}>✗ WHAT GUESTS FLAG</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {(access === "partial" ? data.reviews!.complaintThemes.slice(0, 1) : data.reviews!.complaintThemes).map((t, i) => (
                    <div key={i} style={{ background: "#FFFFFF", border: "0.5px solid var(--border)", borderLeft: "3px solid #E63946", borderRadius: 8, padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{t.theme}</span>
                        <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "#E63946", background: "rgba(230,57,70,0.1)", border: "0.5px solid rgba(230,57,70,0.35)", borderRadius: 999, padding: "0.1rem 0.45rem", flexShrink: 0 }}>
                          {t.frequency}×
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "#457B9D", fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>&ldquo;{t.exampleQuote}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Partial upgrade nudge */}
            {access === "partial" && (
              <p style={{ fontSize: "0.82rem", color: "#457B9D", marginBottom: "1.25rem", margin: "0 0 1.25rem" }}>
                See all {(data.reviews?.praisedThemes?.length ?? 0) + (data.reviews?.complaintThemes?.length ?? 0) + (data.reviews?.hiddenInsights?.length ?? 0)} insights —{" "}
                <a href="#paywall" style={{ color: "#457B9D", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}
                  onClick={(e) => { e.preventDefault(); document.querySelector("[data-paywall]")?.scrollIntoView({ behavior: "smooth" }); }}>
                  unlock full report
                </a>
              </p>
            )}

            {/* Hidden insights — full access only */}
            {access === "full" && (data.reviews?.hiddenInsights?.length ?? 0) > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text)", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                  What your reviews reveal that your listing doesn&apos;t mention
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", fontStyle: "italic", marginBottom: "0.75rem" }}>
                  These are untapped selling points guests care about — add them to your description.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {data.reviews!.hiddenInsights.map((ins, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 2fr", borderRadius: 10, overflow: "hidden", border: "0.5px solid var(--border)" }}>
                      <div style={{ background: "#F1FAEE", padding: "1rem 1.25rem", display: "flex", alignItems: "center" }}>
                        <p style={{ fontSize: "0.875rem", color: "#1D3557", margin: 0, lineHeight: 1.55 }}>{ins.insight}</p>
                      </div>
                      <div style={{ background: "#1D3557", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <span style={{ color: "#A8DADC", fontSize: "1rem", flexShrink: 0 }}>→</span>
                          <p style={{ fontSize: "0.8rem", color: "#F1FAEE", margin: 0, lineHeight: 1.55 }}>{ins.suggestedAddition}</p>
                        </div>
                        <CopyBtn text={ins.suggestedAddition} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Host response quality */}
            {access === "full" && (() => {
              const q = data.reviews!.hostResponseQuality;
              const cfg = {
                excellent: { bg: "rgba(168,218,220,0.3)", color: "#1D3557", label: "Excellent" },
                good: { bg: "#F1FAEE", color: "#457B9D", label: "Good" },
                poor: { bg: "rgba(230,57,70,0.1)", color: "#E63946", label: "Poor" },
                none: { bg: "rgba(230,57,70,0.1)", color: "#E63946", label: "None" },
              }[q];
              return (
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Host response quality:</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "0.2rem 0.65rem", borderRadius: 999, background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                  {(q === "poor" || q === "none") && (
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic" }}>
                      Responding to reviews improves your Airbnb search ranking
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        ) : null}

        {/* ── Sections 02–07: blurred + paywall for partial access ── */}
        <div style={{ position: "relative" }}>
          <div style={{ filter: access === "partial" ? "blur(4px)" : "none", pointerEvents: access === "partial" ? "none" : "auto", userSelect: access === "partial" ? "none" : "auto", transition: "filter 0.2s" }}>

        {/* 02 Description */}
        <div className="report-section" style={{ ...card, marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <SectionTitle n="02" title="Description Rewrite" sub={tabKeys.length > 1 ? "Four sections rewritten. Toggle before/after to compare." : undefined} />
            <ScoreBadge score={data.description.score} />
          </div>
          {(data.description.issues.length > 0 || data.description.suggestions.length > 0 || (data.description.clichesFound?.length ?? 0) > 0 || (data.description.missingAnswers?.length ?? 0) > 0) && (
            <div style={{ marginBottom: "1.25rem" }}>
              {data.description.issues.length > 0 && <div style={{ marginBottom: "1rem" }}><span style={{ ...label, marginBottom: "0.5rem" }}>Issues</span><BulletList items={data.description.issues} /></div>}
              {(data.description.clichesFound?.length ?? 0) > 0 && <div style={{ marginBottom: "1rem" }}><span style={{ ...label, marginBottom: "0.5rem" }}>Clichés to remove</span><BulletList items={data.description.clichesFound!} /></div>}
              {(data.description.missingAnswers?.length ?? 0) > 0 && <div style={{ marginBottom: "1rem" }}><span style={{ ...label, marginBottom: "0.5rem" }}>Guest questions not answered</span><BulletList items={data.description.missingAnswers!} accent /></div>}
              {data.description.suggestions.length > 0 && <div style={{ marginBottom: "1rem" }}><span style={{ ...label, marginBottom: "0.5rem" }}>Suggestions</span><BulletList items={data.description.suggestions} accent /></div>}
            </div>
          )}
          {tabKeys.length > 0 && (
            <>
              {tabKeys.length > 1 && (
                <div className="pdf-hide" style={{ display: "flex", gap: "0.35rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                  {tabKeys.map((key) => (
                    <button key={key} onClick={() => setDescTab(key)} style={{ padding: "0.35rem 0.9rem", borderRadius: 8, border: "0.5px solid", borderColor: descTab === key ? "var(--accent)" : "var(--border)", background: descTab === key ? "rgba(230,57,70,0.1)" : "transparent", color: descTab === key ? "var(--accent)" : "var(--muted)", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer" }}>
                      {data.description.tabs[key].label}
                    </button>
                  ))}
                </div>
              )}
              {data.description.tabs[descTab]?.current && (
                <div className="pdf-hide" style={{ display: "inline-flex", border: "0.5px solid var(--border)", borderRadius: 8, overflow: "hidden", marginBottom: "1rem" }}>
                  {(["before", "after"] as const).map((v) => (
                    <button key={v} onClick={() => setDescView(v)} style={{ padding: "0.3rem 0.9rem", border: "none", borderRight: v === "before" ? "0.5px solid var(--border)" : "none", background: descView === v ? "var(--text)" : "transparent", color: descView === v ? "var(--surface)" : "var(--muted)", fontSize: "0.78rem", fontWeight: 500, cursor: "pointer", textTransform: "capitalize" }}>{v}</button>
                  ))}
                </div>
              )}
              <div className="before-after-card" style={{ background: descView === "after" ? "#1D3557" : "#FFFFFF", border: "0.5px solid var(--color-border)", borderRadius: 10, padding: "1.25rem 1.5rem", transition: "background 0.25s ease" }}>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.75, color: descView === "after" ? "#FFFFFF" : "#457B9D", margin: 0 }}>
                  {descView === "before" && data.description.tabs[descTab]?.current ? data.description.tabs[descTab].current : data.description.tabs[descTab]?.optimized ?? ""}
                </p>
              </div>
              <div className="pdf-hide" style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
                <CopyBtn text={data.description.tabs[descTab]?.optimized ?? ""} />
              </div>
            </>
          )}
        </div>

        {/* 03 SEO & Search Ranking */}
        <div className="report-section" style={{ ...card, marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "var(--accent)", letterSpacing: "0.08em" }}>03</span>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 500, margin: 0, letterSpacing: "-0.02em" }}>SEO & Search Ranking</h2>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.83rem", margin: "0.35rem 0 0 1.4rem", lineHeight: 1.55, fontStyle: "italic" }}>These are the factors Airbnb&apos;s algorithm weighs most heavily when deciding where your listing appears in search results.</p>
            </div>
            <ScoreBadge score={data.seo.score} />
          </div>
          {(data.seo.issues.length > 0 || data.seo.suggestions.length > 0) && (
            <div style={{ marginBottom: "1.25rem" }}>
              {data.seo.issues.length > 0 && <div style={{ marginBottom: "0.75rem" }}><span style={{ ...label, marginBottom: "0.5rem" }}>Issues</span><BulletList items={data.seo.issues} /></div>}
              {data.seo.suggestions.length > 0 && <div style={{ marginBottom: "0.75rem" }}><span style={{ ...label, marginBottom: "0.5rem" }}>Suggestions</span><BulletList items={data.seo.suggestions} accent /></div>}
            </div>
          )}
          {(data.seo.detectedKeywords.length > 0 || data.seo.missingKeywords.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              {data.seo.detectedKeywords.length > 0 && <div><span style={label}>Detected in your listing</span><div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>{data.seo.detectedKeywords.map((kw) => <span key={kw} className="tag-good" style={pill("rgba(168,218,220,0.3)", "#1D3557", "#A8DADC")}>{kw}</span>)}</div></div>}
              {data.seo.missingKeywords.length > 0 && <div><span style={label}>Missing — add these</span><div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>{data.seo.missingKeywords.map((kw) => <span key={kw} style={pill("#FFFFFF", "var(--muted)", "var(--border)")}>+ {kw}</span>)}</div></div>}
            </div>
          )}
          <Divider />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160, background: "#FFFFFF", border: `0.5px solid ${data.seo.instantBook ? "#A8DADC" : "rgba(230,57,70,0.35)"}`, borderRadius: 8, padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: data.seo.instantBook ? "#16A34A" : "#DC2626", flexShrink: 0 }} />
              <div>
                <span style={label}>Instant Book</span>
                <div style={{ fontSize: "0.82rem", fontWeight: 500, marginTop: "0.15rem", color: data.seo.instantBook ? "#16A34A" : "#DC2626" }}>{data.seo.instantBook ? "Enabled" : "Off — enable it"}</div>
              </div>
            </div>
            {data.seo.estimatedResponseRate !== "N/A" && <div style={{ flex: 1, minWidth: 140, background: "#FFFFFF", border: "0.5px solid var(--border)", borderRadius: 8, padding: "0.85rem 1rem" }}><span style={label}>Response rate</span><div style={{ fontSize: "0.9rem", fontWeight: 500, marginTop: "0.15rem" }}>{data.seo.estimatedResponseRate}</div></div>}
            {data.seo.reviewCount > 0 && <div style={{ flex: 1, minWidth: 140, background: "#FFFFFF", border: "0.5px solid var(--border)", borderRadius: 8, padding: "0.85rem 1rem" }}><span style={label}>Reviews</span><div style={{ fontSize: "0.9rem", fontWeight: 500, marginTop: "0.15rem" }}>{data.seo.reviewCount}</div></div>}
          </div>
        </div>

        {/* 04 Amenities */}
        <div className="report-section" style={{ ...card, marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <SectionTitle n="04" title="Amenity Gap Analysis" sub="Small additions here have outsized booking impact." />
            <ScoreBadge score={data.amenities.score} />
          </div>
          {(data.amenities.present.length > 0 || data.amenities.missing.length > 0) && (
            <div className="amenity-gap" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "1.5rem", marginBottom: "1.75rem" }}>
              {data.amenities.present.length > 0 && <div style={{ minWidth: 0, overflow: "hidden" }}><span style={label}>Present</span><div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>{data.amenities.present.map((a) => <span key={a} className="tag-good" style={{ ...pill("rgba(168,218,220,0.3)", "#1D3557", "#A8DADC"), whiteSpace: "normal", wordBreak: "break-word" }}>✓ {a}</span>)}</div></div>}
              {data.amenities.missing.length > 0 && <div style={{ minWidth: 0, overflow: "hidden" }}><span style={label}>Missing</span><div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>{data.amenities.missing.map((a) => <span key={a} style={{ ...pill("#FFFFFF", "var(--muted)", "var(--border)"), whiteSpace: "normal", wordBreak: "break-word" }}>+ {a}</span>)}</div></div>}
            </div>
          )}
          {data.amenities.highlightThese.length > 0 && <div style={{ marginBottom: data.amenities.quickWins.length > 0 ? "1.75rem" : 0 }}><span style={label}>Highlight these in your listing</span><div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>{data.amenities.highlightThese.map((a) => <span key={a} className="tag-good" style={pill("rgba(168,218,220,0.3)", "#1D3557", "#A8DADC")}>✓ {a}</span>)}</div></div>}
          {(data.amenities.issues.length > 0 || data.amenities.suggestions.length > 0) && (
            <div style={{ marginBottom: data.amenities.quickWins.length > 0 ? "1.25rem" : 0 }}>
              {data.amenities.issues.length > 0 && <div style={{ marginBottom: "0.75rem" }}><span style={{ ...label, marginBottom: "0.5rem" }}>Issues</span><BulletList items={data.amenities.issues} /></div>}
              {data.amenities.suggestions.length > 0 && <div><span style={{ ...label, marginBottom: "0.5rem" }}>Suggestions</span><BulletList items={data.amenities.suggestions} accent /></div>}
            </div>
          )}
          {data.amenities.quickWins.length > 0 && (
            <>
              <span style={label}>Quick wins</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.65rem" }}>
                {data.amenities.quickWins.map((win, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: "1rem", padding: "0.85rem 1rem", background: "#FFFFFF", border: "0.5px solid var(--border)", borderRadius: 8 }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{win.item}</span>
                    <span style={pill("rgba(230,57,70,0.1)", "#E63946", "rgba(230,57,70,0.35)")}>+{win.estimatedImpact}% bookings</span>
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{win.cost}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 05 Pricing */}
        <div className="report-section" style={{ ...card, marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <SectionTitle n="05" title="Pricing Intelligence" sub={data.pricing.currentBase > 0 && data.pricing.areaMedian > 0 ? `You're $${data.pricing.areaMedian - data.pricing.currentBase}/night below the area median. Raising to $${data.pricing.recommendedBase} is conservative.` : undefined} />
            <ScoreBadge score={data.pricing.score} />
          </div>
          {(data.pricing.issues.length > 0 || data.pricing.suggestions.length > 0) && (
            <div style={{ marginBottom: "1.25rem" }}>
              {data.pricing.issues.length > 0 && <div style={{ marginBottom: "0.75rem" }}><span style={{ ...label, marginBottom: "0.5rem" }}>Issues</span><BulletList items={data.pricing.issues} /></div>}
              {data.pricing.suggestions.length > 0 && <div><span style={{ ...label, marginBottom: "0.5rem" }}>Suggestions</span><BulletList items={data.pricing.suggestions} accent /></div>}
            </div>
          )}
          {data.pricing.benchmarkNote && <div style={{ background: "#FFFFFF", border: "0.5px solid #A8DADC", borderRadius: 10, padding: "1rem 1.25rem", fontSize: "0.875rem", lineHeight: 1.6, color: "#457B9D", marginBottom: data.pricing.areaMedian > 0 ? "1.5rem" : 0 }}>{data.pricing.benchmarkNote}</div>}
          {data.pricing.areaMedian > 0 && (
            <div className="pricing-table" style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginBottom: "2rem" }}>
              {([{ lbl: "Your current rate", value: data.pricing.currentBase, accent: false }, { lbl: "Area median", value: data.pricing.areaMedian, accent: false }, { lbl: "Recommended", value: data.pricing.recommendedBase, accent: true }, { lbl: "Top 10%", value: data.pricing.topTenPercent, accent: false }] as const).filter((row) => row.value > 0).map(({ lbl, value, accent }) => (
                <div key={lbl} style={{ display: "grid", gridTemplateColumns: "148px 1fr 44px", gap: "0.75rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: accent ? "var(--text)" : "var(--muted)", fontWeight: accent ? 500 : 400, textAlign: "right" }}>{lbl}</span>
                  <div style={{ background: "rgba(0,0,0,0.06)", borderRadius: 4, height: 10, overflow: "hidden", border: "none" }}>
                    <div style={{ height: "100%", width: `${(value / BAR_MAX) * 100}%`, background: accent ? "var(--accent)" : "#D4D4D4", borderRadius: 4, transition: "width 0.6s ease" }} />
                  </div>
                  <span style={{ fontSize: "0.82rem", fontWeight: accent ? 500 : 400, color: accent ? "var(--accent)" : "var(--text)" }}>${value}</span>
                </div>
              ))}
            </div>
          )}
          {data.pricing.recommendedBase > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.5rem", marginBottom: data.pricing.nextHighDemandEvent.name ? "1.25rem" : 0 }}>
              {[{ lbl: "Base rate", val: `$${data.pricing.recommendedBase}/night` }, ...(data.pricing.recommendedWeekend > 0 ? [{ lbl: "Weekend", val: `$${data.pricing.recommendedWeekend}/night` }] : []), ...(data.pricing.recommendedPeakSeason > 0 ? [{ lbl: "Peak season", val: `$${data.pricing.recommendedPeakSeason}/night` }] : []), ...(data.pricing.recommendedCleaningFee > 0 ? [{ lbl: "Cleaning fee", val: `$${data.pricing.recommendedCleaningFee}` }] : [])].map(({ lbl, val }) => (
                <div key={lbl} style={{ background: "#FFFFFF", border: "0.5px solid var(--border)", borderRadius: 8, padding: "0.85rem" }}>
                  <span style={label}>{lbl}</span>
                  <div style={{ fontSize: "0.95rem", fontWeight: 500, marginTop: "0.4rem" }}>{val}</div>
                </div>
              ))}
            </div>
          )}
          {data.pricing.nextHighDemandEvent.name && (
            <div style={{ background: "rgba(230,57,70,0.08)", border: "0.5px solid rgba(230,57,70,0.3)", borderRadius: 10, padding: "1.1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: "0 0 0.2rem", fontSize: "0.72rem", fontWeight: 500, color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Upcoming high-demand event</p>
                <p style={{ margin: "0 0 0.15rem", fontSize: "0.9rem", fontWeight: 500 }}>{data.pricing.nextHighDemandEvent.name}</p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>{data.pricing.nextHighDemandEvent.date}</p>
              </div>
              {data.pricing.nextHighDemandEvent.suggestedPrice > 0 && (
                <div style={{ textAlign: "right" }}>
                  <span style={label}>Suggested price</span>
                  <div style={{ fontSize: "1.6rem", fontWeight: 500, color: "var(--accent)", letterSpacing: "-0.03em", marginTop: "0.2rem" }}>
                    ${data.pricing.nextHighDemandEvent.suggestedPrice}<span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--muted)" }}>/night</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 06 Photos */}
        <div className="report-section" style={{ ...card, marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "var(--accent)", letterSpacing: "0.08em" }}>06</span>
                <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: 0, letterSpacing: "-0.01em" }}>Photo Audit ✦ Bonus — Beta</h2>
                <span style={{ display: "inline-flex", alignItems: "center", padding: "0.15rem 0.5rem", borderRadius: 999, fontSize: "0.68rem", fontWeight: 500, background: "#E6F1FB", color: "#185FA5", border: "0.5px solid #B8D4F0" }}>Beta</span>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.83rem", margin: "0.35rem 0 0 1.4rem", lineHeight: 1.55, fontStyle: "italic" }}>AI photo analysis is in beta. Recommendations are based on listing metadata and review signals rather than direct image analysis.</p>
            </div>
            <ScoreBadge score={data.photos.score} />
          </div>
          {data.photos.issues.length > 0 && (
            <>
              <span style={label}>Issues</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginTop: "0.65rem", marginBottom: "1.75rem" }}>
                {data.photos.issues.map((issue, i) => {
                  const cfg = { critical: { dot: "#E63946", bg: "rgba(230,57,70,0.08)", border: "rgba(230,57,70,0.3)", tag: "Critical", tagColor: "#E63946" }, warning: { dot: "#D97706", bg: "#FFFBEB", border: "#FDE68A", tag: "Warning", tagColor: "#D97706" }, tip: { dot: "#457B9D", bg: "rgba(69,123,157,0.08)", border: "#A8DADC", tag: "Tip", tagColor: "#457B9D" } }[issue.severity];
                  return (
                    <div key={i} style={{ display: "flex", gap: "0.85rem", padding: "0.85rem 1rem", background: cfg.bg, border: `0.5px solid ${cfg.border}`, borderRadius: 8, alignItems: "flex-start" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0, marginTop: 5 }} />
                      <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 500, color: cfg.tagColor, marginRight: "0.4rem", fontSize: "0.72rem", letterSpacing: "0.05em" }}>{cfg.tag.toUpperCase()}</span>
                        {issue.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {data.photos.suggestions.length > 0 && <div style={{ marginBottom: "1.25rem" }}><span style={{ ...label, marginBottom: "0.5rem" }}>Suggestions</span><BulletList items={data.photos.suggestions} accent /></div>}
          {data.photos.recommendedOrder.length > 0 && (
            <>
              <span style={label}>Recommended photo order</span>
              <div className="photo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "0.5rem", marginTop: "0.65rem" }}>
                {data.photos.recommendedOrder.map((shot) => (
                  <div key={shot.slot} style={{ background: "#FFFFFF", border: "0.5px solid var(--border)", borderRadius: 8, padding: "0.85rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(230,57,70,0.08)", border: "0.5px solid rgba(230,57,70,0.3)", color: "var(--accent)", fontSize: "0.72rem", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{shot.slot}</span>
                    <div>
                      <p style={{ margin: "0 0 0.25rem", fontSize: "0.82rem", fontWeight: 500 }}>{shot.shotType}</p>
                      {shot.tip && <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--muted)", lineHeight: 1.5 }}>{shot.tip}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 07 Action Plan */}
        <div className="report-section" style={card}>
          <SectionTitle n="07" title="Action Plan" sub={`${checked.size} of ${actionItems.length} complete`} />
          <div style={{ background: "rgba(0,0,0,0.06)", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: "1.5rem" }}>
            <div style={{ height: "100%", width: `${actionItems.length > 0 ? (checked.size / actionItems.length) * 100 : 0}%`, background: "var(--accent)", borderRadius: 4, transition: "width 0.3s ease" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", borderRadius: 10, overflow: "hidden", border: "0.5px solid var(--color-border)" }}>
            {actionItems.map((item, i) => {
              const impactStyle = { high: pill("rgba(230,57,70,0.12)", "#E63946", "rgba(230,57,70,0.4)"), medium: pill("rgba(69,123,157,0.12)", "#457B9D", "#A8DADC"), low: pill("rgba(168,218,220,0.25)", "#1D3557", "#A8DADC") }[item.impact];
              const done = checked.has(i);
              return (
                <div key={i} className="action-plan-item" onClick={() => toggle(i)} style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.85rem 1rem", background: "#FFFFFF", borderBottom: i < actionItems.length - 1 ? "0.5px solid var(--color-border)" : "none", cursor: "pointer", opacity: done ? 0.45 : 1, transition: "opacity 0.15s", userSelect: "none" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: `0.5px solid ${done ? "var(--accent)" : "var(--border)"}`, background: done ? "var(--accent)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s, border-color 0.15s" }}>
                    {done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1.5 4L3.5 6L8.5 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span style={{ flex: 1, fontSize: "0.875rem", textDecoration: done ? "line-through" : "none", color: done ? "var(--muted)" : "var(--text)" }}>{item.action}</span>
                  <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                    <span style={pill("#FFFFFF", "var(--muted)", "var(--border)")}>{item.effort}</span>
                    <span style={impactStyle}>{item.impact}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

          </div>{/* end blur wrapper */}

          {/* Paywall overlay */}
          {access === "partial" && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "3rem" }}>
              {/* Radial gradient fade */}
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 20%, #FFFFFF 30%, transparent 100%)", pointerEvents: "none" }} />

              <div style={{ position: "sticky", top: "2rem", zIndex: 10, width: "100%", maxWidth: 520, padding: "0 1rem" }}>
                <div style={{ background: "#FFFFFF", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "2rem", boxShadow: "0 8px 40px rgba(29,53,87,0.12)" }}>

                  {/* Header copy */}
                  <p style={{ fontSize: "1rem", fontWeight: 600, color: "#1D3557", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                    {(data.seo.reviewCount ?? 0) > 0
                      ? `We analyzed all ${data.seo.reviewCount} reviews from your listing`
                      : "Your full analysis is ready"}
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                    Unlock the full report to see where you rank vs. competitors, what guests are really saying, and your complete fix plan.
                  </p>

                  {/* Tier cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>

                    {/* $4 single — only show if user hasn't already purchased this listing */}
                    {tier !== "single" && (
                      <div style={{ background: "#FFFFFF", border: "1px solid #A8DADC", borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column" }}>
                        <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.07em", marginBottom: "0.75rem" }}>THIS LISTING</p>
                        <p style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "0.2rem", color: "#1D3557" }}>$4</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "1rem" }}>one-time</p>
                        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
                          {["Full report", "3 reruns on this listing"].map((f) => (
                            <li key={f} style={{ fontSize: "0.78rem", color: "var(--muted)", display: "flex", gap: "0.4rem" }}>
                              <span style={{ color: "#E63946", flexShrink: 0 }}>✓</span> {f}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => handleUpgrade("single")}
                          disabled={paywallLoading !== null}
                          style={{ width: "100%", height: 38, background: "#FFFFFF", border: "1.5px solid #E63946", color: "#E63946", fontWeight: 600, fontSize: "0.82rem", borderRadius: 8, cursor: paywallLoading ? "not-allowed" : "pointer", opacity: paywallLoading === "single" ? 0.6 : 1, fontFamily: "inherit" }}
                          onMouseEnter={(e) => { if (!paywallLoading) { (e.currentTarget as HTMLButtonElement).style.background = "#E63946"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; (e.currentTarget as HTMLButtonElement).style.color = "#E63946"; }}
                        >
                          {paywallLoading === "single" ? "Redirecting…" : "Unlock — $4 →"}
                        </button>
                      </div>
                    )}

                    {/* $9/mo unlimited — highlighted */}
                    <div style={{ background: "#FFFFFF", border: "2px solid #457B9D", borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", position: "relative", gridColumn: tier === "single" ? "1 / -1" : "auto" }}>
                      <div style={{ position: "absolute", top: -1, right: 14, background: "#457B9D", color: "#FFFFFF", fontSize: "0.62rem", fontWeight: 600, padding: "0.18rem 0.5rem", borderRadius: "0 0 6px 6px", letterSpacing: "0.05em" }}>
                        MOST POPULAR
                      </div>
                      <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "#457B9D", letterSpacing: "0.07em", marginBottom: "0.75rem" }}>ALL LISTINGS</p>
                      <p style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "0.2rem", color: "#1D3557" }}>$9</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "1rem" }}>/month · cancel anytime</p>
                      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
                        {(tier === "single"
                          ? ["Unlimited listings", "Unlimited reruns", "All future features"]
                          : ["Unlimited listings", "Unlimited reruns", "All future features"]
                        ).map((f) => (
                          <li key={f} style={{ fontSize: "0.78rem", color: "var(--muted)", display: "flex", gap: "0.4rem" }}>
                            <span style={{ color: "#E63946", flexShrink: 0 }}>✓</span> {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleUpgrade("unlimited")}
                        disabled={paywallLoading !== null}
                        style={{ width: "100%", height: 38, background: "#E63946", border: "none", color: "#fff", fontWeight: 600, fontSize: "0.82rem", borderRadius: 8, cursor: paywallLoading ? "not-allowed" : "pointer", opacity: paywallLoading === "unlimited" ? 0.6 : 1, fontFamily: "inherit" }}
                      >
                        {paywallLoading === "unlimited" ? "Redirecting…" : tier === "single" ? "Upgrade to unlimited →" : "Unlock — $9/mo →"}
                      </button>
                    </div>
                  </div>

                  {paywallError && (
                    <p style={{ fontSize: "0.75rem", color: "#DC2626", textAlign: "center", margin: "0 0 0.75rem" }}>{paywallError}</p>
                  )}

                  <p style={{ fontSize: "0.72rem", color: "var(--muted)", textAlign: "center", margin: 0 }}>
                    🔒 Secured by Stripe · Cancel anytime
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>{/* end paywall wrapper */}

      </div>

      {/* Print tip toast — first-time only */}
      {printTip && (
        <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "var(--text)", color: "var(--surface)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius)", fontSize: "0.82rem", fontWeight: 500, zIndex: 200, maxWidth: 400, textAlign: "center", lineHeight: 1.5 }}>
          In the print dialog, set destination to <strong style={{ color: "#fff" }}>Save as PDF</strong> and paper size to <strong style={{ color: "#fff" }}>A4</strong> for best results
        </div>
      )}
    </div>
  );
}
