# Frontend — Current State (Agent Brief)

**Audience:** Any human or AI agent working on SignalX/SignalCry  
**Last verified:** 2026-08-05 (post `fix/indicators` merge with `main`)  
**Truth rule:** Prefer this file + code over marketing copy on `/` and over `docs/01`–`07` where they disagree.

---

## One-line verdict

Thin Next.js 16 App Router **client** app: live market + coins API, news with AI fields, TA indicators poll, JWT auth UI. **Marketing promises X alerts and a signal product that do not exist in routes.** No `/signal`, no `/dashboard` (broken link), no route protection.

---

## Stack

| Item | Value |
|------|--------|
| Next | 16.1.1 (App Router) |
| React | 19.2.3 |
| Styling | Tailwind 4, IBM Plex Sans, bootstrap-icons |
| Charts | `lightweight-charts` 5.x |
| State | Local React state only (no Redux/Zustand) |
| Tests | None |
| i18n | EN/ES partial — most product UI still hardcoded English |

---

## Env / API wiring

**File:** `frontend/src/constants/app.ts`

```
APP_NAME  = "SignalX"
API_BASE  = NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
WS_BASE   = NEXT_PUBLIC_WS_URL  ?? "ws://localhost:4000"
```

`frontend/.env` may be empty — production **must** set both `NEXT_PUBLIC_*` or the browser talks to localhost.

WS path: `${WS_BASE}/ws/market`  
Trailing-slash handling is inconsistent between home vs market/symbols — normalize when touching WS URL code.

---

## Routes that exist

| Route | File | Reality |
|-------|------|---------|
| `/` | `app/page.tsx` | Hero overpromises alerts/X; shows news preview + top market + movers |
| `/market` | `app/market/page.tsx` | Full live table + WS status |
| `/symbols/[id]` | `app/symbols/[id]/page.tsx` | Price + chart; `id` = **coin slug** from `/api/coins` |
| `/news` | `app/news/page.tsx` | Large client page: fetch, filter, sort, modal |
| `/news/[id]` | `app/news/[id]/page.tsx` | Article + “Signal X AI Analysis” |
| `/indicators` | `app/indicators/page.tsx` + `layout.tsx` | Technical tabs + Non-technical coming-soon |
| `/auth` | `app/auth/page.tsx` | Login / signup with email code (standalone dark UI) |
| `/pricing` | `app/pricing/page.tsx` | Waitlist stub; **“Open Dashboard” → `/dashboard` 404** |

**Navbar:** Home, News, Indicators, Market, Login — no Signal, no Pricing.

---

## Routes that do NOT exist (but docs/copy assume)

| Missing | Referenced by |
|---------|----------------|
| `/signal` | Product thesis / IA docs; intended primary surface |
| `/dashboard` | `app/pricing/page.tsx` link |
| Stripe / Pro checkout | Pricing stub only |
| Alerts / notification bell | Marketing CTA “Get Alerts” |

---

## How features actually work

### Market
- `useCoins()` → `GET /api/coins`  
- `useBinanceWebSocket()` → live tickers  
- Rows only appear if **both** WS symbol and coins config match — config drift = silent empty UI  
- **No shared context:** home, market, symbols each open their **own** WS and each refetch coins

### News
- List/modal/detail consume AI fields (`aiTakeaway`, `aiImpactScore`, `aiSentiment`, …)  
- Backend only returns `aiProcessed: true` — empty news UI usually means AI worker lag/failure, not “no RSS”  
- `NewsCard` was shaped for a future signal feed; impact badge styling differs slightly from `NewsModal`

### Indicators
- Polls `GET /api/indicators?tab=technical` every 30s  
- Expects `{ data, meta }` (also tolerates legacy array)  
- Coin labels via `useCoins` / `coinsByPair` — **`coinMetadata.ts` was deleted on main**  
- Non-technical tab = placeholder copy only

### Auth
- JWT in `localStorage` (`signalcry_token`, `signalcry_user`)  
- Navbar avatar when logged in  
- **No gated pages** — auth does not change product access today  
- `AuthProvider` only keeps logged-in users off `/auth`

---

## Branding / naming drift (do not ignore)

| Surface | Name |
|---------|------|
| UI / metadata | SignalX |
| Logo | Signal\|X |
| Auth copy | “Signal X” |
| localStorage keys | `signalcry_*` |
| Repo / README | SignalCry |

Pick one before adding more user-facing strings.

---

## Marketing vs product (critical)

| Claim | Code |
|-------|------|
| “Never miss market-moving crypto posts” / X alerts | **No X integration, no alerts** |
| “Get Alerts” | → `/pricing` waitlist, not alerts |
| “Join thousands of traders” | Unsubstantiated |
| Layout meta: track X posts | Not implemented |
| Pro / dashboard | Stub + 404 |

Agents: **do not build features that assume alerts or `/signal` already ship.** If you add them, update this file and the nav in the same change.

---

## Key files

```
frontend/src/constants/app.ts
frontend/src/hooks/useCoins.ts
frontend/src/hooks/useBinanceWebSocket.ts
frontend/src/hooks/useAuth.tsx
frontend/app/page.tsx
frontend/app/indicators/page.tsx
frontend/app/news/page.tsx
frontend/src/components/NewsCard.tsx
frontend/src/components/Navbar.tsx
```

---

## Fragile spots for the next agent

1. **N× WebSocket connections** — no shared market provider; easy to overload or race status.  
2. **N× `/coins` fetches** — same; consider a provider when touching market heavily.  
3. **Symbols page “Coin not found”** while WS/coins still loading — false negative UX.  
4. **Empty `.env` + localhost defaults** — “works locally, breaks on Vercel” classic.  
5. **Stale docs** still mention `coinMetadata.ts`, `/dashboard`, `/signal` as if live.  
6. **i18n incomplete** — don’t assume `t()` covers home/auth/news filters.  
7. **Auth tokens never sent** on news/market/indicators requests — fine now; will surprise Pro gating.  
8. **Home hero** will keep lying until `/signal` or alerts exist — either ship or rewrite copy.  
9. **Frontend README** still invents Geist font — app uses IBM Plex Sans.  
10. **Dual aesthetic** — light product pages vs dark auth — don’t randomly invent a third.

---

## Agent rules of engagement

1. Coin metadata = `useCoins` + backend `GET /api/coins` — never resurrect `coinMetadata.ts` without syncing backend.  
2. Building `/signal` is **greenfield** — reuse `NewsCard` patterns; wire to a real signals API when it exists.  
3. Fix or remove the `/dashboard` link if you touch pricing.  
4. Align hero/CTA copy with shipped behavior, or ship the behavior.  
5. Update **this file** when routes, env contracts, or product promises change.
