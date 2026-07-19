const { Router } = require("express");
const { getNewsPaginated, getAvailableDates, getAvailableAssets, getArticle } = require("../services/newsService");

const router = Router();

router.get("/dates", async (req, res) => {
  try {
    const dates = await getAvailableDates();
    res.json({ dates });
  } catch (err) {
    console.error("[news route] Error:", err.message);
    res.status(500).json({ error: "Failed to load dates" });
  }
});

router.get("/assets", async (req, res) => {
  try {
    const assets = await getAvailableAssets();
    res.json({ assets });
  } catch (err) {
    console.error("[news route] Error:", err.message);
    res.status(500).json({ error: "Failed to load assets" });
  }
});

router.get("/", async (req, res) => {
  try {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";
    // History is capped at ~7 days, so the client fetches the whole window at
    // once and does its own filtering/sorting; allow a high limit for that.
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const assets = typeof req.query.assets === "string" ? req.query.assets : "";
    const days   = /^\d{1,2}$/.test(req.query.days) ? req.query.days : "";
    const from   = /^\d{4}-\d{2}-\d{2}$/.test(req.query.from) ? req.query.from : "";
    const to     = /^\d{4}-\d{2}-\d{2}$/.test(req.query.to) ? req.query.to : "";
    const result = await getNewsPaginated({ cursor, limit, assets, days, from, to });
    res.json(result);
  } catch (err) {
    console.error("[news route] Error:", err.message);
    res.status(500).json({ error: "Failed to load news" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const article = await getArticle(req.params.id);
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.json(article);
  } catch (err) {
    console.error("[news route] Error:", err.message);
    res.status(500).json({ error: "Failed to load article" });
  }
});

module.exports = router;
