/**
 * Thin adapter over config/coins.js so candle/indicator services share one pair source.
 * Prefer importing from ../config/coins directly for new code.
 */
const { ALL_PAIRS, INDICATOR_PAIRS } = require("../config/coins");

function getPricePairs() {
  return ALL_PAIRS.map((c) => c.pair);
}

function getIndicatorPairs() {
  return INDICATOR_PAIRS.map((c) => c.pair);
}

function getPairConfig(symbol) {
  const coin = ALL_PAIRS.find((c) => c.pair === symbol);
  if (!coin) return null;
  return {
    symbol: coin.pair,
    price: true,
    indicators: Boolean(coin.indicators),
  };
}

module.exports = {
  getPricePairs,
  getIndicatorPairs,
  getPairConfig,
};
