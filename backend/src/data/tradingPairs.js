/**
 * Single source of truth for trading pairs.
 *
 * - price: true  → Binance @ticker WebSocket (cheap; scale to 100+)
 * - indicators: true → DB-backed candles + kline WS + TA (keep ~25)
 *
 * Nadjib: add more { symbol, price: true, indicators: false } as you scale
 * signal-card prices to ~100. Do NOT flip indicators:true without capacity review.
 */

const TRADING_PAIRS = [
  // Core — always indicators
  { symbol: "btcusdt", price: true, indicators: true },
  { symbol: "ethusdt", price: true, indicators: true },
  { symbol: "bnbusdt", price: true, indicators: true },
  { symbol: "solusdt", price: true, indicators: true },
  { symbol: "xrpusdt", price: true, indicators: true },
  { symbol: "adausdt", price: true, indicators: true },
  { symbol: "dogeusdt", price: true, indicators: true },

  // Large cap / active trading
  { symbol: "trxusdt", price: true, indicators: true },
  { symbol: "polusdt", price: true, indicators: true }, // was maticusdt
  { symbol: "linkusdt", price: true, indicators: true },
  { symbol: "ltcusdt", price: true, indicators: true },
  { symbol: "avaxusdt", price: true, indicators: true },
  { symbol: "dotusdt", price: true, indicators: true },
  { symbol: "atomusdt", price: true, indicators: true },
  { symbol: "nearusdt", price: true, indicators: true },
  { symbol: "uniusdt", price: true, indicators: true },
  { symbol: "aptusdt", price: true, indicators: true },
  { symbol: "arbusdt", price: true, indicators: true },

  // Momentum / retail interest
  { symbol: "suiusdt", price: true, indicators: true },
  { symbol: "tonusdt", price: true, indicators: true },
  { symbol: "hbarusdt", price: true, indicators: true },
  { symbol: "shibusdt", price: true, indicators: true },
  { symbol: "xlmusdt", price: true, indicators: true },

  // Price only (stable / lower TA demand)
  { symbol: "usdcusdt", price: true, indicators: false },
];

function getPricePairs() {
  return TRADING_PAIRS.filter((p) => p.price).map((p) => p.symbol);
}

function getIndicatorPairs() {
  return TRADING_PAIRS.filter((p) => p.indicators).map((p) => p.symbol);
}

function getPairConfig(symbol) {
  return TRADING_PAIRS.find((p) => p.symbol === symbol) ?? null;
}

module.exports = {
  TRADING_PAIRS,
  getPricePairs,
  getIndicatorPairs,
  getPairConfig,
};
