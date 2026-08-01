/**
 * Single source of truth for supported Binance USDT pairs (top 100 by quote volume).
 * Verified against Binance exchangeInfo + 24h ticker (TRADING status, USDT quote).
 */
const ALL_PAIRS = [
  { pair: "usdcusdt", symbol: "USDC", name: "USDC", slug: "usdc", aliases: ["USDC"], rank: 1, indicators: true },
  { pair: "btcusdt", symbol: "BTC", name: "BTC", slug: "btc", aliases: ["BTC"], rank: 2, indicators: true },
  { pair: "ethusdt", symbol: "ETH", name: "ETH", slug: "eth", aliases: ["ETH"], rank: 3, indicators: true },
  { pair: "mirausdt", symbol: "MIRA", name: "MIRA", slug: "mira", aliases: ["MIRA"], rank: 4, indicators: true },
  { pair: "solusdt", symbol: "SOL", name: "SOL", slug: "sol", aliases: ["SOL"], rank: 5, indicators: true },
  { pair: "giggleusdt", symbol: "GIGGLE", name: "GIGGLE", slug: "giggle", aliases: ["GIGGLE"], rank: 6, indicators: true },
  { pair: "bnbusdt", symbol: "BNB", name: "BNB", slug: "bnb", aliases: ["BNB"], rank: 7, indicators: true },
  { pair: "xrpusdt", symbol: "XRP", name: "XRP", slug: "xrp", aliases: ["XRP"], rank: 8, indicators: true },
  { pair: "rlusdusdt", symbol: "RLUSD", name: "RLUSD", slug: "rlusd", aliases: ["RLUSD"], rank: 9, indicators: true },
  { pair: "uniusdt", symbol: "UNI", name: "UNI", slug: "uni", aliases: ["UNI"], rank: 10, indicators: true },
  { pair: "bankusdt", symbol: "BANK", name: "BANK", slug: "bank", aliases: ["BANK"], rank: 11, indicators: true },
  { pair: "aaveusdt", symbol: "AAVE", name: "AAVE", slug: "aave", aliases: ["AAVE"], rank: 12, indicators: true },
  { pair: "eulusdt", symbol: "EUL", name: "EUL", slug: "eul", aliases: ["EUL"], rank: 13, indicators: true },
  { pair: "zecusdt", symbol: "ZEC", name: "ZEC", slug: "zec", aliases: ["ZEC"], rank: 14, indicators: true },
  { pair: "trxusdt", symbol: "TRX", name: "TRX", slug: "trx", aliases: ["TRX"], rank: 15, indicators: true },
  { pair: "dexeusdt", symbol: "DEXE", name: "DEXE", slug: "dexe", aliases: ["DEXE"], rank: 16, indicators: true },
  { pair: "adausdt", symbol: "ADA", name: "ADA", slug: "ada", aliases: ["ADA"], rank: 17, indicators: true },
  { pair: "cotiusdt", symbol: "COTI", name: "COTI", slug: "coti", aliases: ["COTI"], rank: 18, indicators: true },
  { pair: "dogeusdt", symbol: "DOGE", name: "DOGE", slug: "doge", aliases: ["DOGE"], rank: 19, indicators: true },
  { pair: "mmtusdt", symbol: "MMT", name: "MMT", slug: "mmt", aliases: ["MMT"], rank: 20, indicators: true },
  { pair: "spcxbusdt", symbol: "SPCXB", name: "SPCXB", slug: "spcxb", aliases: ["SPCXB"], rank: 21, indicators: true },
  { pair: "nearusdt", symbol: "NEAR", name: "NEAR", slug: "near", aliases: ["NEAR"], rank: 22, indicators: true },
  { pair: "1000satsusdt", symbol: "1000SATS", name: "1000SATS", slug: "1000sats", aliases: ["1000SATS"], rank: 23, indicators: true },
  { pair: "ordiusdt", symbol: "ORDI", name: "ORDI", slug: "ordi", aliases: ["ORDI"], rank: 24, indicators: true },
  { pair: "pumpusdt", symbol: "PUMP", name: "PUMP", slug: "pump", aliases: ["PUMP"], rank: 25, indicators: false },
  { pair: "zamausdt", symbol: "ZAMA", name: "ZAMA", slug: "zama", aliases: ["ZAMA"], rank: 26, indicators: false },
  { pair: "shibusdt", symbol: "SHIB", name: "SHIB", slug: "shib", aliases: ["SHIB"], rank: 27, indicators: false },
  { pair: "erausdt", symbol: "ERA", name: "ERA", slug: "era", aliases: ["ERA"], rank: 28, indicators: false },
  { pair: "epicusdt", symbol: "EPIC", name: "EPIC", slug: "epic", aliases: ["EPIC"], rank: 29, indicators: false },
  { pair: "ondousdt", symbol: "ONDO", name: "ONDO", slug: "ondo", aliases: ["ONDO"], rank: 30, indicators: false },
  { pair: "pepeusdt", symbol: "PEPE", name: "PEPE", slug: "pepe", aliases: ["PEPE"], rank: 31, indicators: false },
  { pair: "tlmusdt", symbol: "TLM", name: "TLM", slug: "tlm", aliases: ["TLM"], rank: 32, indicators: false },
  { pair: "taousdt", symbol: "TAO", name: "TAO", slug: "tao", aliases: ["TAO"], rank: 33, indicators: false },
  { pair: "sndkbusdt", symbol: "SNDKB", name: "SNDKB", slug: "sndkb", aliases: ["SNDKB"], rank: 34, indicators: false },
  { pair: "ltcusdt", symbol: "LTC", name: "LTC", slug: "ltc", aliases: ["LTC"], rank: 35, indicators: false },
  { pair: "linkusdt", symbol: "LINK", name: "LINK", slug: "link", aliases: ["LINK"], rank: 36, indicators: false },
  { pair: "synusdt", symbol: "SYN", name: "SYN", slug: "syn", aliases: ["SYN"], rank: 37, indicators: false },
  { pair: "kaitousdt", symbol: "KAITO", name: "KAITO", slug: "kaito", aliases: ["KAITO"], rank: 38, indicators: false },
  { pair: "enausdt", symbol: "ENA", name: "ENA", slug: "ena", aliases: ["ENA"], rank: 39, indicators: false },
  { pair: "wldusdt", symbol: "WLD", name: "WLD", slug: "wld", aliases: ["WLD"], rank: 40, indicators: false },
  { pair: "suiusdt", symbol: "SUI", name: "SUI", slug: "sui", aliases: ["SUI"], rank: 41, indicators: false },
  { pair: "soxlbusdt", symbol: "SOXLB", name: "SOXLB", slug: "soxlb", aliases: ["SOXLB"], rank: 42, indicators: false },
  { pair: "filusdt", symbol: "FIL", name: "FIL", slug: "fil", aliases: ["FIL"], rank: 43, indicators: false },
  { pair: "mubusdt", symbol: "MUB", name: "MUB", slug: "mub", aliases: ["MUB"], rank: 44, indicators: false },
  { pair: "xplusdt", symbol: "XPL", name: "XPL", slug: "xpl", aliases: ["XPL"], rank: 45, indicators: false },
  { pair: "dashusdt", symbol: "DASH", name: "DASH", slug: "dash", aliases: ["DASH"], rank: 46, indicators: false },
  { pair: "homeusdt", symbol: "HOME", name: "HOME", slug: "home", aliases: ["HOME"], rank: 47, indicators: false },
  { pair: "xlmusdt", symbol: "XLM", name: "XLM", slug: "xlm", aliases: ["XLM"], rank: 48, indicators: false },
  { pair: "xautusdt", symbol: "XAUT", name: "XAUT", slug: "xaut", aliases: ["XAUT"], rank: 49, indicators: false },
  { pair: "paxgusdt", symbol: "PAXG", name: "PAXG", slug: "paxg", aliases: ["PAXG"], rank: 50, indicators: false },
  { pair: "crclbusdt", symbol: "CRCLB", name: "CRCLB", slug: "crclb", aliases: ["CRCLB"], rank: 51, indicators: false },
  { pair: "skhybusdt", symbol: "SKHYB", name: "SKHYB", slug: "skhyb", aliases: ["SKHYB"], rank: 52, indicators: false },
  { pair: "babyusdt", symbol: "BABY", name: "BABY", slug: "baby", aliases: ["BABY"], rank: 53, indicators: false },
  { pair: "penguusdt", symbol: "PENGU", name: "PENGU", slug: "pengu", aliases: ["PENGU"], rank: 54, indicators: false },
  { pair: "ensousdt", symbol: "ENSO", name: "ENSO", slug: "enso", aliases: ["ENSO"], rank: 55, indicators: false },
  { pair: "vanryusdt", symbol: "VANRY", name: "VANRY", slug: "vanry", aliases: ["VANRY"], rank: 56, indicators: false },
  { pair: "gramusdt", symbol: "GRAM", name: "GRAM", slug: "gram", aliases: ["GRAM"], rank: 57, indicators: false },
  { pair: "korubusdt", symbol: "KORUB", name: "KORUB", slug: "korub", aliases: ["KORUB"], rank: 58, indicators: false },
  { pair: "fetusdt", symbol: "FET", name: "FET", slug: "fet", aliases: ["FET"], rank: 59, indicators: false },
  { pair: "avaxusdt", symbol: "AVAX", name: "AVAX", slug: "avax", aliases: ["AVAX"], rank: 60, indicators: false },
  { pair: "broccoli714usdt", symbol: "BROCCOLI714", name: "BROCCOLI714", slug: "broccoli714", aliases: ["BROCCOLI714"], rank: 61, indicators: false },
  { pair: "trumpusdt", symbol: "TRUMP", name: "TRUMP", slug: "trump", aliases: ["TRUMP"], rank: 62, indicators: false },
  { pair: "injusdt", symbol: "INJ", name: "INJ", slug: "inj", aliases: ["INJ"], rank: 63, indicators: false },
  { pair: "aevousdt", symbol: "AEVO", name: "AEVO", slug: "aevo", aliases: ["AEVO"], rank: 64, indicators: false },
  { pair: "hbarusdt", symbol: "HBAR", name: "HBAR", slug: "hbar", aliases: ["HBAR"], rank: 65, indicators: false },
  { pair: "neirousdt", symbol: "NEIRO", name: "NEIRO", slug: "neiro", aliases: ["NEIRO"], rank: 66, indicators: false },
  { pair: "mubarakusdt", symbol: "MUBARAK", name: "MUBARAK", slug: "mubarak", aliases: ["MUBARAK"], rank: 67, indicators: false },
  { pair: "tutusdt", symbol: "TUT", name: "TUT", slug: "tut", aliases: ["TUT"], rank: 68, indicators: false },
  { pair: "snxxbusdt", symbol: "SNXXB", name: "SNXXB", slug: "snxxb", aliases: ["SNXXB"], rank: 69, indicators: false },
  { pair: "bchusdt", symbol: "BCH", name: "BCH", slug: "bch", aliases: ["BCH"], rank: 70, indicators: false },
  { pair: "dotusdt", symbol: "DOT", name: "DOT", slug: "dot", aliases: ["DOT"], rank: 71, indicators: false },
  { pair: "diausdt", symbol: "DIA", name: "DIA", slug: "dia", aliases: ["DIA"], rank: 72, indicators: false },
  { pair: "cfxusdt", symbol: "CFX", name: "CFX", slug: "cfx", aliases: ["CFX"], rank: 73, indicators: false },
  { pair: "reusdt", symbol: "RE", name: "RE", slug: "re", aliases: ["RE"], rank: 74, indicators: false },
  { pair: "qqqbusdt", symbol: "QQQB", name: "QQQB", slug: "qqqb", aliases: ["QQQB"], rank: 75, indicators: false },
  { pair: "xecusdt", symbol: "XEC", name: "XEC", slug: "xec", aliases: ["XEC"], rank: 76, indicators: false },
  { pair: "allousdt", symbol: "ALLO", name: "ALLO", slug: "allo", aliases: ["ALLO"], rank: 77, indicators: false },
  { pair: "arbusdt", symbol: "ARB", name: "ARB", slug: "arb", aliases: ["ARB"], rank: 78, indicators: false },
  { pair: "espusdt", symbol: "ESP", name: "ESP", slug: "esp", aliases: ["ESP"], rank: 79, indicators: false },
  { pair: "kiteusdt", symbol: "KITE", name: "KITE", slug: "kite", aliases: ["KITE"], rank: 80, indicators: false },
  { pair: "tstusdt", symbol: "TST", name: "TST", slug: "tst", aliases: ["TST"], rank: 81, indicators: false },
  { pair: "jstusdt", symbol: "JST", name: "JST", slug: "jst", aliases: ["JST"], rank: 82, indicators: false },
  { pair: "rifusdt", symbol: "RIF", name: "RIF", slug: "rif", aliases: ["RIF"], rank: 83, indicators: false },
  { pair: "ldousdt", symbol: "LDO", name: "LDO", slug: "ldo", aliases: ["LDO"], rank: 84, indicators: false },
  { pair: "ethfiusdt", symbol: "ETHFI", name: "ETHFI", slug: "ethfi", aliases: ["ETHFI"], rank: 85, indicators: false },
  { pair: "币安人生usdt", symbol: "币安人生", name: "币安人生", slug: "币安人生", aliases: ["币安人生"], rank: 86, indicators: false },
  { pair: "zrousdt", symbol: "ZRO", name: "ZRO", slug: "zro", aliases: ["ZRO"], rank: 87, indicators: false },
  { pair: "axtibusdt", symbol: "AXTIB", name: "AXTIB", slug: "axtib", aliases: ["AXTIB"], rank: 88, indicators: false },
  { pair: "aptusdt", symbol: "APT", name: "APT", slug: "apt", aliases: ["APT"], rank: 89, indicators: false },
  { pair: "flowusdt", symbol: "FLOW", name: "FLOW", slug: "flow", aliases: ["FLOW"], rank: 90, indicators: false },
  { pair: "cakeusdt", symbol: "CAKE", name: "CAKE", slug: "cake", aliases: ["CAKE"], rank: 91, indicators: false },
  { pair: "megausdt", symbol: "MEGA", name: "MEGA", slug: "mega", aliases: ["MEGA"], rank: 92, indicators: false },
  { pair: "asterusdt", symbol: "ASTER", name: "ASTER", slug: "aster", aliases: ["ASTER"], rank: 93, indicators: false },
  { pair: "bonkusdt", symbol: "BONK", name: "BONK", slug: "bonk", aliases: ["BONK"], rank: 94, indicators: false },
  { pair: "polusdt", symbol: "POL", name: "POL", slug: "pol", aliases: ["POL"], rank: 95, indicators: false },
  { pair: "wlfiusdt", symbol: "WLFI", name: "WLFI", slug: "wlfi", aliases: ["WLFI"], rank: 96, indicators: false },
  { pair: "virtualusdt", symbol: "VIRTUAL", name: "VIRTUAL", slug: "virtual", aliases: ["VIRTUAL"], rank: 97, indicators: false },
  { pair: "pendleusdt", symbol: "PENDLE", name: "PENDLE", slug: "pendle", aliases: ["PENDLE"], rank: 98, indicators: false },
];

const INDICATOR_PAIRS = ALL_PAIRS.filter((c) => c.indicators);

const BY_SLUG = new Map(ALL_PAIRS.map((c) => [c.slug.toLowerCase(), c]));

// Every symbol/name/alias, lowercased, mapped to its canonical uppercase symbol.
const MATCH_INDEX = new Map();
for (const coin of ALL_PAIRS) {
  const keys = [coin.symbol, coin.name, coin.slug, ...coin.aliases];
  for (const key of keys) {
    MATCH_INDEX.set(key.toLowerCase(), coin.symbol);
  }
}

function getCoinBySlug(slug) {
  if (!slug || typeof slug !== "string") return null;
  return BY_SLUG.get(slug.toLowerCase()) ?? null;
}

/** Resolve any known symbol/name/slug/alias (case-insensitive) to its canonical symbol, or null if unknown. */
function matchAsset(input) {
  if (!input || typeof input !== "string") return null;
  return MATCH_INDEX.get(input.trim().toLowerCase()) ?? null;
}

module.exports = { ALL_PAIRS, INDICATOR_PAIRS, getCoinBySlug, matchAsset };
