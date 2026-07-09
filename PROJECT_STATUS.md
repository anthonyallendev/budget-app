# Retirely — Project Status

_Last updated: 8 July 2026_

## The business

| Item | Detail |
|---|---|
| Legal entity | **FERMIWARE PTY LTD** (Australian Private Company, NSW) |
| ABN | **78 699 924 475** (active from 4 Jul 2026, verified on ABN Lookup) |
| ACN | **699 924 475** |
| GST | Not registered (deliberate — register when approaching $75k turnover) |
| Product | Retirely — retirely.money |
| Company domains | fermiware.com, fermiware.app, fermiware.com.au |
| Business email | info@fermiware.com.au (legal contact on Privacy/Terms) |
| Personal email | anthonynallen@gmail.com |

## The product

**Retirely** — budgeting and retirement planning web app for retirees and people
approaching retirement. Freemium: free tier + Premium at **$9 AUD/mo or $79 AUD/yr**.
**One Premium subscription covers the whole household** (enforced client-side,
server-side, and via database policies).

### Premium features (all live)
1. **AI monthly money report** — Reports → "✨ AI Report" tab. Claude (Anthropic API)
   writes a plain-English monthly summary from transaction data; cached one per month.
2. **Monte Carlo simulator** — "Will my money last?" on the Retirement page. 1,000
   simulated market histories, success %, percentile fan chart.
3. **Scenario Planner** (/scenarios) — unlimited what-if plans vs baseline, saved to account.
4. **Age Pension estimator** (/age-pension) — AU assets test, income test, deeming.
   ⚠️ Rates hardcoded to ~2025-26 figures — update each year.
5. **Subscription audit** (/subscriptions) — detects recurring charges, flags price rises.
6. **Household mode** (/household) — invite-code partner linking, combined money view.
   Creating/joining is free; combined view + shared premium are the paid part.
7. **Bank sync** — Plaid (US/UK/CA, live) + Basiq (AU, sandbox only — live access pending).
8. **Reports & exports** — 12-month charts, monthly/annual PDF statements, CSV export.

### Free tier
Dashboard, retirement calculator (incl. AU super), manual transactions, budgets,
savings goals, net worth, debt payoff, bills, tax estimate, leaderboard, engagement
features (streaks, health score, weekly check-in).

## Tech stack & services

| Service | Status |
|---|---|
| Vercel (hosting) | Live at retirely.money · ⚠️ **12/12 serverless functions used (Hobby limit)** — new endpoints must be consolidated into existing `[action].js` files |
| Supabase (DB + auth) | Live · all migrations run (premium features + household premium, 4 Jul 2026) |
| Anthropic (AI reports) | Live · `ANTHROPIC_API_KEY` in all Vercel envs · $20 credits purchased 6 Jul 2026 (~cents per report) |
| Stripe (payments) | **LIVE** — real subscriptions active, verified end-to-end (see below) |
| Plaid (bank sync US/UK/CA) | Live |
| Basiq (bank sync AU) | Sandbox only — live access pending from Basiq |
| Resend (email) | Live · sends from hello@retirely.money (domain verified) |

Repo: github.com/anthonyallendev/budget-app · Vite + React + Tailwind v4 + Recharts.

### Gotchas to remember
- **Never run `vercel env pull`** — it wipes local `VITE_SUPABASE_*` vars and blanks the app.
- SQL migrations live in `supabase/*.sql` — run manually in the Supabase SQL Editor.
- `hello@retirely.money` is the *sending* address (Resend); `info@fermiware.com.au` is the *receiving* contact.
- Age Pension rates (in `src/pages/AgePensionPage.jsx` → `RULES`) need a yearly refresh.
- Logo: header/favicon is the purple lightning bolt (came from the starter template —
  re-check before trademark filing). An original mark is saved at `public/retirely-mark.svg`.

## Stripe — LIVE (activated 8 July 2026)

- Live product "Retirely Premium": $9/mo + $79/yr AUD, webhook, Customer Portal
  all created and verified end-to-end (checkout session + portal session both
  tested successfully against the live API, throwaway test data cleaned up after).
- All four `STRIPE_*` env vars set on Vercel **Production**.
- ⚠️ **Known gap:** Preview environment currently has **no** Stripe env vars — they
  were accidentally wiped while switching Production to live (Vercel stored each
  var as one record spanning both environments, not per-environment). Low
  priority since Preview isn't used for Stripe testing, but if needed: get a
  fresh Stripe **test-mode** secret key and recreate test product/prices/webhook.
- Still open: enable Stripe Connect in live mode for referral cash payouts
  (no urgency — no live referral credits exist yet).

## Roadmap (in rough order)

1. **Test inbox** — confirm info@fermiware.com.au receives mail (it's the legal contact)
2. **Basiq live access** — chase Basiq support; AU bank sync is the flagship premium feature for the home market
3. **Trademark** — IP Australia (~$330/class) for "Retirely"; decide on logo (bolt is template-derived)
4. **GST registration** — only when approaching $75k turnover
5. **React Native mobile app** — after web is complete (note: engagement data currently in
   localStorage won't carry over; migrate to Supabase first)
