// ─── Impact tiers ───────────────────────────────────────────────────────────
// Single source of truth for impact-score severity thresholds, shared by
// NewsCard and NewsModal (and any future signal surface) so their visuals
// never drift apart again.
export const CRITICAL_THRESHOLD = 70;
export const HIGH_THRESHOLD = 50;

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
  if (score >= HIGH_THRESHOLD)
    // High-but-under-critical: still neutral, just a touch stronger than low.
    return { key: "high", label: "High", score: "var(--text-secondary)", labelFg: "var(--text-muted)", bar: "var(--border-strong)" };
  return { key: "low", label: "Low", score: "var(--text-muted)", labelFg: "var(--text-muted)", bar: "var(--border)" };
}
