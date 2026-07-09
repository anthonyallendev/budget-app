# Retirely — Project Status

_Last updated: 9 July 2026_

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

## Mobile app (React Native / Expo) — IN PROGRESS

Full plan approved 9 July 2026, written to `/home/anthony/.claude/plans/witty-swinging-engelbart.md`
(also mirrored in memory — ask Claude to recall "the mobile plan" next session).

**Decisions made:**
- **Scope:** full feature parity — port all 25 web screens/features, not an MVP subset.
- **Mobile payments:** RevenueCat + native IAP (Apple/Google require this — using the
  existing Stripe checkout inside the app would very likely get Retirely rejected from
  the App Store). RevenueCat unifies Apple IAP + Google Play Billing + the existing
  Stripe subscribers into one entitlement system.
- **Repo:** new standalone `retirely-mobile` repo (sibling to `budget-app`), not a
  monorepo — the genuinely shared logic (retirementMath.js, a few hooks) is small
  enough that copy-paste-and-note-in-commit beats Turborepo/workspace tooling here.
- **Stack:** Expo + EAS Build/Submit (cloud builds, no Mac needed for iOS), Expo Router,
  NativeWind. Charting library TBD — validate on the first real chart before committing.

**Five-phase build plan** (see plan file for full detail):
0. ✅ **DONE** — migrate 18 localStorage features to Supabase (prerequisite: mobile has
   no localStorage) + dump the live DB schema into the repo.
1. Expo project scaffold — auth (email/password + Google OAuth via deep link), Supabase
   client w/ AsyncStorage, NativeWind design tokens, EAS dev builds.
2. Core free-tier screens (walking skeleton) — Dashboard, Transactions, Net Worth
   (validates chart library), Budgets, Savings Goals, Bills, Debt, Tax Estimate.
3. Premium screens + RevenueCat/IAP integration (careful, tested edit to the existing
   live `api/stripe/webhook.js` needed here — adds a `subscription_source` column so
   the Stripe and RevenueCat webhooks can't clobber each other).
4. Bank sync rewrites (Plaid → `react-native-plaid-link-sdk`, Basiq → in-app browser +
   deep link) + Leaderboard, Referral, Onboarding.
5. App store submission — EAS Build/Submit, TestFlight + Play internal testing,
   privacy disclosures, budget ≥1 rejection-and-resubmit cycle per platform.

**Estimated timeline:** ~10-12 weeks calendar time, dominated by account-approval and
app-review lead time (outside engineering's control), not by engineering speed.

### External blockers — start ASAP, independent of engineering, check status next session
| Action | Cost | Lead time |
|---|---|---|
| D-U-N-S number for Fermiware Pty Ltd (needed for Apple Developer Program as the company) | Free | Up to 5 business days |
| Apple Developer Program enrollment (as Fermiware Pty Ltd) | $99/yr | 1-2 days after D-U-N-S |
| Google Play Console registration | $25 one-time | Up to 48h |
| RevenueCat account | Free tier | Immediate |
| Apple Merchant/Banking + Tax forms (for IAP payouts — often forgotten, needed before IAP can go live) | Free | Days |

### Phase 0 — shipped 9 July 2026 (commits `ac4a75a`, `38a0d5a`)
- All 18 localStorage-only features (streaks, health score, budget limits/ratio, debt
  tracker, bills, tax estimate, interest rate widget, weekly check-ins, retirement
  profile, statement download log, dismissed milestones, transaction-review dedupe)
  migrated to Supabase (`user_feature_data` table) via a new
  `src/hooks/useMigratedFeatureData.js` hook — reads Supabase first, falls back to
  and backfills from the old localStorage key on first load, never deletes the old key.
  **Bonus for web users too**: this data now syncs across devices/browsers instead of
  being stuck on whichever one you last used.
- Coordinated fix: `src/lib/leaderboard.js` updated in the same commit to read
  `checkInStreak`/`healthScoreHistory` from Supabase — shipping the storage migration
  without this would have silently zeroed everyone's leaderboard score.
- `supabase/schema_base.sql` — full dump of the live DB schema, committed to the repo
  for the first time (previously only existed live in the Supabase dashboard).
- ⚠️ **Not fully verified end-to-end** — lint/build/unauthenticated-route smoke test
  all clean, but a full logged-in test (sign up → set a value → reload → confirm
  persistence) wasn't completed because this Supabase project requires email
  confirmation on signup and Claude doesn't have the service-role key needed to
  pre-confirm a throwaway account. **Please do a quick manual spot-check when you get
  a chance**: log in, set a budget limit or add a bill, hard-refresh, confirm it's
  still there.

### Next session: start Phase 1 (Expo scaffold)
Before diving in, check: has the D-U-N-S number request gone in? Any word back from
Apple/Google/RevenueCat signups? None of that blocks starting Phase 1 engineering, but
it's the long pole for the whole project, so worth having in flight in parallel.

## Roadmap (in rough order)

1. **Test inbox** — confirm info@fermiware.com.au receives mail (it's the legal contact)
2. **Basiq live access** — chase Basiq support; AU bank sync is the flagship premium feature for the home market
3. **Trademark** — IP Australia (~$330/class) for "Retirely"; decide on logo (bolt is template-derived)
4. **GST registration** — only when approaching $75k turnover
5. **Mobile app** — see "Mobile app" section above; Phase 0 done, Phase 1 (Expo scaffold) next
