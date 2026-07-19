"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useBinanceWebSocket } from "@/src/hooks/useBinanceWebSocket";
import { COIN_METADATA } from "@/src/constants/coinMetadata";
import { API_BASE, WS_BASE } from "@/src/constants/app";
import MarketMovers from "@/app/components/MarketMovers";
import MarketTable from "@/app/components/MarketTable";
import NewsModal from "@/src/components/NewsModal";
import NewsCard from "@/src/components/NewsCard";
import { useTranslation } from "@/src/i18n";

type MarketRow = {
  key: string;
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  quoteVolume: number;
};

type NewsItem = {
  id: string;
  title: string;
  image: string | null;
  excerpt: string;
  content: string;
  source?: string;
  publishedAt?: string;
  url?: string;
  aiProcessed?: boolean;
  aiSummary?: string | null;
  aiTakeaway?: string | null;
  aiSentiment?: "bullish" | "bearish" | "neutral" | null;
  aiImpactScore?: number | null;
  aiAssets?: string[];
};

export default function HomePage() {
  const { t } = useTranslation();

  const marketWsUrl = `${WS_BASE.replace(/\/$/, "")}/ws/market`;
  const { marketData, status } = useBinanceWebSocket(marketWsUrl);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      try {
        setNewsLoading(true);
        setNewsError(null);

        const response = await fetch(`${API_BASE}/news`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to load news (HTTP ${response.status})`);
        }

        const data = (await response.json()) as { articles: NewsItem[] };
        if (isMounted) setNews(Array.isArray(data.articles) ? data.articles : []);
      } catch (e) {
        if (isMounted) {
          setNewsError(e instanceof Error ? e.message : t("errors.failedLoadNews"));
          setNews([]);
        }
      } finally {
        if (isMounted) setNewsLoading(false);
      }
    }

    void loadNews();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const marketRows = useMemo(() => {
    const rows: MarketRow[] = [];

    marketData.forEach((priceData, key) => {
      const metadata = COIN_METADATA[key];
      if (!metadata) return;

      rows.push({
        key,
        id: metadata.id,
        name: metadata.name,
        symbol: metadata.symbol,
        price: priceData.price,
        priceChange: Number.isFinite(priceData.priceChange) ? priceData.priceChange : 0,
        priceChangePercent: Number.isFinite(priceData.priceChangePercent)
          ? priceData.priceChangePercent
          : 0,
        quoteVolume: Number.isFinite(priceData.quoteVolume) ? priceData.quoteVolume : 0,
      });
    });

    return rows;
  }, [marketData]);

  const marketRowByKey = useMemo(() => {
    return new Map<string, MarketRow>(marketRows.map((row) => [row.key, row]));
  }, [marketRows]);

  const visibleCoins = useMemo(() => {
    const majorKeys = ["btcusdt", "ethusdt", "bnbusdt", "solusdt", "xrpusdt", "adausdt", "dogeusdt", "dotusdt", "avaxusdt", "linkusdt"];
    const picked: MarketRow[] = [];
    for (const key of majorKeys) {
      const row = marketRowByKey.get(key);
      if (row) picked.push(row);
    }
    if (picked.length < 10) {
      const byVolume = [...marketRows].sort((a, b) => b.quoteVolume - a.quoteVolume);
      for (const row of byVolume) {
        if (picked.length >= 10) break;
        if (picked.some((p) => p.key === row.key)) continue;
        picked.push(row);
      }
    }
    return picked.slice(0, 10);
  }, [marketRowByKey, marketRows]);

  const isLoading = status === "connecting";
  const error = status === "error" ? t("errors.websocketConnection") : null;

  return (
    <main className="text-black">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="space-y-6 py-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Never miss market-moving crypto posts again
            </h1>
            <p className="mt-2 text-base text-black/70 sm:text-lg">
              Real-time alerts for market-moving X posts, price swings, and breaking news — before the crowd reacts.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Get Alerts
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row">
            {/* News — same as dashboard */}
            <section className="w-full lg:w-3/5">
              <div className="text-black">
                <div className="flex items-center justify-between py-2">
                  <span className="text-lg font-semibold">{t("home.latestNews")}</span>
                  <Link
                    href="/news"
                    className="flex items-center gap-1 text-base font-medium text-gray-500 no-underline hover:underline hover:underline-offset-2 hover:text-black focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    {t("common.viewAll")} <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
                {newsLoading ? (
                  <div className="px-3 pb-2 text-base">{t("common.loading")}</div>
                ) : newsError ? (
                  <div className="px-3 pb-2 text-base">{newsError}</div>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {news.slice(0, 5).map((item) => (
                      <NewsCard key={item.id} item={item} onExpand={setSelectedNews} />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Market — same as dashboard */}
            <section className="w-full lg:w-2/5">
              <div className="text-black">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-lg font-semibold">{t("home.cryptoMarket")}</span>
                  <Link
                    href="/market"
                    className="flex items-center gap-1 text-base font-medium text-gray-500 no-underline hover:underline hover:underline-offset-2 hover:text-black focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    {t("common.viewAll")} <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>

                {isLoading ? (
                  <div className="px-3 pb-1 text-base">{t("common.loading")}</div>
                ) : error ? (
                  <div className="px-3 pb-3 text-base">{error}</div>
                ) : (
                  <MarketTable rows={visibleCoins} />
                )}
              </div>

              <div className="mt-4">
                <MarketMovers marketRows={marketRows} />
              </div>
            </section>
          </div>
        </section>

        

        </div>

      <NewsModal item={selectedNews} onClose={() => setSelectedNews(null)} />
    </main>
  );
}
