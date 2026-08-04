const WebSocket = require("ws");
const { ema, rsi, macd, bollingerBands } = require("../utils/indicators");
const { getIndicatorPairs } = require("../data/tradingPairs");
const {
  KLINE_INTERVAL,
  MIN_CLOSES,
  getClosingPrices,
  upsertCandle,
  backfillIndicatorCandles,
} = require("./candleService");

/**
 * Indicator Service (DB-backed)
 *
 * - Candles live in Postgres (candleService). Normal restart = zero Binance REST.
 * - Only pairs with indicators: true (~25) get kline WS + TA.
 * - Recalc only on confirmed candle close.
 * - In-memory cache served by GET /api/indicators.
 */

const LOOKBACK = MIN_CLOSES;

const klineData = new Map(); // symbol -> number[] closes
const indicators = new Map(); // symbol -> computed object

let ws = null;
let reconnectTimeout = null;
let initialized = false;
let stale = false;
let lastUpdated = null;

function getPairs() {
  return getIndicatorPairs();
}

/**
 * Compute all indicators for a symbol from closing prices.
 */
function computeIndicators(symbol, closes) {
  if (!closes || closes.length < 26) return null;

  const currentPrice = closes[closes.length - 1];

  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const rsiValue = rsi(closes, 14);
  const macdResult = macd(closes);
  const bbResult = bollingerBands(closes, 20, 2);

  return {
    symbol,
    price: currentPrice,
    stale: false,
    ema: {
      ema20: ema20
        ? { value: ema20, trend: currentPrice > ema20 ? "bullish" : "bearish" }
        : null,
      ema50: ema50
        ? { value: ema50, trend: currentPrice > ema50 ? "bullish" : "bearish" }
        : null,
      ema200: ema200
        ? {
            value: ema200,
            trend: currentPrice > ema200 ? "bullish" : "bearish",
          }
        : null,
    },
    rsi:
      rsiValue !== null
        ? {
            value: rsiValue,
            condition:
              rsiValue > 70
                ? "overbought"
                : rsiValue < 30
                  ? "oversold"
                  : "neutral",
          }
        : null,
    macd: macdResult
      ? {
          macd: macdResult.macd,
          signal: macdResult.signal,
          histogram: macdResult.histogram,
          momentum:
            macdResult.macd > macdResult.signal ? "bullish" : "bearish",
        }
      : null,
    bollingerBands: bbResult
      ? {
          upper: bbResult.upper,
          middle: bbResult.middle,
          lower: bbResult.lower,
          status:
            currentPrice >= bbResult.upper
              ? "overextended"
              : currentPrice <= bbResult.lower
                ? "rebound_zone"
                : "within_bands",
        }
      : null,
    updatedAt: Date.now(),
  };
}

/**
 * Load closes from DB into memory and compute indicators.
 * Assumes backfill already ran when needed.
 */
async function loadFromDb() {
  const pairs = getPairs();
  let succeeded = 0;

  for (const symbol of pairs) {
    try {
      const closes = await getClosingPrices(symbol, LOOKBACK);
      if (closes.length < 26) {
        console.warn(
          `[Indicators] ${symbol}: only ${closes.length} closes in DB — skipping`
        );
        continue;
      }
      klineData.set(symbol, closes);
      const result = computeIndicators(symbol, closes);
      if (result) {
        indicators.set(symbol, result);
        succeeded++;
      }
    } catch (err) {
      console.warn(`[Indicators] DB load failed for ${symbol}:`, err.message);
    }
  }

  lastUpdated = Date.now();
  console.log(
    `[Indicators] Loaded from DB: ${succeeded}/${pairs.length} symbols`
  );
  return succeeded;
}

/**
 * Subscribe to live 1h spot kline stream for indicator pairs only.
 */
function connectKlineStream() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  const pairs = getPairs();
  if (pairs.length === 0) return;

  const streams = pairs.map((s) => `${s}@kline_${KLINE_INTERVAL}`).join("/");
  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

  console.log(
    `[Indicators] Connecting kline stream (${pairs.length} pairs)...`
  );
  ws = new WebSocket(url);

  ws.on("open", () => {
    console.log("[Indicators] Kline stream connected");
  });

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (!msg.data?.k) return;

      const k = msg.data.k;
      const symbol = k.s?.toLowerCase();
      if (!symbol || !pairs.includes(symbol)) return;
      if (!k.x) return; // confirmed close only

      const closePrice = parseFloat(k.c);
      const open = parseFloat(k.o);
      const high = parseFloat(k.h);
      const low = parseFloat(k.l);
      const volume = parseFloat(k.v);
      const openTime = new Date(k.t);

      // Persist then update memory (fire-and-forget persist errors)
      upsertCandle({
        symbol,
        interval: KLINE_INTERVAL,
        openTime,
        open,
        high,
        low,
        close: closePrice,
        volume,
      }).catch((err) =>
        console.error(`[Indicators] Candle upsert failed (${symbol}):`, err.message)
      );

      const closes = klineData.get(symbol);
      if (!closes) return;

      closes.push(closePrice);
      if (closes.length > LOOKBACK) closes.shift();

      const result = computeIndicators(symbol, closes);
      if (result) {
        indicators.set(symbol, result);
        lastUpdated = Date.now();
        stale = false;
      }
    } catch (err) {
      console.error("[Indicators] Kline message error:", err.message);
    }
  });

  ws.on("error", (err) => {
    console.error("[Indicators] Kline stream error:", err.message);
  });

  ws.on("close", () => {
    console.log("[Indicators] Kline stream closed, reconnecting in 5s...");
    ws = null;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(connectKlineStream, 5000);
  });
}

/**
 * Initialize: backfill gaps → load DB → kline WS.
 */
async function initIndicators() {
  if (initialized) return;
  initialized = true;

  try {
    const result = await backfillIndicatorCandles();
    if (result.failed.length > 0 && result.backfilled === 0 && result.skipped === 0) {
      stale = true;
      console.warn(
        "[Indicators] Backfill failed for all queued symbols — serving whatever is in DB"
      );
    }
  } catch (err) {
    stale = true;
    console.warn(
      "[Indicators] Backfill error (will try DB anyway):",
      err.message
    );
  }

  const loaded = await loadFromDb();
  if (loaded === 0) {
    stale = true;
  }

  connectKlineStream();
}

/**
 * @param {{ symbol?: string }} [opts]
 * @returns {{ data: object[], meta: object }}
 */
function getIndicators(opts = {}) {
  let data = Array.from(indicators.values());

  if (opts.symbol) {
    const s = opts.symbol.toLowerCase();
    data = data.filter((row) => row.symbol === s);
  }

  if (stale) {
    data = data.map((row) => ({ ...row, stale: true }));
  }

  return {
    data,
    meta: {
      indicatorsEnabledCount: getPairs().length,
      count: data.length,
      lastUpdated,
      stale,
      interval: KLINE_INTERVAL,
      tab: opts.tab || "technical",
    },
  };
}

module.exports = { initIndicators, getIndicators };
