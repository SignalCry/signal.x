"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/src/i18n";
import { API_BASE } from "@/src/constants/app";
import NewsModal from "@/src/components/NewsModal";
import NewsCard from "@/src/components/NewsCard";

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
type Filters = { assets: string[]; days: string; from: string; to: string };

// Quick presets for the common cases; the calendar covers exact day / range.
const DATE_PRESETS: { label: string; days: string }[] = [
  { label: "All", days: "" },
  { label: "Today", days: "1" },
];

// How the feed is ordered. Applied client-side over the whole fetched set.
type SortKey = "newest" | "oldest" | "impact_high" | "impact_low";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "impact_high", label: "Impact: high to low" },
  { key: "impact_low", label: "Impact: low to high" },
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

// ─── Constants ────────────────────────────────────────────────────────────────

// Fetch the whole ~7-day window at once (server caps at 500); we page/sort locally.
const FETCH_LIMIT = 500;

// Client-side pagination, applied after filtering/sorting.
const PAGE_SIZE = 15;

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
  clearFilters,
  hasFilters,
  availableAssets,
  showHeading = true,
}: {
  filters: Filters;
  toggleAsset: (asset: string) => void;
  applyDateRange: (from: string, to: string) => void;
  applyDaysPreset: (days: string) => void;
  clearFilters: () => void;
  hasFilters: boolean;
  availableAssets: string[];
  showHeading?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  // Which collapsible sections are open (all start open).
  const [openSections, setOpenSections] = useState({ coin: true, date: true });
  const boxRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLDivElement>(null);

  function toggleSection(key: "coin" | "date") {
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
          <h2 className="text-md font-bold text-[#333]">Filters</h2>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-md text-black/40 hover:text-black"
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
          className="mb-2 flex w-full items-center justify-between text-md font-semibold tracking-wide text-[#333]"
        >
          Coin
          <i className={`bi ${openSections.coin ? "bi-caret-down-fill" : "bi-caret-right-fill"} flex h-4 w-4 items-center justify-center text-md leading-none`} />
        </button>

        {openSections.coin && (
        <>
        {/* Selected coin chips */}
        {filters.assets.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {filters.assets.map((a) => (
              <span
                key={a}
                className="flex items-center gap-1 rounded border border-black bg-black px-2 py-0.5 text-md font-medium text-white"
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
            className="w-full rounded border border-black/15 px-3 py-1.5 text-md outline-none focus:border-black/40"
          />
          {open && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded border border-black/10 bg-white shadow-lg">
              {matches.length === 0 ? (
                <div className="px-3 py-2 text-md text-black/40">No coins found</div>
              ) : (
                matches.map((a) => {
                  const checked = filters.assets.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAsset(a)}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-md hover:bg-black/5 ${
                        checked ? "font-semibold" : "text-black/70"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-md ${
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

      {/* Date presets + calendar */}
      <div className="border-t border-black/10 px-4 py-3">
        <button
          type="button"
          onClick={() => toggleSection("date")}
          className="mb-2 flex w-full items-center justify-between text-md font-semibold tracking-wide text-[#333]"
        >
          Date
          <i className={`bi ${openSections.date ? "bi-caret-down-fill" : "bi-caret-right-fill"} flex h-4 w-4 items-center justify-center text-md leading-none`} />
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
                className={`rounded border px-3 py-1 text-md transition-colors ${
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
              className={`flex h-8 items-center justify-center rounded border px-2.5 text-md transition-colors ${
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
            <span className="flex items-center gap-1 rounded border border-black bg-black px-2 py-0.5 text-md font-medium text-white">
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

  // The whole ~7-day window is fetched once; filtering and sorting happen
  // client-side over this full set (see `visibleNews` below).
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ assets: [], days: "", from: "", to: "" });
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
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

  // Fetch the whole window once. Filtering/sorting is all client-side.
  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE}/news?limit=${FETCH_LIMIT}`,
          { method: "GET", headers: { Accept: "application/json" } }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = (await response.json()) as NewsResponse;
        if (isMounted) setAllNews(Array.isArray(data.articles) ? data.articles : []);
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : t("errors.failedLoadNews"));
          setAllNews([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadNews();
    return () => { isMounted = false; };
  }, [t]);

  // Apply coin + date filters, then sort — all over the full fetched set.
  const visibleNews = useMemo(() => {
    const cutoff = filters.from
      ? new Date(`${filters.from}T00:00:00`).getTime()
      : filters.days
        ? Date.now() - parseInt(filters.days, 10) * 86400000
        : null;
    // For an explicit range the "to" day is inclusive of the whole day.
    const until = filters.to ? new Date(`${filters.to}T00:00:00`).getTime() + 86400000 : null;

    const filtered = allNews.filter((n) => {
      if (filters.assets.length) {
        const assets = n.aiAssets ?? [];
        if (!filters.assets.some((a) => assets.includes(a))) return false;
      }
      if (cutoff != null || until != null) {
        const ts = n.publishedAt ? new Date(n.publishedAt).getTime() : 0;
        if (cutoff != null && ts < cutoff) return false;
        if (until != null && ts >= until) return false;
      }
      return true;
    });

    const ts = (n: NewsItem) => (n.publishedAt ? new Date(n.publishedAt).getTime() : 0);
    const score = (n: NewsItem) => (typeof n.aiImpactScore === "number" ? n.aiImpactScore : -1);
    const sorted = [...filtered];
    switch (sort) {
      case "oldest":      sorted.sort((a, b) => ts(a) - ts(b)); break;
      case "impact_high": sorted.sort((a, b) => score(b) - score(a)); break;
      case "impact_low":  sorted.sort((a, b) => score(a) - score(b)); break;
      default:            sorted.sort((a, b) => ts(b) - ts(a)); break; // newest
    }
    return sorted;
  }, [allNews, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(visibleNews.length / PAGE_SIZE));
  // Clamp so a filter/sort change that shrinks the result set can't strand the
  // page past the end.
  const currentPage = Math.min(page, pageCount);
  const pagedNews = useMemo(
    () => visibleNews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [visibleNews, currentPage]
  );

  // Toggle a coin in/out of the multi-select (OR filter).
  function toggleAsset(asset: string) {
    setFilters((prev) => ({
      ...prev,
      assets: prev.assets.includes(asset)
        ? prev.assets.filter((a) => a !== asset)
        : [...prev.assets, asset],
    }));
    setPage(1);
  }

  // Rolling preset (All/Today) — clears any explicit range.
  function applyDaysPreset(days: string) {
    setFilters((prev) => ({ ...prev, days, from: "", to: "" }));
    setPage(1);
  }

  // Explicit calendar range — clears the rolling preset.
  function applyDateRange(from: string, to: string) {
    setFilters((prev) => ({ ...prev, from, to, days: "" }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({ assets: [], days: "", from: "", to: "" });
    setPage(1);
  }

  const hasFilters = !!(filters.assets.length || filters.days || filters.from || filters.to);

  const filtersPanelProps = {
    filters,
    toggleAsset,
    applyDateRange,
    applyDaysPreset,
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

          {/* Top bar: mobile Filters button + article count (left) + sort (right) */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex h-8 items-center gap-1.5 rounded border border-black/15 px-3 text-xs font-medium text-black/70 hover:border-black/30 hover:text-black lg:hidden"
              >
                ☰ Filters
                {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-black" />}
              </button>
              {!isLoading && (
                <span className="text-md text-[#333]">
                  {visibleNews.length} {visibleNews.length === 1 ? "article" : "articles"}
                </span>
              )}
            </div>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
                aria-label="Sort articles"
                className="h-8 appearance-none rounded border border-black/15 bg-white py-0 pl-2 pr-7 text-md text-[#333] outline-none hover:border-black/30 focus:border-black/40"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              <i className="bi bi-caret-down-fill pointer-events-none absolute right-2 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-md leading-none text-[#333]" />
            </div>
          </div>

          {/* Results */}
          <div>
          {isLoading ? (
            <div className="px-4 py-8 text-sm text-black/40">{t("common.loading")}</div>
          ) : error ? (
            <div className="px-4 py-8 text-sm text-red-500">{error}</div>
          ) : visibleNews.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-black/40">
              No articles found for the selected filters.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3.5">
                {pagedNews.map((item) => (
                  <NewsCard key={item.id} item={item} onExpand={setSelected} />
                ))}
              </div>

              {pageCount > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2 border-t border-black/10 pt-4">
                  <button
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    className="flex h-8 items-center gap-1 rounded border border-black/15 px-3 text-xs font-medium transition-colors hover:border-black/30 disabled:pointer-events-none disabled:opacity-30"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-black/40">
                    Page {currentPage} of {pageCount}
                  </span>
                  <button
                    onClick={() => {
                      setPage((p) => Math.min(pageCount, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === pageCount}
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
