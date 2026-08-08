const { prisma } = require("../lib/prisma");
const { fetchSpotKlines } = require("./binanceKlinesService");
const { getIndicatorPairs } = require("../data/tradingPairs");

/**
 * Candle Service — Postgres-backed OHLCV for indicator pairs.
 *
 * - Backfills from Binance REST only when DB is empty or stale
 * - Batches of 5 with 1s pause to avoid 418 bans
 * - Live candle closes upserted by indicatorService WS handler
 */

const KLINE_INTERVAL = "1h";
const BACKFILL_LIMIT = 500;
const MIN_CLOSES = 201;
const BATCH_SIZE = 5;
const BATCH_PAUSE_MS = 1000;
const STALE_MS = 2 * 60 * 60 * 1000; // 2h
const RETENTION_DAYS = 90;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} symbol
 * @param {string} [interval=KLINE_INTERVAL]
 * @returns {Promise<number>}
 */
async function countCandles(symbol, interval = KLINE_INTERVAL) {
  return prisma.candle.count({
    where: { symbol, interval },
  });
}

/**
 * Latest candle openTime for a symbol, or null.
 */
async function getLatestOpenTime(symbol, interval = KLINE_INTERVAL) {
  const row = await prisma.candle.findFirst({
    where: { symbol, interval },
    orderBy: { openTime: "desc" },
    select: { openTime: true },
  });
  return row?.openTime ?? null;
}

/**
 * Last N closing prices ascending (oldest → newest).
 * @returns {Promise<number[]>}
 */
async function getClosingPrices(symbol, limit = MIN_CLOSES, interval = KLINE_INTERVAL) {
  const rows = await prisma.candle.findMany({
    where: { symbol, interval },
    orderBy: { openTime: "desc" },
    take: limit,
    select: { close: true },
  });
  return rows.reverse().map((r) => r.close);
}

/**
 * Upsert a single candle from Binance kline payload or REST parse.
 */
async function upsertCandle({
  symbol,
  interval = KLINE_INTERVAL,
  openTime,
  open,
  high,
  low,
  close,
  volume,
}) {
  const openTimeDate =
    openTime instanceof Date ? openTime : new Date(openTime);

  return prisma.candle.upsert({
    where: {
      symbol_interval_openTime: {
        symbol,
        interval,
        openTime: openTimeDate,
      },
    },
    create: {
      symbol,
      interval,
      openTime: openTimeDate,
      open,
      high,
      low,
      close,
      volume,
    },
    update: {
      open,
      high,
      low,
      close,
      volume,
    },
  });
}

/**
 * Bulk insert from fetchSpotKlines rows ({ time: unix sec, open, high, low, close, volume }).
 * Closed candles are immutable — skipDuplicates is enough for gap fills.
 */
async function upsertCandlesFromKlines(symbol, klines, interval = KLINE_INTERVAL) {
  if (!klines.length) return;

  const data = klines.map((k) => ({
    symbol,
    interval,
    openTime: new Date(k.time * 1000),
    open: k.open,
    high: k.high,
    low: k.low,
    close: k.close,
    volume: k.volume,
  }));

  await prisma.candle.createMany({
    data,
    skipDuplicates: true,
  });
}

/**
 * True if we need a Binance REST backfill for this symbol.
 */
async function needsBackfill(symbol, interval = KLINE_INTERVAL) {
  const count = await countCandles(symbol, interval);
  if (count < MIN_CLOSES) return true;

  const latest = await getLatestOpenTime(symbol, interval);
  if (!latest) return true;
  if (Date.now() - latest.getTime() > STALE_MS) return true;

  return false;
}

/**
 * Fetch from Binance and upsert for one symbol.
 */
async function backfillSymbol(symbol, interval = KLINE_INTERVAL) {
  const klines = await fetchSpotKlines(symbol, interval, BACKFILL_LIMIT);
  await upsertCandlesFromKlines(symbol, klines, interval);
  return klines.length;
}

/**
 * Backfill all indicator pairs that need it, in batches of 5.
 * @returns {{ backfilled: number, skipped: number, failed: string[] }}
 */
async function backfillIndicatorCandles() {
  const pairs = getIndicatorPairs();
  let backfilled = 0;
  let skipped = 0;
  const failed = [];

  const toFetch = [];
  for (const symbol of pairs) {
    try {
      if (await needsBackfill(symbol)) {
        toFetch.push(symbol);
      } else {
        skipped++;
      }
    } catch (err) {
      console.warn(`[Candles] needsBackfill check failed for ${symbol}:`, err.message);
      toFetch.push(symbol);
    }
  }

  console.log(
    `[Candles] Backfill plan: ${toFetch.length} fetch, ${skipped} skip (already fresh)`
  );

  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (symbol) => {
        try {
          const n = await backfillSymbol(symbol);
          console.log(`[Candles] Backfilled ${symbol}: ${n} candles`);
          backfilled++;
        } catch (err) {
          failed.push(symbol);
          console.warn(`[Candles] Backfill failed for ${symbol}:`, err.message);
        }
      })
    );

    if (i + BATCH_SIZE < toFetch.length) {
      await sleep(BATCH_PAUSE_MS);
    }
  }

  return { backfilled, skipped, failed };
}

/**
 * Delete candles older than RETENTION_DAYS.
 */
async function cleanupOldCandles() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const { count } = await prisma.candle.deleteMany({
    where: { openTime: { lt: cutoff } },
  });

  if (count > 0) {
    console.log(`[Candles] Cleaned up ${count} candles older than ${RETENTION_DAYS} days`);
  }
  return count;
}

module.exports = {
  KLINE_INTERVAL,
  MIN_CLOSES,
  BACKFILL_LIMIT,
  countCandles,
  getLatestOpenTime,
  getClosingPrices,
  upsertCandle,
  upsertCandlesFromKlines,
  needsBackfill,
  backfillSymbol,
  backfillIndicatorCandles,
  cleanupOldCandles,
};
