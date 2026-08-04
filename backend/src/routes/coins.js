const { Router } = require("express");
const { ALL_PAIRS } = require("../config/coins");

const router = Router();

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
let cache = { data: null, timestamp: 0 };

router.get("/", (req, res) => {
  const now = Date.now();
  if (!cache.data || now - cache.timestamp >= CACHE_TTL) {
    cache = { data: ALL_PAIRS, timestamp: now };
  }
  res.json(cache.data);
});

module.exports = router;
