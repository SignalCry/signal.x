"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/src/constants/app";

export type CoinConfig = {
  pair: string;
  symbol: string;
  name: string;
  slug: string;
  aliases: string[];
  rank: number;
  indicators: boolean;
};

/** Fetches the coin config once and exposes a pair-keyed lookup for drop-in COIN_METADATA replacement. */
export function useCoins() {
  const [coins, setCoins] = useState<CoinConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCoins() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/coins`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to load coins (HTTP ${response.status})`);
        }

        const data = (await response.json()) as CoinConfig[];
        if (isMounted) setCoins(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : "Failed to load coins");
          setCoins([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadCoins();

    return () => {
      isMounted = false;
    };
  }, []);

  const coinsByPair = useMemo(() => {
    const map: Record<string, { id: string; name: string; symbol: string }> = {};
    for (const coin of coins) {
      map[coin.pair] = { id: coin.slug, name: coin.name, symbol: coin.symbol };
    }
    return map;
  }, [coins]);

  return { coins, coinsByPair, loading, error };
}
