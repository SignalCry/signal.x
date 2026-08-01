/**
 * Single source of truth for supported Binance USDT pairs (top 100 by quote volume).
 * Verified against Binance exchangeInfo + 24h ticker (TRADING status, USDT quote).
 */
const ALL_PAIRS = [
  { pair: "usdcusdt", symbol: "USDC", name: "USDC", slug: "usdc", aliases: ["USDC"], indicators: true },
  { pair: "btcusdt", symbol: "BTC", name: "BTC", slug: "btc", aliases: ["BTC"], indicators: true },
  { pair: "ethusdt", symbol: "ETH", name: "ETH", slug: "eth", aliases: ["ETH"], indicators: true },
  { pair: "mirausdt", symbol: "MIRA", name: "MIRA", slug: "mira", aliases: ["MIRA"], indicators: true },
  { pair: "solusdt", symbol: "SOL", name: "SOL", slug: "sol", aliases: ["SOL"], indicators: true },
  { pair: "giggleusdt", symbol: "GIGGLE", name: "GIGGLE", slug: "giggle", aliases: ["GIGGLE"], indicators: true },
  { pair: "bnbusdt", symbol: "BNB", name: "BNB", slug: "bnb", aliases: ["BNB"], indicators: true },
  { pair: "xrpusdt", symbol: "XRP", name: "XRP", slug: "xrp", aliases: ["XRP"], indicators: true },
  { pair: "rlusdusdt", symbol: "RLUSD", name: "RLUSD", slug: "rlusd", aliases: ["RLUSD"], indicators: true },
  { pair: "uniusdt", symbol: "UNI", name: "UNI", slug: "uni", aliases: ["UNI"], indicators: true },
  { pair: "bankusdt", symbol: "BANK", name: "BANK", slug: "bank", aliases: ["BANK"], indicators: true },
  { pair: "aaveusdt", symbol: "AAVE", name: "AAVE", slug: "aave", aliases: ["AAVE"], indicators: true },
  { pair: "eulusdt", symbol: "EUL", name: "EUL", slug: "eul", aliases: ["EUL"], indicators: true },
  { pair: "zecusdt", symbol: "ZEC", name: "ZEC", slug: "zec", aliases: ["ZEC"], indicators: true },
  { pair: "trxusdt", symbol: "TRX", name: "TRX", slug: "trx", aliases: ["TRX"], indicators: true },
  { pair: "dexeusdt", symbol: "DEXE", name: "DEXE", slug: "dexe", aliases: ["DEXE"], indicators: true },
  { pair: "adausdt", symbol: "ADA", name: "ADA", slug: "ada", aliases: ["ADA"], indicators: true },
  { pair: "cotiusdt", symbol: "COTI", name: "COTI", slug: "coti", aliases: ["COTI"], indicators: true },
  { pair: "dogeusdt", symbol: "DOGE", name: "DOGE", slug: "doge", aliases: ["DOGE"], indicators: true },
  { pair: "mmtusdt", symbol: "MMT", name: "MMT", slug: "mmt", aliases: ["MMT"], indicators: true },
  { pair: "spcxbusdt", symbol: "SPCXB", name: "SPCXB", slug: "spcxb", aliases: ["SPCXB"], indicators: true },
  { pair: "nearusdt", symbol: "NEAR", name: "NEAR", slug: "near", aliases: ["NEAR"], indicators: true },
  { pair: "1000satsusdt", symbol: "1000SATS", name: "1000SATS", slug: "1000sats", aliases: ["1000SATS"], indicators: true },
  { pair: "ordiusdt", symbol: "ORDI", name: "ORDI", slug: "ordi", aliases: ["ORDI"], indicators: true },
  { pair: "pumpusdt", symbol: "PUMP", name: "PUMP", slug: "pump", aliases: ["PUMP"], indicators: false },
  { pair: "zamausdt", symbol: "ZAMA", name: "ZAMA", slug: "zama", aliases: ["ZAMA"], indicators: false },
  { pair: "shibusdt", symbol: "SHIB", name: "SHIB", slug: "shib", aliases: ["SHIB"], indicators: false },
  { pair: "erausdt", symbol: "ERA", name: "ERA", slug: "era", aliases: ["ERA"], indicators: false },
  { pair: "epicusdt", symbol: "EPIC", name: "EPIC", slug: "epic", aliases: ["EPIC"], indicators: false },
  { pair: "ondousdt", symbol: "ONDO", name: "ONDO", slug: "ondo", aliases: ["ONDO"], indicators: false },
  { pair: "pepeusdt", symbol: "PEPE", name: "PEPE", slug: "pepe", aliases: ["PEPE"], indicators: false },
  { pair: "tlmusdt", symbol: "TLM", name: "TLM", slug: "tlm", aliases: ["TLM"], indicators: false },
  { pair: "taousdt", symbol: "TAO", name: "TAO", slug: "tao", aliases: ["TAO"], indicators: false },
  { pair: "sndkbusdt", symbol: "SNDKB", name: "SNDKB", slug: "sndkb", aliases: ["SNDKB"], indicators: false },
  { pair: "ltcusdt", symbol: "LTC", name: "LTC", slug: "ltc", aliases: ["LTC"], indicators: false },
  { pair: "linkusdt", symbol: "LINK", name: "LINK", slug: "link", aliases: ["LINK"], indicators: false },
  { pair: "synusdt", symbol: "SYN", name: "SYN", slug: "syn", aliases: ["SYN"], indicators: false },
  { pair: "kaitousdt", symbol: "KAITO", name: "KAITO", slug: "kaito", aliases: ["KAITO"], indicators: false },
  { pair: "enausdt", symbol: "ENA", name: "ENA", slug: "ena", aliases: ["ENA"], indicators: false },
  { pair: "wldusdt", symbol: "WLD", name: "WLD", slug: "wld", aliases: ["WLD"], indicators: false },
  { pair: "suiusdt", symbol: "SUI", name: "SUI", slug: "sui", aliases: ["SUI"], indicators: false },
  { pair: "soxlbusdt", symbol: "SOXLB", name: "SOXLB", slug: "soxlb", aliases: ["SOXLB"], indicators: false },
  { pair: "filusdt", symbol: "FIL", name: "FIL", slug: "fil", aliases: ["FIL"], indicators: false },
  { pair: "mubusdt", symbol: "MUB", name: "MUB", slug: "mub", aliases: ["MUB"], indicators: false },
  { pair: "xplusdt", symbol: "XPL", name: "XPL", slug: "xpl", aliases: ["XPL"], indicators: false },
  { pair: "dashusdt", symbol: "DASH", name: "DASH", slug: "dash", aliases: ["DASH"], indicators: false },
  { pair: "homeusdt", symbol: "HOME", name: "HOME", slug: "home", aliases: ["HOME"], indicators: false },
  { pair: "xlmusdt", symbol: "XLM", name: "XLM", slug: "xlm", aliases: ["XLM"], indicators: false },
  { pair: "xautusdt", symbol: "XAUT", name: "XAUT", slug: "xaut", aliases: ["XAUT"], indicators: false },
  { pair: "paxgusdt", symbol: "PAXG", name: "PAXG", slug: "paxg", aliases: ["PAXG"], indicators: false },
  { pair: "crclbusdt", symbol: "CRCLB", name: "CRCLB", slug: "crclb", aliases: ["CRCLB"], indicators: false },
  { pair: "skhybusdt", symbol: "SKHYB", name: "SKHYB", slug: "skhyb", aliases: ["SKHYB"], indicators: false },
  { pair: "babyusdt", symbol: "BABY", name: "BABY", slug: "baby", aliases: ["BABY"], indicators: false },
  { pair: "penguusdt", symbol: "PENGU", name: "PENGU", slug: "pengu", aliases: ["PENGU"], indicators: false },
  { pair: "ensousdt", symbol: "ENSO", name: "ENSO", slug: "enso", aliases: ["ENSO"], indicators: false },
  { pair: "vanryusdt", symbol: "VANRY", name: "VANRY", slug: "vanry", aliases: ["VANRY"], indicators: false },
  { pair: "gramusdt", symbol: "GRAM", name: "GRAM", slug: "gram", aliases: ["GRAM"], indicators: false },
  { pair: "korubusdt", symbol: "KORUB", name: "KORUB", slug: "korub", aliases: ["KORUB"], indicators: false },
  { pair: "fetusdt", symbol: "FET", name: "FET", slug: "fet", aliases: ["FET"], indicators: false },
  { pair: "avaxusdt", symbol: "AVAX", name: "AVAX", slug: "avax", aliases: ["AVAX"], indicators: false },
  { pair: "broccoli714usdt", symbol: "BROCCOLI714", name: "BROCCOLI714", slug: "broccoli714", aliases: ["BROCCOLI714"], indicators: false },
  { pair: "trumpusdt", symbol: "TRUMP", name: "TRUMP", slug: "trump", aliases: ["TRUMP"], indicators: false },
  { pair: "injusdt", symbol: "INJ", name: "INJ", slug: "inj", aliases: ["INJ"], indicators: false },
  { pair: "aevousdt", symbol: "AEVO", name: "AEVO", slug: "aevo", aliases: ["AEVO"], indicators: false },
  { pair: "hbarusdt", symbol: "HBAR", name: "HBAR", slug: "hbar", aliases: ["HBAR"], indicators: false },
  { pair: "neirousdt", symbol: "NEIRO", name: "NEIRO", slug: "neiro", aliases: ["NEIRO"], indicators: false },
  { pair: "mubarakusdt", symbol: "MUBARAK", name: "MUBARAK", slug: "mubarak", aliases: ["MUBARAK"], indicators: false },
  { pair: "tutusdt", symbol: "TUT", name: "TUT", slug: "tut", aliases: ["TUT"], indicators: false },
  { pair: "snxxbusdt", symbol: "SNXXB", name: "SNXXB", slug: "snxxb", aliases: ["SNXXB"], indicators: false },
  { pair: "bchusdt", symbol: "BCH", name: "BCH", slug: "bch", aliases: ["BCH"], indicators: false },
  { pair: "dotusdt", symbol: "DOT", name: "DOT", slug: "dot", aliases: ["DOT"], indicators: false },
  { pair: "diausdt", symbol: "DIA", name: "DIA", slug: "dia", aliases: ["DIA"], indicators: false },
  { pair: "cfxusdt", symbol: "CFX", name: "CFX", slug: "cfx", aliases: ["CFX"], indicators: false },
  { pair: "reusdt", symbol: "RE", name: "RE", slug: "re", aliases: ["RE"], indicators: false },
  { pair: "qqqbusdt", symbol: "QQQB", name: "QQQB", slug: "qqqb", aliases: ["QQQB"], indicators: false },
  { pair: "xecusdt", symbol: "XEC", name: "XEC", slug: "xec", aliases: ["XEC"], indicators: false },
  { pair: "allousdt", symbol: "ALLO", name: "ALLO", slug: "allo", aliases: ["ALLO"], indicators: false },
  { pair: "arbusdt", symbol: "ARB", name: "ARB", slug: "arb", aliases: ["ARB"], indicators: false },
  { pair: "espusdt", symbol: "ESP", name: "ESP", slug: "esp", aliases: ["ESP"], indicators: false },
  { pair: "kiteusdt", symbol: "KITE", name: "KITE", slug: "kite", aliases: ["KITE"], indicators: false },
  { pair: "tstusdt", symbol: "TST", name: "TST", slug: "tst", aliases: ["TST"], indicators: false },
  { pair: "jstusdt", symbol: "JST", name: "JST", slug: "jst", aliases: ["JST"], indicators: false },
  { pair: "rifusdt", symbol: "RIF", name: "RIF", slug: "rif", aliases: ["RIF"], indicators: false },
  { pair: "ldousdt", symbol: "LDO", name: "LDO", slug: "ldo", aliases: ["LDO"], indicators: false },
  { pair: "ethfiusdt", symbol: "ETHFI", name: "ETHFI", slug: "ethfi", aliases: ["ETHFI"], indicators: false },  { pair: "zrousdt", symbol: "ZRO", name: "ZRO", slug: "zro", aliases: ["ZRO"], indicators: false },
  { pair: "axtibusdt", symbol: "AXTIB", name: "AXTIB", slug: "axtib", aliases: ["AXTIB"], indicators: false },
  { pair: "aptusdt", symbol: "APT", name: "APT", slug: "apt", aliases: ["APT"], indicators: false },
  { pair: "flowusdt", symbol: "FLOW", name: "FLOW", slug: "flow", aliases: ["FLOW"], indicators: false },
  { pair: "cakeusdt", symbol: "CAKE", name: "CAKE", slug: "cake", aliases: ["CAKE"], indicators: false },
  { pair: "megausdt", symbol: "MEGA", name: "MEGA", slug: "mega", aliases: ["MEGA"], indicators: false },
  { pair: "asterusdt", symbol: "ASTER", name: "ASTER", slug: "aster", aliases: ["ASTER"], indicators: false },
  { pair: "bonkusdt", symbol: "BONK", name: "BONK", slug: "bonk", aliases: ["BONK"], indicators: false },
  { pair: "polusdt", symbol: "POL", name: "POL", slug: "pol", aliases: ["POL"], indicators: false },
  { pair: "wlfiusdt", symbol: "WLFI", name: "WLFI", slug: "wlfi", aliases: ["WLFI"], indicators: false },
  { pair: "virtualusdt", symbol: "VIRTUAL", name: "VIRTUAL", slug: "virtual", aliases: ["VIRTUAL"], indicators: false },
  { pair: "pendleusdt", symbol: "PENDLE", name: "PENDLE", slug: "pendle", aliases: ["PENDLE"], indicators: false },
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
