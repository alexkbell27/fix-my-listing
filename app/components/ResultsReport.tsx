"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK } from "@/app/results/[id]/mockData";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DescTab { label: string; current: string; optimized: string; }

export interface ReportData {
  listingName: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  url?: string | null;
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
  };
}

// ─── Design tokens ────────────────────────────────────────────────────────────

export const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "0.5px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "1.75rem",
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
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ flexShrink: 0, padding: "0.35rem 0.8rem", borderRadius: 8, border: "0.5px solid var(--border)", background: copied ? "#F0FFF4" : "var(--surface)", color: copied ? "#16A34A" : "var(--muted)", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", transition: "color 0.15s, background 0.15s" }}
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
  const bg = score >= 70 ? "#F0FFF4" : score >= 40 ? "#FFFBEB" : "#FFF5F5";
  const color = score >= 70 ? "#16A34A" : score >= 40 ? "#D97706" : "#DC2626";
  const border = score >= 70 ? "#BBF7D0" : score >= 40 ? "#FDE68A" : "#FECACA";
  const lbl = score >= 70 ? "Good" : score >= 40 ? "Fair" : "Poor";
  const tagClass = score >= 70 ? "tag-good" : score >= 40 ? "tag-warn" : "tag-bad";
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
}: {
  data: ReportData;
  showNav?: boolean;
}) {
  const tabKeys = Object.keys(data.description.tabs);
  const [descTab, setDescTab] = useState<string>(tabKeys[0] ?? "opening");
  const [descView, setDescView] = useState<"before" | "after">("after");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [printTip, setPrintTip] = useState(false);

  const toggle = (i: number) =>
    setChecked((prev) => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; });

  const handleDownload = () => {
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
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>
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
        <nav style={{ borderBottom: "0.5px solid var(--border)", background: "var(--surface)", padding: "0 2rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <Link href="/" style={{ fontWeight: 500, fontSize: "1rem", textDecoration: "none", color: "var(--text)" }}>
            Fix My <span style={{ color: "var(--accent)" }}>Listing</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              className="download-btn"
              onClick={handleDownload}
              style={{ padding: "0.35rem 0.85rem", borderRadius: "var(--radius)", border: "0.5px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
            >
              Download PDF
            </button>
            <Link href="/dashboard" style={{ fontSize: "0.82rem", color: "var(--muted)", textDecoration: "none" }}>My reports</Link>
            <Link href="/" style={{ fontSize: "0.82rem", color: "var(--muted)", textDecoration: "none" }}>New Report</Link>
          </div>
        </nav>
      )}

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 2rem 7rem" }}>

        {/* Header */}
        {headerMeta && <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.3rem" }}>{headerMeta}</p>}
        {data.url && <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.3rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.url}</p>}
        <h1 style={{ fontSize: "1.35rem", fontWeight: 500, letterSpacing: "-0.02em", marginBottom: "2rem" }}>{data.listingName}</h1>

        {/* Score hero */}
        <div className="score-section report-section" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.75rem", marginBottom: "0.75rem", alignItems: "stretch" }}>
          <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", padding: "1.5rem 2.25rem" }}>
            <span style={{ ...label, marginBottom: "0.5rem" }}>Search ranking score</span>
            <div style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 1, color: "#CACACA" }}>{data.currentScore}</div>
                <span style={{ ...label, marginTop: "0.4rem" }}>Current</span>
              </div>
              <div style={{ color: "var(--border)", fontSize: "1.5rem" }}>→</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 1, color: "var(--accent)" }}>{data.projectedScore}</div>
                <span style={{ ...label, marginTop: "0.4rem" }}>Projected</span>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
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
                <div style={{ flex: 1, background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.9rem", color: "var(--muted)" }}>{data.title.current}</div>
                <span className="tag-bad" style={pill("#FFF1F1", "#DC2626", "#FECACA")}>Poor</span>
                <span style={pill("var(--bg)", "var(--muted)", "var(--border)")}>{data.title.currentCharCount} chars</span>
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
                  <div key={i} className="before-after-card" style={{ background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 10, padding: "1rem 1rem 0.85rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.9rem", fontWeight: 500, margin: "0 0 0.5rem", lineHeight: 1.4 }}>{alt.text}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.73rem", color: "var(--muted)", marginRight: "0.25rem" }}>{alt.charCount} chars ·</span>
                        {alt.keywords.map((kw) => <span key={kw} style={pill("#FFF5F5", "var(--accent)", "#FFD5D7")}>{kw}</span>)}
                      </div>
                    </div>
                    <CopyBtn text={alt.text} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

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
                    <button key={key} onClick={() => setDescTab(key)} style={{ padding: "0.35rem 0.9rem", borderRadius: 8, border: "0.5px solid", borderColor: descTab === key ? "var(--accent)" : "var(--border)", background: descTab === key ? "#FFF5F5" : "transparent", color: descTab === key ? "var(--accent)" : "var(--muted)", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer" }}>
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
              <div className="before-after-card" style={{ background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 10, padding: "1.1rem 1.25rem" }}>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.75, color: (descView === "before" && data.description.tabs[descTab]?.current) ? "var(--muted)" : "var(--text)", margin: 0 }}>
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
              {data.seo.detectedKeywords.length > 0 && <div><span style={label}>Detected in your listing</span><div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>{data.seo.detectedKeywords.map((kw) => <span key={kw} className="tag-good" style={pill("#F0FFF4", "#16A34A", "#BBF7D0")}>{kw}</span>)}</div></div>}
              {data.seo.missingKeywords.length > 0 && <div><span style={label}>Missing — add these</span><div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>{data.seo.missingKeywords.map((kw) => <span key={kw} style={pill("var(--bg)", "var(--muted)", "var(--border)")}>+ {kw}</span>)}</div></div>}
            </div>
          )}
          <Divider />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160, background: "var(--bg)", border: `0.5px solid ${data.seo.instantBook ? "#BBF7D0" : "#FECACA"}`, borderRadius: 8, padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: data.seo.instantBook ? "#16A34A" : "#DC2626", flexShrink: 0 }} />
              <div>
                <span style={label}>Instant Book</span>
                <div style={{ fontSize: "0.82rem", fontWeight: 500, marginTop: "0.15rem", color: data.seo.instantBook ? "#16A34A" : "#DC2626" }}>{data.seo.instantBook ? "Enabled" : "Off — enable it"}</div>
              </div>
            </div>
            {data.seo.estimatedResponseRate !== "N/A" && <div style={{ flex: 1, minWidth: 140, background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 8, padding: "0.85rem 1rem" }}><span style={label}>Response rate</span><div style={{ fontSize: "0.9rem", fontWeight: 500, marginTop: "0.15rem" }}>{data.seo.estimatedResponseRate}</div></div>}
            {data.seo.reviewCount > 0 && <div style={{ flex: 1, minWidth: 140, background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 8, padding: "0.85rem 1rem" }}><span style={label}>Reviews</span><div style={{ fontSize: "0.9rem", fontWeight: 500, marginTop: "0.15rem" }}>{data.seo.reviewCount}</div></div>}
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
              {data.amenities.present.length > 0 && <div style={{ minWidth: 0, overflow: "hidden" }}><span style={label}>Present</span><div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>{data.amenities.present.map((a) => <span key={a} className="tag-good" style={{ ...pill("#F0FFF4", "#16A34A", "#BBF7D0"), whiteSpace: "normal", wordBreak: "break-word" }}>✓ {a}</span>)}</div></div>}
              {data.amenities.missing.length > 0 && <div style={{ minWidth: 0, overflow: "hidden" }}><span style={label}>Missing</span><div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>{data.amenities.missing.map((a) => <span key={a} style={{ ...pill("var(--bg)", "var(--muted)", "var(--border)"), whiteSpace: "normal", wordBreak: "break-word" }}>+ {a}</span>)}</div></div>}
            </div>
          )}
          {data.amenities.highlightThese.length > 0 && <div style={{ marginBottom: data.amenities.quickWins.length > 0 ? "1.75rem" : 0 }}><span style={label}>Highlight these in your listing</span><div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>{data.amenities.highlightThese.map((a) => <span key={a} className="tag-good" style={pill("#F0FFF4", "#16A34A", "#BBF7D0")}>✓ {a}</span>)}</div></div>}
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
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: "1rem", padding: "0.85rem 1rem", background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 8 }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{win.item}</span>
                    <span style={pill("#FFF5F5", "var(--accent)", "#FFD5D7")}>+{win.estimatedImpact}% bookings</span>
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
          {data.pricing.benchmarkNote && <div style={{ background: "#FFF5F5", border: "0.5px solid #FFD5D7", borderRadius: 10, padding: "1rem 1.25rem", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: data.pricing.areaMedian > 0 ? "1.5rem" : 0 }}>{data.pricing.benchmarkNote}</div>}
          {data.pricing.areaMedian > 0 && (
            <div className="pricing-table" style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginBottom: "2rem" }}>
              {([{ lbl: "Your current rate", value: data.pricing.currentBase, accent: false }, { lbl: "Area median", value: data.pricing.areaMedian, accent: false }, { lbl: "Recommended", value: data.pricing.recommendedBase, accent: true }, { lbl: "Top 10%", value: data.pricing.topTenPercent, accent: false }] as const).filter((row) => row.value > 0).map(({ lbl, value, accent }) => (
                <div key={lbl} style={{ display: "grid", gridTemplateColumns: "148px 1fr 44px", gap: "0.75rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: accent ? "var(--text)" : "var(--muted)", fontWeight: accent ? 500 : 400, textAlign: "right" }}>{lbl}</span>
                  <div style={{ background: "var(--bg)", borderRadius: 4, height: 10, overflow: "hidden", border: "0.5px solid var(--border)" }}>
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
                <div key={lbl} style={{ background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 8, padding: "0.85rem" }}>
                  <span style={label}>{lbl}</span>
                  <div style={{ fontSize: "0.95rem", fontWeight: 500, marginTop: "0.4rem" }}>{val}</div>
                </div>
              ))}
            </div>
          )}
          {data.pricing.nextHighDemandEvent.name && (
            <div style={{ background: "#FFF5F5", border: "0.5px solid #FFD5D7", borderRadius: 10, padding: "1.1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
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
                  const cfg = { critical: { dot: "#DC2626", bg: "#FFF5F5", border: "#FECACA", tag: "Critical", tagColor: "#DC2626" }, warning: { dot: "#D97706", bg: "#FFFBEB", border: "#FDE68A", tag: "Warning", tagColor: "#D97706" }, tip: { dot: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", tag: "Tip", tagColor: "#2563EB" } }[issue.severity];
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
                  <div key={shot.slot} style={{ background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 8, padding: "0.85rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, background: "#FFF5F5", border: "0.5px solid #FFD5D7", color: "var(--accent)", fontSize: "0.72rem", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{shot.slot}</span>
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
          <div style={{ background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: "1.5rem" }}>
            <div style={{ height: "100%", width: `${actionItems.length > 0 ? (checked.size / actionItems.length) * 100 : 0}%`, background: "var(--accent)", borderRadius: 4, transition: "width 0.3s ease" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {actionItems.map((item, i) => {
              const impactStyle = { high: pill("#FFF5F5", "var(--accent)", "#FFD5D7"), medium: pill("var(--bg)", "var(--muted)", "var(--border)"), low: pill("var(--bg)", "#A3A3A3", "var(--border)") }[item.impact];
              const done = checked.has(i);
              return (
                <div key={i} className="action-plan-item" onClick={() => toggle(i)} style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.85rem 0", borderBottom: i < actionItems.length - 1 ? "0.5px solid var(--border)" : "none", cursor: "pointer", opacity: done ? 0.45 : 1, transition: "opacity 0.15s", userSelect: "none" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: `0.5px solid ${done ? "var(--accent)" : "var(--border)"}`, background: done ? "var(--accent)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s, border-color 0.15s" }}>
                    {done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1.5 4L3.5 6L8.5 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span style={{ flex: 1, fontSize: "0.875rem", textDecoration: done ? "line-through" : "none", color: done ? "var(--muted)" : "var(--text)" }}>{item.action}</span>
                  <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                    <span style={pill("var(--bg)", "var(--muted)", "var(--border)")}>{item.effort}</span>
                    <span style={impactStyle}>{item.impact}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
