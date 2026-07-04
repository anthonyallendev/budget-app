import { useMemo } from 'react'
import AppLayout from '../components/AppLayout'
import PremiumGate from '../components/PremiumGate'
import { useProfile } from '../hooks/useProfile'
import { useFeatureData } from '../hooks/useFeatureData'

// ── Age Pension rules (approximate, as at the 2025-26 financial year) ────────
// Sources: Services Australia published rates. These are indexed several times
// a year, so figures are estimates — the page carries a prominent disclaimer.
const RULES = {
  qualifyingAge: 67,
  // Maximum fortnightly payment incl. pension & energy supplements
  maxRate: { single: 1178.70, coupleEach: 888.50 },
  // Assets test free areas
  assetsFree: {
    single: { homeowner: 321_500, nonHomeowner: 579_500 },
    couple: { homeowner: 481_500, nonHomeowner: 739_500 },
  },
  assetsTaperPer1000: 3.0,          // $/fortnight reduction per $1,000 over
  // Income test
  incomeFree: { single: 218, couple: 380 },  // $/fortnight
  incomeTaper: 0.5,                  // combined 50c per $ over
  // Deeming (financial assets → deemed income)
  deemThreshold: { single: 64_200, couple: 106_200 },
  deemLow: 0.0075,
  deemHigh: 0.0275,
}

function calcPension({ relationship, homeowner, financialAssets, otherAssets, otherIncomeFn, age }) {
  const isCouple = relationship === 'couple'
  const maxFn = isCouple ? RULES.maxRate.coupleEach * 2 : RULES.maxRate.single

  if (age && age < RULES.qualifyingAge) {
    return { eligibleAge: false, maxFn, pensionFn: 0 }
  }

  // Assets test
  const totalAssets = financialAssets + otherAssets
  const freeArea = RULES.assetsFree[isCouple ? 'couple' : 'single'][homeowner ? 'homeowner' : 'nonHomeowner']
  const assetsOver = Math.max(0, totalAssets - freeArea)
  const assetsReduction = (assetsOver / 1000) * RULES.assetsTaperPer1000
  const assetsTestFn = Math.max(0, maxFn - assetsReduction)

  // Income test (deemed income on financial assets + other income)
  const deemThresh = RULES.deemThreshold[isCouple ? 'couple' : 'single']
  const deemedAnnual = Math.min(financialAssets, deemThresh) * RULES.deemLow +
    Math.max(0, financialAssets - deemThresh) * RULES.deemHigh
  const deemedFn = deemedAnnual / 26
  const totalIncomeFn = deemedFn + otherIncomeFn
  const incomeFreeArea = RULES.incomeFree[isCouple ? 'couple' : 'single']
  const incomeReduction = Math.max(0, totalIncomeFn - incomeFreeArea) * RULES.incomeTaper
  const incomeTestFn = Math.max(0, maxFn - incomeReduction)

  // Whichever test produces the LOWER pension applies
  const pensionFn = Math.min(assetsTestFn, incomeTestFn)
  const bindingTest = assetsTestFn <= incomeTestFn ? 'assets' : 'income'

  // Cut-off points (where pension hits zero)
  const assetsCutOff = freeArea + (maxFn / RULES.assetsTaperPer1000) * 1000
  const incomeCutOffFn = incomeFreeArea + maxFn / RULES.incomeTaper

  return {
    eligibleAge: true,
    maxFn, pensionFn, assetsTestFn, incomeTestFn, bindingTest,
    totalAssets, freeArea, deemedFn, totalIncomeFn,
    assetsCutOff, incomeCutOffFn,
  }
}

function getAge(dob) {
  if (!dob) return null
  const today = new Date(), birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const inputStyle = { background: 'rgba(6,11,26,0.8)', border: '1px solid rgba(0,212,255,0.18)' }
const fmt = n => `$${Math.round(n).toLocaleString()}`

function Toggle({ options, value, onChange }) {
  return (
    <div className="flex gap-1">
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
          style={value === o.value
            ? { background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.4)', color: '#00d4ff' }
            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

const DEFAULT_INPUTS = {
  relationship: 'single',
  homeowner: true,
  financialAssets: 0,
  otherAssets: 0,
  otherIncomeFn: 0,
}

function EstimatorBody({ profile }) {
  const { data: inputs, save } = useFeatureData('age_pension', DEFAULT_INPUTS)
  const form = { ...DEFAULT_INPUTS, ...inputs }
  const age = getAge(profile?.date_of_birth)

  const result = useMemo(() => calcPension({ ...form, age }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(form), age])

  const set = (key, val) => save({ ...form, [key]: val })
  const yearsToGo = age ? Math.max(0, RULES.qualifyingAge - age) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Inputs */}
      <div className="glass rounded-2xl p-5 flex flex-col gap-4" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
        <p className="text-slate-500 text-xs uppercase tracking-widest">Your situation</p>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 text-xs">Relationship status</label>
          <Toggle value={form.relationship} onChange={v => set('relationship', v)}
            options={[{ value: 'single', label: 'Single' }, { value: 'couple', label: 'Couple (combined)' }]} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 text-xs">Do you own your home?</label>
          <Toggle value={form.homeowner} onChange={v => set('homeowner', v)}
            options={[{ value: true, label: 'Homeowner' }, { value: false, label: 'Non-homeowner' }]} />
          <p className="text-slate-600 text-xs">Your home itself is not counted in the assets test.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 text-xs">Financial assets ($)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input type="number" min="0" value={form.financialAssets || ''} placeholder="Super, savings, shares"
              onChange={e => set('financialAssets', Number(e.target.value) || 0)}
              className="w-full rounded-lg pl-7 pr-3 py-2.5 text-white text-sm outline-none" style={inputStyle} />
          </div>
          <p className="text-slate-600 text-xs">Super (once you reach pension age), bank accounts, shares, managed funds. Deemed to earn income.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 text-xs">Other assets ($)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input type="number" min="0" value={form.otherAssets || ''} placeholder="Car, caravan, contents, investment property"
              onChange={e => set('otherAssets', Number(e.target.value) || 0)}
              className="w-full rounded-lg pl-7 pr-3 py-2.5 text-white text-sm outline-none" style={inputStyle} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 text-xs">Other income ($ per fortnight)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input type="number" min="0" value={form.otherIncomeFn || ''} placeholder="Rent, wages, overseas pension"
              onChange={e => set('otherIncomeFn', Number(e.target.value) || 0)}
              className="w-full rounded-lg pl-7 pr-3 py-2.5 text-white text-sm outline-none" style={inputStyle} />
          </div>
          <p className="text-slate-600 text-xs">Don't include income from financial assets — that's estimated automatically via deeming.</p>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="glass rounded-2xl p-6 text-center" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Estimated Age Pension</p>
          <p className="text-5xl font-bold leading-none text-gradient">
            {fmt(result.pensionFn)}<span className="text-2xl text-slate-400 font-semibold">/fortnight</span>
          </p>
          <p className="text-slate-400 text-sm mt-3">
            ≈ {fmt(result.pensionFn * 26)} per year{form.relationship === 'couple' ? ' (combined)' : ''}
            {result.pensionFn > 0 && result.pensionFn >= result.maxFn - 0.01 && ' — the full pension'}
          </p>
          {age !== null && yearsToGo > 0 && (
            <p className="text-xs mt-2" style={{ color: '#f59e0b' }}>
              You're {age} — Age Pension starts at {RULES.qualifyingAge}, so this is what you'd get in ~{yearsToGo} year{yearsToGo !== 1 ? 's' : ''} under today's rules.
            </p>
          )}
        </div>

        {result.pensionFn === 0 && result.eligibleAge && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
            <p className="text-red-300 text-xs font-medium">Above the cut-off under today's rules</p>
            <p className="text-slate-400 text-xs mt-1">
              The pension reaches zero at roughly {fmt(result.assetsCutOff)} in assessable assets
              (or {fmt(result.incomeCutOffFn)}/fortnight income). As you draw down savings in retirement,
              you may become eligible later — many retirees do.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5" style={{ borderColor: result.bindingTest === 'assets' ? 'rgba(224,64,251,0.3)' : 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold text-sm">Assets test</p>
              {result.bindingTest === 'assets' && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(224,64,251,0.12)', color: '#e040fb' }}>applies to you</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Assessable assets</span><span className="text-white font-semibold">{fmt(result.totalAssets)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Free area</span><span className="text-white font-semibold">{fmt(result.freeArea)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Pension under this test</span><span className="font-semibold" style={{ color: '#e040fb' }}>{fmt(result.assetsTestFn)}/fn</span></div>
            </div>
          </div>
          <div className="glass rounded-2xl p-5" style={{ borderColor: result.bindingTest === 'income' ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold text-sm">Income test</p>
              {result.bindingTest === 'income' && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff' }}>applies to you</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Deemed income</span><span className="text-white font-semibold">{fmt(result.deemedFn)}/fn</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total assessed income</span><span className="text-white font-semibold">{fmt(result.totalIncomeFn)}/fn</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Pension under this test</span><span className="font-semibold" style={{ color: '#00d4ff' }}>{fmt(result.incomeTestFn)}/fn</span></div>
            </div>
          </div>
        </div>

        <div className="rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          ⚠️ Estimate only, based on approximate 2025–26 rates that Services Australia indexes several times a year.
          It doesn't cover every situation (gifting rules, income streams, overseas pensions, transitional rates).
          Check your actual entitlement at servicesaustralia.gov.au or with a financial adviser. This is not financial advice.
        </div>
      </div>
    </div>
  )
}

export default function AgePensionPage() {
  const { profile, loading } = useProfile()
  const isPremium = profile?.subscription_status === 'premium'

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-1">Age Pension Estimator</h1>
      <p className="text-slate-400 text-sm mb-8">Estimate your Centrelink Age Pension under the assets and income tests (Australia).</p>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-500">Loading…</div>
      ) : isPremium ? (
        <EstimatorBody profile={profile} />
      ) : (
        <PremiumGate
          feature="the Age Pension estimator"
          description="See how much Age Pension you could get — the assets test, income test and deeming rules worked out for you, with your inputs saved to your account.">
          <EstimatorBody profile={profile} />
        </PremiumGate>
      )}
    </AppLayout>
  )
}
