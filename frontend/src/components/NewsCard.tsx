"use client";

// Card data — a superset of what the home page, /news list, and (later) X posts
// pass in. Only the AI-signal fields drive the visual; the rest are metadata.
export type NewsCardItem = {
  id: string;
  title: string;
  source?: string;
  publishedAt?: string;
  aiTakeaway?: string | null;
  aiSentiment?: "bullish" | "bearish" | "neutral" | null;
  aiImpactScore?: number | null;
  aiAssets?: string[];
};

// ─── Impact tiers ───────────────────────────────────────────────────────────
// Restrained indicator: color is rare. Only scores at/above CRITICAL_THRESHOLD
// get real (red) color; everything below is neutral gray. Shared/exported so
// /signals (and any future signal surface) reuses the exact same scale.
export const CRITICAL_THRESHOLD = 70;

const CRITICAL_COLOR = "#A32D2D";

export type ImpactTier = {
  key: "critical" | "high" | "low" | "none";
  label: string;
  score: string; // inline color for the score number
  labelFg: string; // inline color for the tier label
  bar: string;   // inline color for the vertical tier bar
};

export function getImpactTier(score: number | null | undefined): ImpactTier {
  if (typeof score !== "number")
    return { key: "none", label: "", score: "var(--text-muted)", labelFg: "var(--text-muted)", bar: "var(--border)" };
  if (score >= CRITICAL_THRESHOLD)
    return { key: "critical", label: "Critical", score: CRITICAL_COLOR, labelFg: CRITICAL_COLOR, bar: CRITICAL_COLOR };
  if (score >= 50)
    // High-but-under-critical: still neutral, just a touch stronger than low.
    return { key: "high", label: "High", score: "var(--text-secondary)", labelFg: "var(--text-muted)", bar: "var(--border-strong)" };
  return { key: "low", label: "Low", score: "var(--text-muted)", labelFg: "var(--text-muted)", bar: "var(--border)" };
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SentimentArrow({ sentiment }: { sentiment?: string | null }) {
  if (sentiment === "bullish")
    return <span className="font-bold leading-none text-green-600">▲</span>;
  if (sentiment === "bearish")
    return <span className="font-bold leading-none text-red-600">▼</span>;
  if (sentiment === "neutral")
    return <span className="font-bold leading-none text-black/30" title="Unclear direction">–</span>;
  return null;
}

type Props<T extends NewsCardItem> = {
  item: T;
  /** Opens the shared NewsModal (no redirect). */
  onExpand: (item: T) => void;
};

/**
 * Dense, signal-first triage card — reused on the home page, /news, and later
 * /signals. A restrained impact indicator on the left (plain score + a thin
 * tier bar that only turns red at CRITICAL_THRESHOLD), the AI takeaway as the
 * hero in the middle, and a "View analysis" link on the right. The whole card
 * also opens the modal on click.
 */
export default function NewsCard<T extends NewsCardItem>({ item, onExpand }: Props<T>) {
  const tier = getImpactTier(item.aiImpactScore);
  const asset = item.aiAssets?.[0];

  return (
    <article
      onClick={() => onExpand(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand(item);
        }
      }}
      aria-label={item.aiTakeaway || item.title}
      className="flex cursor-pointer items-center gap-3.5 rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 transition-colors hover:border-(--border-strong) hover:bg-black/2"
    >
      {/* ZONE 1 — restrained impact: plain score + tier label */}
      <div className="flex w-10 shrink-0 flex-col items-center gap-0.5 self-center">
        <span className="text-[20px] font-medium leading-none tabular-nums" style={{ color: tier.score }}>
          {typeof item.aiImpactScore === "number" ? item.aiImpactScore : "–"}
        </span>
        {tier.label && (
          <span
            className="text-[9px] font-semibold uppercase leading-none tracking-wider"
            style={{ color: tier.labelFg }}
          >
            {tier.label}
          </span>
        )}
      </div>

      {/* Thin vertical tier bar — the only element that carries color */}
      <div
        className="h-8 w-0.75 shrink-0 self-center rounded-xs"
        style={{ backgroundColor: tier.bar }}
      />

      {/* ZONE 2 — content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Line 1 — meta: coin pill + sentiment arrow + source · time */}
        <div className="flex items-center gap-1.5 text-[11px] text-black/40">
          {asset && (
            <span className="rounded border border-black/15 px-1.5 py-0.5 font-medium text-black/70">
              {asset}
            </span>
          )}
          <SentimentArrow sentiment={item.aiSentiment} />
          <span className="truncate">
            {item.source}
            {item.source && item.publishedAt ? " · " : ""}
            {timeAgo(item.publishedAt)}
          </span>
        </div>

        {/* Line 2 — takeaway (hero) */}
        {item.aiTakeaway && (
          <p className="text-[16px] font-medium leading-[1.3] text-black">{item.aiTakeaway}</p>
        )}
      </div>

      {/* ZONE 3 — view analysis link */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onExpand(item); }}
        tabIndex={-1}
        className="flex shrink-0 items-center gap-0.5 self-center text-[14px] font-medium whitespace-nowrap"
        style={{ color: "var(--text-accent)" }}
      >
        View analysis
        <i className="bi bi-chevron-right text-[14px]" aria-hidden="true" />
      </button>
    </article>
  );
}
