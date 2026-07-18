"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/src/i18n";
import { API_BASE } from "@/src/constants/app";
import NewsModal from "@/src/components/NewsModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type NewsItem = {
  id: string;
  title: string;
  image: string | null;
  excerpt: string;
  content: string;
  source?: string;
  publishedAt?: string;
  url?: string;
  topics?: string[];
  aiProcessed?: boolean;
  aiSummary?: string | null;
  aiTakeaway?: string | null;
  aiSentiment?: "bullish" | "bearish" | "neutral" | null;
  aiImpactScore?: number | null;
  aiAssets?: string[];
};

type NewsResponse = {
  articles: NewsItem[];
  total: number;
  nextCursor: string | null;
};

// Date filtering: either a rolling "days" preset (All/Today) OR an explicit from/to range
// picked from the calendar. The two are mutually exclusive.
type Filters = { assets: string[]; days: string; from: string; to: string; minScore: string; maxScore: string };

// Quick presets for the common cases; the calendar covers exact day / range.
const DATE_PRESETS: { label: string; days: string }[] = [
  { label: "All", days: "" },
  { label: "Today", days: "1" },
];

// Score buckets mirror the severity thresholds used by impactStyle() below.
const SCORE_PRESETS: { label: string; min: string; max: string }[] = [
  { label: "All", min: "", max: "" },
  { label: "Critical (80+)", min: "80", max: "" },
  { label: "Notable (50+)", min: "50", max: "" },
  { label: "Low (<50)", min: "", max: "49" },
];

// History is limited to ~7 days.
const HISTORY_DAYS = 7;

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function prettyDay(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Impact color scales with severity — high impact must visually pop
function impactStyle(score: number): string {
  if (score >= 80) return "bg-red-600 text-white";        // critical
  if (score >= 50) return "bg-amber-500 text-white";      // notable
  return "bg-black/5 text-black/50";                       // low / ignorable
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT = 25;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── 7-day range picker ────────────────────────────────────────────────────────

function DayRangePicker({
  from,
  to,
  onApply,
}: {
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
}) {
  // Last 7 calendar days, oldest → newest.
  const days: string[] = [];
  for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(ymd(d));
  }

  // Pending selection while the user clicks; committed via onApply.
  const [start, setStart] = useState(from || "");
  const [end, setEnd] = useState(to || "");

  function clickDay(day: string) {
    // No start yet, or a full range already picked → begin a fresh selection.
    if (!start || (start && end)) {
      setStart(day);
      setEnd("");
      return;
    }
    // Second click sets the range (normalize order); same day = single day.
    if (day < start) {
      setEnd(start);
      setStart(day);
    } else {
      setEnd(day);
    }
  }

  const rangeEnd = end || start;
  const inRange = (day: string) => start && day >= start && day <= (rangeEnd || start);

  return (
    <div className="w-56 rounded border border-black/15 bg-white p-3 shadow-lg">
      <div className="mb-2 text-[11px] text-black/40">
        Pick a day or a range (last 7 days)
      </div>
      <div className="flex flex-col gap-0.5">
        {days.map((day) => {
          const selected = inRange(day);
          const isEdge = day === start || day === rangeEnd;
          return (
            <button
              key={day}
              type="button"
              onClick={() => clickDay(day)}
              className={`flex items-center justify-between rounded px-2 py-1.5 text-[13px] transition-colors ${
                selected
                  ? isEdge
                    ? "bg-black text-white"
                    : "bg-black/10 text-black"
                  : "text-black/70 hover:bg-black/5"
              }`}
            >
              <span>{prettyDay(day)}</span>
              <span className="text-[11px] opacity-60">
                {new Date(`${day}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" })}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => { setStart(""); setEnd(""); onApply("", ""); }}
          className="text-xs text-black/40 hover:text-black"
        >
          Reset
        </button>
        <button
          type="button"
          disabled={!start}
          onClick={() => onApply(start, end || start)}
          className="rounded bg-black px-3 py-1 text-xs font-medium text-white disabled:opacity-30"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// ─── Filters panel (shared by desktop sidebar + mobile drawer) ─────────────────

function FiltersPanel({
  filters,
  toggleAsset,
  applyDateRange,
  applyDaysPreset,
  applyScorePreset,
  clearFilters,
  hasFilters,
  availableAssets,
  showHeading = true,
}: {
  filters: Filters;
  toggleAsset: (asset: string) => void;
  applyDateRange: (from: string, to: string) => void;
  applyDaysPreset: (days: string) => void;
  applyScorePreset: (min: string, max: string) => void;
  clearFilters: () => void;
  hasFilters: boolean;
  availableAssets: string[];
  showHeading?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  // Which collapsible sections are open (all start open).
  const [openSections, setOpenSections] = useState({ coin: true, score: true, date: true });
  const boxRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLDivElement>(null);

  function toggleSection(key: "coin" | "score" | "date") {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Close popovers on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalendarOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = query.trim().toUpperCase();
  const matches = q
    ? availableAssets.filter((a) => a.includes(q))
    : availableAssets;

  return (
    <div className="flex flex-col">
      {/* Heading */}
      {showHeading && (
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <h2 className="text-base font-semibold">Filters</h2>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-black/40 hover:text-black"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Coin search */}
      <div className={`px-4 py-3 ${showHeading ? "border-t border-black/10" : ""}`}>
        <button
          type="button"
          onClick={() => toggleSection("coin")}
          className="mb-2 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-black/40 hover:text-black/60"
        >
          Coin
          <span className="text-[10px]">{openSections.coin ? "▾" : "▸"}</span>
        </button>

        {openSections.coin && (
        <>
        {/* Selected coin chips */}
        {filters.assets.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {filters.assets.map((a) => (
              <span
                key={a}
                className="flex items-center gap-1 rounded border border-black bg-black px-2 py-0.5 text-[13px] font-medium text-white"
              >
                {a}
                <button
                  type="button"
                  onClick={() => toggleAsset(a)}
                  aria-label={`Remove ${a}`}
                  className="cursor-pointer text-white/70 hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div ref={boxRef} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search coins (e.g. BTC)"
            className="w-full rounded border border-black/15 px-3 py-1.5 text-[13px] outline-none focus:border-black/40"
          />
          {open && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded border border-black/10 bg-white shadow-lg">
              {matches.length === 0 ? (
                <div className="px-3 py-2 text-[13px] text-black/40">No coins found</div>
              ) : (
                matches.map((a) => {
                  const checked = filters.assets.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAsset(a)}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-black/5 ${
                        checked ? "font-semibold" : "text-black/70"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                          checked ? "border-black bg-black text-white" : "border-black/25"
                        }`}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      {a}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {/* Score presets */}
      <div className="border-t border-black/10 px-4 py-3">
        <button
          type="button"
          onClick={() => toggleSection("score")}
          className="mb-2 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-black/40 hover:text-black/60"
        >
          Score
          <span className="text-[10px]">{openSections.score ? "▾" : "▸"}</span>
        </button>
        {openSections.score && (
          <div className="flex flex-wrap items-center gap-1.5">
            {SCORE_PRESETS.map((p) => {
              const active = filters.minScore === p.min && filters.maxScore === p.max;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyScorePreset(p.min, p.max)}
                  className={`rounded border px-3 py-1 text-[13px] transition-colors ${
                    active
                      ? "border-black bg-black text-white"
                      : "border-black/15 text-black/60 hover:border-black/30 hover:text-black"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Date presets + calendar */}
      <div className="border-t border-black/10 px-4 py-3">
        <button
          type="button"
          onClick={() => toggleSection("date")}
          className="mb-2 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-black/40 hover:text-black/60"
        >
          Date
          <span className="text-[10px]">{openSections.date ? "▾" : "▸"}</span>
        </button>
        {openSections.date && (
        <>
        <div className="flex flex-wrap items-center gap-1.5">
          {DATE_PRESETS.map((p) => {
            // A preset is active only when no explicit range is set.
            const active = !filters.from && !filters.to && filters.days === p.days;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => applyDaysPreset(p.days)}
                className={`rounded border px-3 py-1 text-[13px] transition-colors ${
                  active
                    ? "border-black bg-black text-white"
                    : "border-black/15 text-black/60 hover:border-black/30 hover:text-black"
                }`}
              >
                {p.label}
              </button>
            );
          })}

          {/* Calendar toggle */}
          <div ref={calRef} className="relative">
            <button
              type="button"
              onClick={() => setCalendarOpen((v) => !v)}
              aria-label="Pick a date or range"
              className={`flex h-8 items-center justify-center rounded border px-2.5 text-[13px] transition-colors ${
                filters.from || filters.to
                  ? "border-black bg-black text-white"
                  : "border-black/15 text-black/60 hover:border-black/30 hover:text-black"
              }`}
            >
              📅
            </button>
            {calendarOpen && (
              <div className="absolute left-0 top-full z-20 mt-1">
                <DayRangePicker
                  from={filters.from}
                  to={filters.to}
                  onApply={(f, tt) => { applyDateRange(f, tt); setCalendarOpen(false); }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Active range summary */}
        {(filters.from || filters.to) && (
          <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded border border-black bg-black px-2 py-0.5 text-[13px] font-medium text-white">
              {filters.from === filters.to
                ? prettyDay(filters.from)
                : `${prettyDay(filters.from)} – ${prettyDay(filters.to)}`}
              <button
                type="button"
                onClick={() => applyDateRange("", "")}
                aria-label="Clear date range"
                className="text-white/70 hover:text-white"
              >
                ×
              </button>
            </span>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const { t } = useTranslation();

  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({ assets: [], days: "", from: "", to: "", minScore: "", maxScore: "" });
  const [availableAssets, setAvailableAssets] = useState<string[]>([]);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch the list of coins we have news for, once.
  useEffect(() => {
    fetch(`${API_BASE}/news/assets`)
      .then((r) => r.json())
      .then((data: { assets: string[] }) => setAvailableAssets(data.assets ?? []))
      .catch(() => {});
  }, []);

  // Fetch news on filter/page change
  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({ limit: String(LIMIT) });
        if (cursor)                 params.set("cursor", cursor);
        if (filters.assets.length)  params.set("assets", filters.assets.join(","));
        // An explicit from/to range takes precedence over the rolling days preset.
        if (filters.from || filters.to) {
          if (filters.from) params.set("from", filters.from);
          if (filters.to)   params.set("to",   filters.to);
        } else if (filters.days) {
          params.set("days", filters.days);
        }
        if (filters.minScore) params.set("minScore", filters.minScore);
        if (filters.maxScore) params.set("maxScore", filters.maxScore);

        const response = await fetch(
          `${API_BASE}/news?${params.toString()}`,
          { method: "GET", headers: { Accept: "application/json" } }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = (await response.json()) as NewsResponse;
        if (isMounted) {
          setNews(Array.isArray(data.articles) ? data.articles : []);
          setTotal(data.total ?? 0);
          setNextCursor(data.nextCursor ?? null);
        }
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : t("errors.failedLoadNews"));
          setNews([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadNews();
    return () => { isMounted = false; };
  }, [cursor, filters, t]);

  function resetPaging() {
    setCursor("");
    setCursorStack([]);
  }

  // Toggle a coin in/out of the multi-select (OR filter).
  function toggleAsset(asset: string) {
    setFilters((prev) => ({
      ...prev,
      assets: prev.assets.includes(asset)
        ? prev.assets.filter((a) => a !== asset)
        : [...prev.assets, asset],
    }));
    resetPaging();
  }

  // Rolling preset (All/Today) — clears any explicit range.
  function applyDaysPreset(days: string) {
    setFilters((prev) => ({ ...prev, days, from: "", to: "" }));
    resetPaging();
  }

  // Explicit calendar range — clears the rolling preset.
  function applyDateRange(from: string, to: string) {
    setFilters((prev) => ({ ...prev, from, to, days: "" }));
    resetPaging();
  }

  // Impact score bucket (All / Critical / Notable / Low).
  function applyScorePreset(minScore: string, maxScore: string) {
    setFilters((prev) => ({ ...prev, minScore, maxScore }));
    resetPaging();
  }

  function clearFilters() {
    setFilters({ assets: [], days: "", from: "", to: "", minScore: "", maxScore: "" });
    resetPaging();
  }

  const hasFilters = !!(filters.assets.length || filters.days || filters.from || filters.to || filters.minScore || filters.maxScore);

  const filtersPanelProps = {
    filters,
    toggleAsset,
    applyDateRange,
    applyDaysPreset,
    applyScorePreset,
    clearFilters,
    hasFilters,
    availableAssets,
  };

  return (
    <main className="text-black">
      <div className="flex gap-layout">

        {/* ── LEFT: sticky filter sidebar (desktop only) ── */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20 rounded-lg border border-black/10 bg-white">
            <FiltersPanel {...filtersPanelProps} />
          </div>
        </aside>

        {/* ── RIGHT: results column ── */}
        <div className="min-w-0 flex-1">

          {/* Top bar: mobile Filters button + article count */}
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded border border-black/15 px-3 text-xs font-medium text-black/70 hover:border-black/30 hover:text-black lg:hidden"
            >
              ☰ Filters
              {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-black" />}
            </button>
            {!isLoading && (
              <span className="text-md text-black/40">
                {total} {total === 1 ? "article" : "articles"}
              </span>
            )}
          </div>

          {/* Results */}
          <div>
          {isLoading ? (
            <div className="px-4 py-8 text-sm text-black/40">{t("common.loading")}</div>
          ) : error ? (
            <div className="px-4 py-8 text-sm text-red-500">{error}</div>
          ) : news.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-black/40">
              No articles found for the selected filters.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-layout">
                {news.map((item) => (
              <article key={item.id} className="relative overflow-hidden rounded-lg border border-black/10">
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  aria-label="Expand"
                  className="absolute right-3 top-4 z-10 flex h-7 w-7 items-center justify-center rounded border border-black/15 bg-white text-black/40 hover:border-black/30 hover:text-black"
                >
                  ⤢
                </button>
                <Link
                  href={`/news/${item.id}`}
                  className="flex gap-4 px-4 py-4 transition-colors hover:bg-black/5"
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={160}
                      height={100}
                      className="h-18 w-28 shrink-0 rounded object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="mb-1 text-base font-semibold leading-snug">
                      {item.title}
                    </h2>
                    {/* Tier 1 — the signal: assets, impact, sentiment arrow */}
                    {item.aiProcessed && (item.aiSentiment || typeof item.aiImpactScore === "number" || (item.aiAssets && item.aiAssets.length > 0)) && (
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {item.aiAssets && item.aiAssets.length > 0 && (
                          <span className="flex items-center gap-1">
                            {item.aiAssets.slice(0, 3).map((a) => (
                              <span key={a} className="rounded border border-black/15 px-1.5 py-0.5 text-[13px] font-medium text-black/70">{a}</span>
                            ))}
                          </span>
                        )}
                        {typeof item.aiImpactScore === "number" && (
                          <span className={`rounded px-2 py-0.5 text-[15px] font-semibold tabular-nums ${impactStyle(item.aiImpactScore)}`}>
                            Impact {item.aiImpactScore}
                          </span>
                        )}
                        {item.aiSentiment === "bullish" && (
                          <span className="text-[13px] font-bold leading-none text-green-600">▲</span>
                        )}
                        {item.aiSentiment === "bearish" && (
                          <span className="text-[13px] font-bold leading-none text-red-600">▼</span>
                        )}
                        {item.aiSentiment === "neutral" && (
                          <span className="text-[13px] font-bold leading-none text-black/30" title="Unclear direction">–</span>
                        )}
                      </div>
                    )}
                    {/* Tier 2 — metadata: source + time, muted and smaller */}
                    {(item.source || item.publishedAt) && (
                      <div className="mb-1.5 text-[13px] text-black/40">
                        {item.source}
                        {item.source && item.publishedAt ? " · " : ""}
                        {timeAgo(item.publishedAt)}
                      </div>
                    )}
                    <p className="text-[15px] leading-relaxed text-black/60 truncate">
                      {item.aiTakeaway || item.aiSummary || item.excerpt}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {(cursorStack.length > 0 || nextCursor) && (
            <div className="flex items-center justify-center gap-2 border-t border-black/10 px-4 py-4">
              <button
                onClick={() => {
                  const stack = [...cursorStack];
                  const prev = stack.pop() ?? "";
                  setCursorStack(stack);
                  setCursor(prev);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={cursorStack.length === 0}
                className="flex h-8 items-center gap-1 rounded border border-black/15 px-3 text-xs font-medium transition-colors hover:border-black/30 disabled:pointer-events-none disabled:opacity-30"
              >
                ← Prev
              </button>
              <button
                onClick={() => {
                  if (!nextCursor) return;
                  setCursorStack((s) => [...s, cursor]);
                  setCursor(nextCursor);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={!nextCursor}
                className="flex h-8 items-center gap-1 rounded border border-black/15 px-3 text-xs font-medium transition-colors hover:border-black/30 disabled:pointer-events-none disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
            </>
          )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer (below lg) ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <span className="text-base font-semibold">Filters</span>
              <div className="flex items-center gap-3">
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-black/40 hover:text-black"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded text-black/40 hover:bg-black/5 hover:text-black"
                >
                  ×
                </button>
              </div>
            </div>
            <FiltersPanel {...filtersPanelProps} showHeading={false} />
            <div className="px-4 py-4">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full rounded bg-black py-2 text-sm font-medium text-white"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}

      <NewsModal item={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
