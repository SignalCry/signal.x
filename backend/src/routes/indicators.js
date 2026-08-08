const { Router } = require("express");
const { getIndicators } = require("../services/indicatorService");

const router = Router();

router.get("/", (req, res) => {
  try {
    const symbol =
      typeof req.query.symbol === "string" ? req.query.symbol : undefined;
    const tab =
      typeof req.query.tab === "string" ? req.query.tab : "technical";

    if (tab === "non-technical") {
      return res.json({
        data: [],
        meta: {
          tab: "non-technical",
          comingSoon: true,
          message:
            "Non-technical indicators — news sentiment, social volume, and signal activity — coming soon as we connect the signal pipeline.",
          indicatorsEnabledCount: 0,
          count: 0,
          lastUpdated: null,
          stale: false,
        },
      });
    }

    const payload = getIndicators({ symbol, tab: "technical" });
    res.json(payload);
  } catch (err) {
    console.error("[indicators route] Error:", err.message);
    res.status(500).json({ error: "Failed to load indicators" });
  }
});

module.exports = router;
