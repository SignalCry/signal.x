# Backend — Current State (Agent Brief)

**Audience:** Any human or AI agent working on SignalX/SignalCry  
**Last verified:** 2026-08-05 (post `fix/indicators` merge with `main`)  
**Truth rule:** Prefer this file + code over older design docs (`docs/01`–`07`, `WEBSOCKET_IMPLEMENTATION.md`). Those are partially stale.

---

## One-line verdict

Single long-lived Express process: Spot ticker WS for **97** pairs, DB-backed 1h TA for **24** pairs, RSS→Postgres→Gemini/Groq news enrichment, email-code auth. **No X/Twitter, no Stripe, no `/signal` API, no alerts.** Docs often overclaim.

---

## Runtime shape

| Item | Value |
|------|--------|
| Entry | `backend/index.js` |
| Stack | Express 5, `ws`, Prisma 7 + `@prisma/adapter-pg`, `node-cron` |
| Default port | `4000` |
| Process model | **One Node process** (HTTP + WS + cron + intervals). Not serverless-safe. |
| Deploy config in repo | **None** (no Dockerfile, Procfile, render.yaml) |

On listen:
1. `initIndicators()` — candle backfill if needed → load DB → kline WS  
2. `cleanupOldArticles()`  
3. RSS `getNews()` then every **30 min**  
4. AI `processPendingArticles` after **30s**, then every **2 min** (comment wrongly says 5)  
5. Daily 03:00 cron — news cleanup + candle cleanup  

---

## HTTP / WS surface

| Mount | File | Notes |
|-------|------|--------|
| `GET /api/health` | `src/routes/health.js` | `{ status: "ok" }` |
| `/api/auth/*` | `src/routes/auth.js` | Email code signup, login, `/me` |
| `/api/news` | `src/routes/news.js` | Paginated; **only `aiProcessed: true`** rows |
| `/api/indicators` | `src/routes/indicators.js` | `{ data, meta }`; `?symbol=` `?tab=` |
| `/api/market/:symbol/klines` | `src/routes/market.js` | Live Binance REST (does **not** read `Candle` table) |
| `/api/coins` | `src/routes/coins.js` | Full `ALL_PAIRS` from config |
| `WS /ws/market` | `src/routes/websocket.js` | Fan-out of Spot `@ticker` |

No auth middleware on product APIs. No rate limiting. No global error handler.

---

## Source of truth for coins

**File:** `backend/src/config/coins.js`

| Metric | Reality |
|--------|---------|
| Comment “top 100” | **97** USDT pairs |
| `indicators: true` | **24** |
| `indicators: false` | **73** (price only) |

Exports: `ALL_PAIRS`, `INDICATOR_PAIRS`, `getCoinBySlug`, `matchAsset`.

`backend/src/data/tradingPairs.js` is a **thin adapter** (`getIndicatorPairs` → `INDICATOR_PAIRS.map(c => c.pair)`). Prefer `coins.js` for new code.

**Critical:** Indicator pair flags on `main` include USDC, MIRA, GIGGLE, ORDI, etc. — **not** the curated “BTC+majors” list in older design docs. Changing flags changes Binance kline load and Candle backfill cost. Do not flip 73 → all `true` without capacity review.

---

## Three live pipelines

### A) Prices (cheap, scales)

`binanceWebSocket.js` → combined Spot `@ticker` for **all** `ALL_PAIRS`.  
Connects when ≥1 client on `/ws/market`; disconnects when zero clients.  
500ms throttle per symbol broadcast.

### B) Indicators (expensive, capped)

```
coins.js INDICATOR_PAIRS
  → candleService (Postgres Candle; REST backfill only if empty/stale)
  → indicatorService (in-memory EMA/RSI/MACD/BB)
  → Binance kline_1h WS (confirmed close → upsert + recompute)
  → GET /api/indicators
```

- Interval: **1h**; lookback **201**; backfill **500** candles; batches of **5** + 1s pause  
- Stale if latest candle openTime > **2h**  
- Candle retention cleanup: **90 days**  
- `tab=non-technical` → empty + `comingSoon: true` (intentional)

### C) News → AI “signals” (enrichment only)

```
RSS (8 feeds) → News rows (today UTC upsert)
  → signalWorker (unprocessed, last 24h)
  → Gemini then Groq → aiSummary, aiTakeaway, aiSentiment, aiImpactScore (0–100), aiAssets
  → GET /api/news only returns aiProcessed=true
```

This is **not** the product Signal feed (X + price cards). Naming collision: `signalEngine` / `signalWorker` = news AI tagging.

---

## Prisma models

`User`, `News` (+ AI fields, `aiTakeaway`, `topics`, `aiRetryCount`, `aiFailed`), `Candle`, `EmailVerificationCode`

Migrations under `backend/prisma/migrations/` including `20260804120000_add_candle_table`.  
**Start scripts do not run migrate** — deploy must `npx prisma migrate deploy`.

---

## Env vars

| Var | Need |
|-----|------|
| `DATABASE_URL` | Required |
| `PORT` | Optional (4000) |
| `FRONTEND_URL` | CORS (default `*`) |
| `JWT_SECRET` | Auth (**insecure default** if unset) |
| `SMTP_*` / `EMAIL_FROM` | Signup codes |
| `GEMINI_API_KEY` | Primary AI |
| `GROQ_API_KEY` | Fallback AI |

No `.env.example`. `dotenv` is a **devDependency** but required at runtime via `require("dotenv")` — `npm ci --omit=dev` will break unless platform injects env another way.

---

## Auth — what exists

Email verification code → signup → JWT 7d → login → `/me`.  
**Not** wired to gate news/market/indicators. Password on signup is not bound to the verification row (only email is).

---

## Dead / misleading / fragile (fix or avoid)

1. **`scrapeArticle` in newsService** — defined, never called; cheerio mostly for that.  
2. **Three+ PrismaClient instances** (`lib/prisma`, auth, newsService, signalWorker) — connection pool risk on small Postgres.  
3. ~~Failed AI articles stay `aiProcessed: false` — retried forever~~ **Fixed 2026-09-17:** `aiRetryCount`/`aiFailed` cap retries at 3, then excluded from future runs.  
4. **Cleanup log says “28 days”; code deletes 7 days** by `createdAt`.  
5. **Worker comment says 5 min; code is 2 min.**  
6. **`WEBSOCKET_IMPLEMENTATION.md`** still describes Futures — code is Spot.  
7. **Impact score:** design docs sometimes say 0–1; code uses **0–100**.  
8. **Chart klines** hit Binance REST every request; ignore `Candle` table → extra rate-limit risk + possible divergence from indicators.  
9. **Indicator `stale` flag** is process-global.  
10. **No X API, no alert dispatcher, no Stripe** despite README/marketing.

---

## File map (start here)

```
backend/index.js
backend/src/config/coins.js          ← pair SoT
backend/src/services/binanceWebSocket.js
backend/src/services/candleService.js
backend/src/services/indicatorService.js
backend/src/services/newsService.js
backend/src/services/signalWorker.js
backend/src/services/aiClient.js
backend/prisma/schema.prisma
```

---

## Agent rules of engagement

1. Before changing indicator coverage, edit `coins.js` `indicators` flags — not a second pair list.  
2. Before assuming “signals exist,” check whether you mean **news AI fields** or **`/signal` product** (not built).  
3. After schema changes: add a migration; document deploy `migrate deploy`.  
4. Do not “fix” Binance bans by enabling indicators on all 97 pairs.  
5. Update **this file** when you change architecture that invalidates the verdict above.
