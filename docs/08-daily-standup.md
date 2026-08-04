# Daily Async Standup

**For:** Mark + Nadjib  
**Cadence:** Every working day (async Slack; optional 15-min call 2–3×/week)  
**Goal:** Stay aligned without losing a day of drift.

---

## How to run it

Post in your shared Slack channel (or DM thread) **once per day**, ideally:

| Person | When |
|--------|------|
| **Nadjib** | After work / evening (his usual window) |
| **Mark** | After work / when he starts SignalX that day |

If either person is blocked >24h, ping the other — don't wait for the next standup.

---

## Slack template (copy-paste)

```
📅 Standup — YYYY-MM-DD

👤 Me:
• Yesterday: …
• Today: …
• Blocked: … (or "none")
• Need from you: … (or "none")

🎯 Focus this week:
• Nadjib: /signal · X API · 100-pair prices
• Mark: fix/indicators · UX · SEO

✅ Done since last standup: (optional link / screenshot)
```

### Minimal version (busy days)

```
📅 YYYY-MM-DD
Yesterday: …
Today: …
Blocked: none / …
```

---

## Field guide

| Field | What to write | What not to write |
|-------|---------------|-------------------|
| **Yesterday** | Concrete shipped or moved (branch, PR, decision) | "Worked on stuff" |
| **Today** | 1–3 outcomes, not a wish list | More than you can finish in one session |
| **Blocked** | External dependency, missing key, unclear product call | "I'm tired" (put that in a separate note) |
| **Need from you** | Specific ask + deadline | Vague "need help" |

---

## Weekly check-in (Sunday or Monday, 15–20 min)

Use this once a week in addition to daily async:

```
🗓 Weekly — Week of YYYY-MM-DD

1. Product north star check
   Are we still optimizing for: signal = post + news + price before the crowd?
   Yes / No / Drifted because …

2. What shipped
   • …
   • …

3. What slipped
   • … → new date: …

4. Demo / screenshots
   • Live URL: …
   • Broken / laggy: …

5. Customer lens (Mark)
   Would a first-time trader understand /signal or the homepage in 60s?
   Gaps: …

6. Next week top 3 (max)
   1. …
   2. …
   3. …

7. Infra / ops
   Render/Vercel OK? Migrations needed? Secrets (X API)?
```

---

## Branch & merge hygiene (from Slack)

| Rule | Owner |
|------|-------|
| Feature work on named branches (`fix/indicators`, etc.) | Whoever codes |
| Nadjib merges to main/dev when ready | Nadjib |
| Don't leave main broken for the other person | Both |
| Call out if you turned something off (e.g. indicators) | Whoever did it |

---

## Example standup (Mark)

```
📅 Standup — 2026-08-05

👤 Mark:
• Yesterday: Wrote design docs (thesis, IA, indicators architecture)
• Today: fix/indicators — tradingPairs config + Candle model + DB-backed boot
• Blocked: none
• Need from you: Confirm indicator pair list (~25) is OK; any coins you want on TA besides doc #5?

🎯 Focus this week:
• Nadjib: /signal · X API · 100-pair prices
• Mark: fix/indicators · UX · SEO
```

## Example standup (Nadjib)

```
📅 Standup — 2026-08-05

👤 Nadjib:
• Yesterday: Deployed new build; started /signal card price chip
• Today: X API key + tracked accounts list; keep indicators off until Mark's branch merges
• Blocked: Waiting on second X API key for rotation
• Need from you: After fix/indicators is ready, ping me for merge review
```

---

## Rules of engagement

1. **No silent weeks** — even a "busy day, only 30 min, doing X" counts.
2. **One source of truth for priorities** — if Slack and Trello disagree, Slack standup wins until Trello is updated.
3. **Blockers get a name** — "blocked on X API" not "blocked on backend."
4. **Customer first on weekly** — Mark owns the "would a trader get it?" question every week.
5. **Don't rebuild alignment by stopping** — short update > no update.

---

## Optional: pin this in Slack

Pin the copy-paste template + week focus lines so neither of you has to dig for it.
