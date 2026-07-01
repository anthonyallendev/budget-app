import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import AppLayout from '../components/AppLayout'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

const COUNTRIES = [
  { name: 'Australia',      preservationAge: 60 },
  { name: 'United States',  preservationAge: 65 },
  { name: 'United Kingdom', preservationAge: 57 },
  { name: 'Canada',         preservationAge: 65 },
  { name: 'New Zealand',    preservationAge: 65 },
  { name: 'Germany',        preservationAge: 67 },
  { name: 'France',         preservationAge: 62 },
  { name: 'Singapore',      preservationAge: 63 },
  { name: 'Other',          preservationAge: 65 },
]

const RATE_LABELS = { 4: 'Conservative', 7: 'Moderate', 10: 'Aggressive' }
const RATE_VALUES = [4, 7, 10]

function getAge(dob) {
  if (!dob) return null
  const today = new Date()
  const birth  = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function projectSavings(currentSavings, monthlyContribution, annualRate, years) {
  const r = annualRate / 100
  const n = years * 12
  const monthlyRate = r / 12
  if (monthlyRate === 0) return currentSavings + monthlyContribution * n
  const fv = currentSavings * Math.pow(1 + r, years) +
    monthlyContribution * (Math.pow(1 + monthlyRate, n) - 1) / monthlyRate
  return Math.max(0, fv)
}

// Finds the earliest age where savings cover the income gap until preservation age.
// Iterates year by year: "at age R, can my savings sustain desiredAnnualIncome
// until preservation age, accounting for ongoing investment returns?"
function calcEarlyRetirementAge(currentAge, preservationAge, currentSavings, monthlyContrib, annualRate, desiredAnnualIncome) {
  if (!desiredAnnualIncome) return null
  const r = annualRate / 100

  for (let age = currentAge; age <= preservationAge; age++) {
    const savingsAtAge = projectSavings(currentSavings, monthlyContrib, annualRate, age - currentAge)
    const gapYears     = preservationAge - age

    if (gapYears === 0) return age  // reaching preservation age — super covers everything

    // How much is needed as a lump sum to pay desiredAnnualIncome for gapYears,
    // while the remaining balance still earns returns (present value of annuity)
    const required = r === 0
      ? desiredAnnualIncome * gapYears
      : desiredAnnualIncome * (1 - Math.pow(1 + r, -gapYears)) / r

    if (savingsAtAge >= required) return age
  }

  return preservationAge
}

// Builds chart data showing both phases:
// 1. Accumulation: savings grow while working (currentAge → retirementAge)
// 2. Drawdown: savings decline while living off them (retirementAge → preservationAge)
function buildChartData(currentAge, retirementAge, preservationAge, currentSavings, monthlyContrib, rate, desiredAnnualIncome) {
  if (!currentAge) return []
  const data = []
  const r = rate / 100

  const hasDrawdown = retirementAge && retirementAge < preservationAge && desiredAnnualIncome

  // Phase 1 — accumulation
  const endAge = retirementAge ?? preservationAge
  for (let age = currentAge; age <= endAge; age++) {
    const val = Math.round(projectSavings(currentSavings, monthlyContrib, rate, age - currentAge))
    data.push({
      age,
      accumulation: val,
      // share the peak point with drawdown so the two lines connect
      drawdown: (hasDrawdown && age === endAge) ? val : null,
    })
  }

  // Phase 2 — drawdown (only if retiring before preservation age)
  if (hasDrawdown) {
    const bal0     = projectSavings(currentSavings, monthlyContrib, rate, retirementAge - currentAge)
    const gapYears = preservationAge - retirementAge
    // Use the withdrawal rate that exactly exhausts savings at preservation age,
    // so the chart always reaches zero — the user's desired income determined
    // the retirement age; this ensures the line visually closes correctly.
    const annualWithdrawal = r === 0
      ? bal0 / gapYears
      : bal0 * r / (1 - Math.pow(1 + r, -gapYears))
    let bal = bal0
    for (let age = retirementAge + 1; age <= preservationAge; age++) {
      bal = bal * (1 + r) - annualWithdrawal
      data.push({
        age,
        accumulation: null,
        drawdown: Math.max(0, Math.round(bal)),
      })
    }
  }

  return data
}

function getBudgetRatio() {
  try { return JSON.parse(localStorage.getItem('budgetRatio')) || null }
  catch { return null }
}

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`
  return `$${Math.round(n).toLocaleString()}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm" style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
      <p className="text-slate-400 mb-1">Age {label}</p>
      <p className="font-bold text-cyan-400">{fmt(payload[0]?.value ?? 0)}</p>
    </div>
  )
}

const inputStyle = {
  background: 'linear-gradient(rgba(6,11,26,0.8),rgba(6,11,26,0.8)) padding-box,linear-gradient(135deg,#00d4ff,#7c3aed,#e040fb) border-box',
  border: '1px solid transparent',
}
const focusGlow = e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'
const blurGlow  = e => e.target.style.boxShadow = 'none'

export default function RetirementPage() {
  const { profile, loading: profileLoading, saveProfile } = useProfile()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  // tracks whether the user has manually edited the monthly contribution
  const contribOverridden = useRef(false)

  const [form, setForm] = useState({
    annual_salary:         0,
    personal_savings:      0,
    monthly_contribution:  0,
    interest_rate:         7,
    desired_annual_income: 0,
    life_expectancy:       85,
  })

  // Load profile into form once
  useEffect(() => {
    if (profile) {
      contribOverridden.current = false
      setForm({
        annual_salary:         profile.annual_salary         ?? 0,
        personal_savings:      profile.personal_savings      ?? 0,
        monthly_contribution:  profile.monthly_contribution  ?? 0,
        interest_rate:         profile.interest_rate         ?? 7,
        desired_annual_income: profile.desired_annual_income ?? 0,
        life_expectancy:       profile.life_expectancy       ?? 85,
      })
    }
  }, [profile])

  // Budget ratio from the Budget Targets slider
  const budgetRatio    = getBudgetRatio()
  const savingsPct     = budgetRatio?.savings ?? null
  const annualSalary   = Number(form.annual_salary)
  const autoMonthly    = savingsPct && annualSalary > 0
    ? Math.round((annualSalary / 12) * (savingsPct / 100))
    : null

  // When auto value changes and user hasn't manually overridden, apply it
  useEffect(() => {
    if (!contribOverridden.current && autoMonthly !== null) {
      setForm(f => ({ ...f, monthly_contribution: autoMonthly }))
    }
  }, [autoMonthly])

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function handleContribChange(val) {
    contribOverridden.current = true
    set('monthly_contribution', val)
  }

  function resetContrib() {
    contribOverridden.current = false
    if (autoMonthly !== null) set('monthly_contribution', autoMonthly)
  }

  async function handleSave() {
    setSaving(true)
    await saveProfile(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Derived values
  const currentAge      = getAge(profile?.date_of_birth)
  const country         = COUNTRIES.find(c => c.name === profile?.country) || COUNTRIES[0]
  const preservationAge = country.preservationAge
  const desiredIncome   = Number(form.desired_annual_income)
  const rate            = Number(form.interest_rate)

  // Iterate year-by-year to find the earliest age savings cover the income gap
  const earlyRetireAge  = currentAge
    ? calcEarlyRetirementAge(currentAge, preservationAge, Number(form.personal_savings), Number(form.monthly_contribution), rate, desiredIncome)
    : null
  const yearsEarly      = earlyRetireAge !== null ? preservationAge - earlyRetireAge : 0

  // Savings at the actual retirement age (not preservation age)
  const savingsAtRetirement = earlyRetireAge !== null
    ? projectSavings(Number(form.personal_savings), Number(form.monthly_contribution), rate, earlyRetireAge - currentAge)
    : 0

  const superBalance   = Number(profile?.super_balance ?? 0)
  const yearsToPreserv = currentAge ? Math.max(preservationAge - currentAge, 0) : 0
  const superAtPreserv = projectSavings(superBalance, 0, rate, yearsToPreserv)
  const superYears     = Math.max(form.life_expectancy - preservationAge, 1)
  const superPerYear   = superAtPreserv / superYears

  const chartData = buildChartData(
    currentAge, earlyRetireAge, preservationAge,
    Number(form.personal_savings), Number(form.monthly_contribution),
    rate, desiredIncome,
  )

  const rateIndex = RATE_VALUES.indexOf(Number(form.interest_rate))
  const isAutoContrib = autoMonthly !== null && !contribOverridden.current

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading…</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-1">Retirement Calculator</h1>
      <p className="text-slate-400 text-sm mb-8">See how your savings can unlock early retirement.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Inputs column ── */}
        <div className="flex flex-col gap-4">

          {/* Profile summary */}
          {currentAge && (
            <div className="glass rounded-2xl p-5" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Your profile</p>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current age</span>
                  <span className="text-white font-semibold">{currentAge}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Country</span>
                  <span className="text-white font-semibold">{profile?.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Preservation age</span>
                  <span className="text-cyan-400 font-semibold">{preservationAge}</span>
                </div>
                {superBalance > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Super balance</span>
                    <span className="text-white font-semibold">{fmt(superBalance)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personal savings inputs */}
          <div className="glass rounded-2xl p-5 flex flex-col gap-4" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
            <p className="text-slate-500 text-xs uppercase tracking-widest">Personal savings</p>

            {/* Annual salary */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs">Annual salary ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input type="number" min="0" placeholder="e.g. 100000"
                  value={form.annual_salary || ''}
                  onChange={e => set('annual_salary', e.target.value)}
                  className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                  style={inputStyle} onFocus={focusGlow} onBlur={blurGlow}
                />
              </div>
            </div>

            {/* Current savings */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs">Current savings / investments ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input type="number" min="0" placeholder="0"
                  value={form.personal_savings || ''}
                  onChange={e => set('personal_savings', e.target.value)}
                  className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                  style={inputStyle} onFocus={focusGlow} onBlur={blurGlow}
                />
              </div>
            </div>

            {/* Monthly contribution — auto or manual */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 text-xs">Monthly contribution ($)</label>
                {isAutoContrib && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.25)' }}>
                    Auto
                  </span>
                )}
                {contribOverridden.current && autoMonthly !== null && (
                  <button onClick={resetContrib}
                    className="text-xs text-slate-500 hover:text-cyan-400 transition-colors underline">
                    Reset to auto
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input type="number" min="0" placeholder="0"
                  value={form.monthly_contribution || ''}
                  onChange={e => handleContribChange(e.target.value)}
                  className="w-full rounded-lg pl-7 pr-4 py-2.5 text-sm outline-none"
                  style={{
                    ...inputStyle,
                    color: isAutoContrib ? '#00d4ff' : 'white',
                    borderColor: isAutoContrib ? 'rgba(0,212,255,0.35)' : 'rgba(0,212,255,0.15)',
                  }}
                  onFocus={focusGlow} onBlur={blurGlow}
                />
              </div>
              {/* Source explanation */}
              {isAutoContrib && savingsPct !== null && annualSalary > 0 && (
                <p className="text-xs" style={{ color: 'rgba(0,212,255,0.6)' }}>
                  {fmt(annualSalary)}/yr × {savingsPct}% savings target ÷ 12 months
                </p>
              )}
              {!savingsPct && (
                <p className="text-slate-600 text-xs">
                  Set a savings % on <Link to="/budget-targets" className="text-cyan-400/60 hover:text-cyan-400">Budget Targets</Link> to auto-calculate this.
                </p>
              )}
              {savingsPct && !annualSalary && (
                <p className="text-slate-600 text-xs">
                  Enter your annual salary above to auto-calculate from your {savingsPct}% savings target.
                </p>
              )}
            </div>

            {/* Interest rate slider */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-slate-400 text-xs">Expected return rate</label>
                <span className="text-cyan-400 text-sm font-bold">
                  {RATE_LABELS[form.interest_rate]} — {form.interest_rate}%
                </span>
              </div>
              <input
                type="range" min="0" max="2" step="1"
                value={rateIndex < 0 ? 1 : rateIndex}
                onChange={e => set('interest_rate', RATE_VALUES[e.target.value])}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-600">
                <span>Conservative 4%</span>
                <span>Moderate 7%</span>
                <span>Aggressive 10%</span>
              </div>
            </div>
          </div>

          {/* Retirement income */}
          <div className="glass rounded-2xl p-5 flex flex-col gap-4" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
            <p className="text-slate-500 text-xs uppercase tracking-widest">Retirement income</p>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs">Desired annual income in retirement ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input type="number" min="0" placeholder="0"
                  value={form.desired_annual_income || ''}
                  onChange={e => set('desired_annual_income', e.target.value)}
                  className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                  style={inputStyle} onFocus={focusGlow} onBlur={blurGlow}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-400 text-xs">Life expectancy</label>
                <span className="text-purple-400 text-sm font-bold">{form.life_expectancy} years</span>
              </div>
              <input
                type="range" min="75" max="100" step="5"
                value={form.life_expectancy}
                onChange={e => set('life_expectancy', Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-600">
                <span>75</span><span>80</span><span>85</span><span>90</span><span>95</span><span>100</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="py-3 rounded-xl font-semibold text-white text-sm transition-all duration-300 hover:scale-[1.02] hover:glow-cyan disabled:opacity-50"
            style={{ background: saved ? 'linear-gradient(135deg, #00d4ff, #00b894)' : 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
          </button>
        </div>

        {/* ── Results column ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Hero result cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center text-center"
              style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">You can retire at</p>
              {earlyRetireAge !== null ? (
                <>
                  <p className="text-6xl font-bold leading-none text-gradient">{earlyRetireAge}</p>
                  <p className="text-sm mt-3 font-semibold"
                    style={{ color: yearsEarly > 0 ? '#00d4ff' : yearsEarly < 0 ? '#e040fb' : '#94a3b8' }}>
                    {yearsEarly > 0
                      ? `${yearsEarly} year${yearsEarly !== 1 ? 's' : ''} early`
                      : yearsEarly < 0
                      ? `${Math.abs(yearsEarly)} year${Math.abs(yearsEarly) !== 1 ? 's' : ''} after preservation age`
                      : 'At preservation age'}
                  </p>
                  <p className="text-slate-600 text-xs mt-1">Preservation age: {preservationAge}</p>
                </>
              ) : (
                <p className="text-5xl font-bold text-slate-700">—</p>
              )}
            </div>

            <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center text-center"
              style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">
                Savings at retirement
              </p>
              <p className="text-4xl font-bold leading-none" style={{ color: '#7c3aed', textShadow: '0 0 20px rgba(124,58,237,0.5)' }}>
                {savingsAtRetirement > 0 ? fmt(savingsAtRetirement) : '—'}
              </p>
              {savingsAtRetirement > 0 && desiredIncome > 0 && earlyRetireAge !== null && (
                <p className="text-slate-400 text-xs mt-3">
                  Funds {fmt(desiredIncome)}/yr until age {preservationAge}
                </p>
              )}
            </div>
          </div>

          {/* Super summary */}
          {superBalance > 0 && (
            <div className="glass rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4"
              style={{ borderColor: 'rgba(224,64,251,0.15)' }}>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Super / pension fund</p>
                <p className="text-white font-semibold">
                  Projected value at {preservationAge}: <span style={{ color: '#e040fb' }}>{fmt(superAtPreserv)}</span>
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Provides approximately <span className="text-white font-semibold">{fmt(superPerYear)}/year</span> from age {preservationAge} to {form.life_expectancy}
                </p>
              </div>
              <div className="text-4xl">🏦</div>
            </div>
          )}

          {/* Projection chart */}
          <div className="glass rounded-2xl p-6" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-white font-semibold mb-1">Savings projection</h2>
                <p className="text-slate-500 text-xs">
                  Age {currentAge ?? '—'} → {preservationAge} at {form.interest_rate}% p.a.
                  {isAutoContrib && savingsPct && (
                    <span style={{ color: 'rgba(0,212,255,0.6)' }}> · {savingsPct}% of salary</span>
                  )}
                </p>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded inline-block bg-cyan-400" />
                  Saving
                </span>
                {earlyRetireAge && earlyRetireAge < preservationAge && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 rounded inline-block" style={{ background: '#e040fb' }} />
                    Drawing down
                  </span>
                )}
              </div>
            </div>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 16 }}>
                  <defs>
                    <linearGradient id="gradAccum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="gradDraw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#e040fb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#e040fb" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="age" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false}
                    label={{ value: 'Age', position: 'insideBottom', offset: -8, fill: '#00d4ff', fontSize: 13 }} />
                  <YAxis tickFormatter={v => fmt(v)} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  {earlyRetireAge && earlyRetireAge < preservationAge && (
                    <ReferenceLine x={earlyRetireAge} stroke="#e040fb" strokeDasharray="4 4" />
                  )}
                  <Area type="monotone" dataKey="accumulation" name="Savings" stroke="#00d4ff" strokeWidth={2} fill="url(#gradAccum)" dot={false} connectNulls={false} />
                  <Area type="monotone" dataKey="drawdown" name="Drawdown" stroke="#e040fb" strokeWidth={2} fill="url(#gradDraw)" dot={false} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
                Enter your savings details to see the projection
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
