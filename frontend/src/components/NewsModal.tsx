"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { getImpactTier } from "@/src/utils/impactTier";

export type NewsModalItem = {
  id: string;
  title: string;
  source?: string;
  publishedAt?: string;
  aiProcessed?: boolean;
  aiSummary?: string | null;
  aiTakeaway?: string | null;
  aiSentiment?: "bullish" | "bearish" | "neutral" | null;
  aiImpactScore?: number | null;
  aiAssets?: string[];
};

// Tailwind classes per tier — kept in sync with the card via the shared
// getImpactTier() classification, only the presentation differs here.
const IMPACT_CLASSES: Record<ReturnType<typeof getImpactTier>["key"], string> = {
  critical: "bg-red-600 text-white",
  high: "bg-amber-500 text-white",
  low: "bg-black/5 text-black/50",
  none: "bg-black/5 text-black/50",
};

function impactStyle(score: number): string {
  return IMPACT_CLASSES[getImpactTier(score).key];
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type Props = {
  item: NewsModalItem | null;
  onClose: () => void;
};

/**
 * Shared expand modal for news cards on the home and /news pages.
 * Opens with a NewsItem; closes on X, backdrop click, or Escape.
 */
export default function NewsModal({ item, onClose }: Props) {
  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [item, onClose]);

  if (!item) return null;
  if (typeof document === "undefined") return null;

  const hasSignal =
    item.aiProcessed &&
    (item.aiSentiment ||
      typeof item.aiImpactScore === "number" ||
      (item.aiAssets && item.aiAssets.length > 0));

  return createPortal(
    // Backdrop — clicking it (outside the panel) closes the modal.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded text-black/40 hover:bg-black/5 hover:text-black"
        >
          ×
        </button>

        {/* 1 + 2 — asset tags, impact chip, sentiment triangle */}
        {hasSignal && (
          <div className="mb-3 flex flex-wrap items-center gap-2 pr-8">
            {item.aiAssets && item.aiAssets.length > 0 && (
              <span className="flex items-center gap-1">
                {item.aiAssets.slice(0, 3).map((a) => (
                  <span
                    key={a}
                    className="rounded border border-black/15 px-1.5 py-0.5 text-[13px] font-medium text-black/70"
                  >
                    {a}
                  </span>
                ))}
              </span>
            )}
            {typeof item.aiImpactScore === "number" && (
              <span
                className={`rounded px-2 py-0.5 text-[15px] font-semibold tabular-nums ${impactStyle(
                  item.aiImpactScore
                )}`}
              >
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
              <span
                className="text-[13px] font-bold leading-none text-black/30"
                title="Unclear direction"
              >
                –
              </span>
            )}
          </div>
        )}

        {/* 3 — full headline */}
        <h2 className="mb-3 pr-8 text-xl font-semibold leading-snug">{item.title}</h2>

        {/* 4 — takeaway as a bold one-liner */}
        {item.aiTakeaway && (
          <p className="mb-3 text-[15px] font-semibold leading-snug text-black">
            {item.aiTakeaway}
          </p>
        )}

        {/* 5 — summary as body text, with a graceful fallback */}
        {item.aiSummary ? (
          <p className="mb-4 text-[15px] leading-relaxed text-black/70">{item.aiSummary}</p>
        ) : (
          <p className="mb-4 text-[15px] italic leading-relaxed text-black/40">
            Full AI analysis isn’t available for this article yet.
          </p>
        )}

        {/* 6 — source + timestamp */}
        {(item.source || item.publishedAt) && (
          <div className="mb-4 text-[13px] text-black/40">
            {item.source}
            {item.source && item.publishedAt ? " · " : ""}
            {timeAgo(item.publishedAt)}
          </div>
        )}

        {/* 7 — navigate to the full analysis page */}
        <Link
          href={`/news/${item.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-black hover:underline"
        >
          Read full analysis →
        </Link>
      </div>
    </div>,
    document.body
  );
}
