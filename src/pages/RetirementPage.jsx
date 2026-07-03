import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import AppLayout from '../components/AppLayout'
import RetirementReadinessScore from '../components/RetirementReadinessScore'
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

function buildSuperChartData(currentAge, preservationAge, lifeExpectancy, balance, monthlyContrib, rate, annualIncome) {
  if (!currentAge || currentAge >= preservationAge) return []
  const data = []

  // Accumulation phase
  for (let age = currentAge; age <= preservationAge; age++) {
    const val = Math.round(projectSavings(balance, monthlyContrib, rate, age - currentAge))
    data.push({
      age,
      accumulation: val,
      drawdown: age === preservationAge ? val : null,
    })
  }

  // Drawdown phase
  if (annualIncome > 0) {
    const r = rate / 100
    const bal0 = Math.round(projectSavings(balance, monthlyContrib, rate, preservationAge - currentAge))
    let bal = bal0
    const maxAge = Math.max(lifeExpectancy, preservationAge + 1)
    for (let age = preservationAge + 1; age <= maxAge; age++) {
      bal = bal * (1 + r) - annualIncome
      if (bal <= 0) {
        data.push({ age, accumulation: null, drawdown: 0 })
        break
      }
      data.push({ age, accumulation: null, drawdown: Math.round(bal) })
    }
  }

  return data
}

function superRunsOutAge(preservationAge, balance, rate, annualIncome) {
  if (!annualIncome || annualIncome <= 0 || balance <= 0) return null
  const r = rate / 100
  let bal = balance
  for (let yr = 0; yr < 80; yr++) {
    bal = bal * (1 + r) - annualIncome
    if (bal <= 0) return preservationAge + yr + 1
  }
  return null
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
  background: 'rgba(6,11,26,0.8)',
  border: '1px solid rgba(0,212,255,0.18)',
}
const focusGlow = e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'
const blurGlow  = e => e.target.style.boxShadow = 'none'

export default function RetirementPage() {
  const { profile, loading: profileLoading, saveProfile } = useProfile()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [superForm, setSuperForm] = useState({ voluntaryContrib: 0, fundFeePercent: 0.5 })
  // tracks whether the user has manually edited the monthly contribution
  const contribOverridden = useRef(false)

  const [form, setForm] = useState({
    annual_salary:         0,
    personal_savings:      0,
    monthly_contribution:  0,
    interest_rate:         7,
    desired_annual_income: 0,
    life_expectancy:       85,
    super_balance:         0,
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
        super_balance:         profile.super_balance         ?? 0,
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

  const superBalance      = Number(form.super_balance ?? 0)
  const yearsToPreserv    = currentAge ? Math.max(preservationAge - currentAge, 0) : 0
  const isAustralia       = profile?.country === 'Australia'
  const sgcRate           = 0.12
  const sgcMonthly        = isAustralia && annualSalary > 0 ? Math.round((annualSalary * sgcRate) / 12) : 0
  const voluntaryMonthly  = Number(superForm.voluntaryContrib)
  const totalSuperMonthly = sgcMonthly + voluntaryMonthly
  const netSuperRate      = Math.max(0, rate - Number(superForm.fundFeePercent))
  const superAtPreserv    = projectSavings(superBalance, totalSuperMonthly, netSuperRate, yearsToPreserv)
  const superYears        = Math.max(form.life_expectancy - preservationAge, 1)
  const superPerYear      = desiredIncome > 0 ? desiredIncome : superAtPreserv / superYears

  // Super breakdown metrics
  const totalSGCContribs  = sgcMonthly * 12 * yearsToPreserv
  const totalVolContribs  = voluntaryMonthly * 12 * yearsToPreserv
  const totalContribs     = totalSGCContribs + totalVolContribs
  const investGrowth      = Math.max(0, superAtPreserv - superBalance - totalContribs)
  const superExhaustedAge = superRunsOutAge(preservationAge, superAtPreserv, netSuperRate, superPerYear)
  const superChartData    = isAustralia
    ? buildSuperChartData(currentAge, preservationAge, form.life_expectancy, superBalance, totalSuperMonthly, netSuperRate, superPerYear)
    : []

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

      <RetirementReadinessScore
        annualSalary={Number(form.annual_salary)}
        personalSavings={Number(form.personal_savings)}
        monthlyContrib={Number(form.monthly_contribution)}
        desiredIncome={Number(form.desired_annual_income)}
        currentAge={currentAge}
        preservationAge={preservationAge}
        earlyRetireAge={earlyRetireAge}
      />

      <div className="flex flex-col gap-8">

        {/* ── Section 1: Personal savings inputs + savings projection ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: profile + savings inputs */}
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
          </div>

          {/* Right: hero result cards + savings projection chart */}
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
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Savings at retirement</p>
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

            {/* Savings projection chart */}
            <div className="glass rounded-2xl p-6 flex-1" style={{ borderColor: 'rgba(0,212,255,0.1)' }}>
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

        {/* ── Section 2: Retirement income + super inputs alongside super projection ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: retirement income + super inputs + save */}
          <div className="flex flex-col gap-4">

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

            {/* Superannuation inputs — AU only */}
            {isAustralia && (
              <div className="glass rounded-2xl p-5 flex flex-col gap-4" style={{ borderColor: 'rgba(224,64,251,0.15)' }}>
                <p className="text-slate-500 text-xs uppercase tracking-widest">Super fund</p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs">Current super balance ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <input type="number" min="0" placeholder="0"
                      value={form.super_balance || ''}
                      onChange={e => set('super_balance', e.target.value)}
                      className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                      style={inputStyle} onFocus={focusGlow} onBlur={blurGlow}
                    />
                  </div>
                </div>

                {sgcMonthly > 0 && (
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg text-xs"
                    style={{ background: 'rgba(224,64,251,0.06)', border: '1px solid rgba(224,64,251,0.15)' }}>
                    <span className="text-slate-400">Employer SGC (12% of salary)</span>
                    <span className="font-semibold" style={{ color: '#e040fb' }}>${sgcMonthly.toLocaleString()}/mo</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs">Personal voluntary contribution ($/mo)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <input type="number" min="0" placeholder="0"
                      value={superForm.voluntaryContrib || ''}
                      onChange={e => setSuperForm(f => ({ ...f, voluntaryContrib: e.target.value }))}
                      className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                      style={inputStyle} onFocus={focusGlow} onBlur={blurGlow}
                    />
                  </div>
                  <p className="text-slate-600 text-xs">Concessional cap: $30,000/yr (incl. SGC)</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs">Annual fund fee (%)</label>
                  <div className="relative">
                    <input type="number" min="0" max="5" step="0.1" placeholder="0.5"
                      value={superForm.fundFeePercent || ''}
                      onChange={e => setSuperForm(f => ({ ...f, fundFeePercent: e.target.value }))}
                      className="w-full rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                      style={inputStyle} onFocus={focusGlow} onBlur={blurGlow}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                  </div>
                  <p className="text-slate-600 text-xs">Typical industry fund: 0.5–1.5%</p>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="py-3 rounded-xl font-semibold text-white text-sm transition-all duration-300 hover:scale-[1.02] hover:glow-cyan disabled:opacity-50"
              style={{ background: saved ? 'linear-gradient(135deg, #00d4ff, #00b894)' : 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
            </button>
          </div>

          {/* Right: super projection section */}
          <div className="lg:col-span-2">
            {isAustralia && (superBalance > 0 || sgcMonthly > 0) && (
              <div className="glass rounded-2xl p-6 flex flex-col gap-6 h-full" style={{ borderColor: 'rgba(224,64,251,0.18)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-white font-semibold">Super fund projection</h2>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Age {currentAge} → {preservationAge} (preservation) · {netSuperRate}% net return
                    </p>
                  </div>
                  <span className="text-2xl">🏦</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Current balance', value: fmt(superBalance), color: '#94a3b8' },
                    { label: `At age ${preservationAge}`, value: fmt(superAtPreserv), color: '#e040fb' },
                    { label: 'Annual income', value: `${fmt(superPerYear)}/yr`, color: '#7c3aed' },
                    {
                      label: superExhaustedAge ? 'Lasts until age' : 'Never runs out',
                      value: superExhaustedAge ? String(superExhaustedAge) : '∞',
                      color: superExhaustedAge && superExhaustedAge < form.life_expectancy ? '#f43f5e' : '#00d4ff',
                    },
                  ].map(m => (
                    <div key={m.label} className="rounded-xl p-3 text-center"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-slate-500 text-xs mb-1.5 leading-tight">{m.label}</p>
                      <p className="font-bold text-lg leading-none" style={{ color: m.color }}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {superChartData.length > 1 && (
                  <>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 rounded inline-block" style={{ background: '#e040fb' }} />
                        Accumulation
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 rounded inline-block" style={{ background: '#7c3aed' }} />
                        Drawdown
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={superChartData} margin={{ top: 8, right: 10, left: 0, bottom: 16 }}>
                        <defs>
                          <linearGradient id="gradSuper" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#e040fb" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#e040fb" stopOpacity={0}    />
                          </linearGradient>
                          <linearGradient id="gradSuperDraw" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="age" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                          label={{ value: 'Age', position: 'insideBottom', offset: -8, fill: '#e040fb', fontSize: 12 }} />
                        <YAxis tickFormatter={v => fmt(v)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={58} />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine x={preservationAge} stroke="#e040fb" strokeDasharray="4 4"
                          label={{ value: `Age ${preservationAge}`, position: 'top', fill: '#e040fb', fontSize: 10 }} />
                        <Area type="monotone" dataKey="accumulation" name="Super balance" stroke="#e040fb" strokeWidth={2} fill="url(#gradSuper)" dot={false} connectNulls={false} />
                        <Area type="monotone" dataKey="drawdown" name="Drawdown" stroke="#7c3aed" strokeWidth={2} fill="url(#gradSuperDraw)" dot={false} connectNulls={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                )}

                {yearsToPreserv > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-slate-500 text-xs uppercase tracking-wider">How {fmt(superAtPreserv)} is made up</p>
                    {[
                      { label: 'Starting balance', value: superBalance, color: '#64748b' },
                      { label: `Employer SGC (${yearsToPreserv} yrs)`, value: totalSGCContribs, color: '#e040fb' },
                      ...(totalVolContribs > 0 ? [{ label: 'Your contributions', value: totalVolContribs, color: '#a78bfa' }] : []),
                      { label: 'Investment growth', value: investGrowth, color: '#00d4ff' },
                    ].map(row => {
                      const pct = superAtPreserv > 0 ? (row.value / superAtPreserv) * 100 : 0
                      return (
                        <div key={row.label}>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-400 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full inline-block" style={{ background: row.color }} />
                              {row.label}
                            </span>
                            <span className="font-semibold" style={{ color: row.color }}>
                              {fmt(row.value)} <span className="text-slate-600 font-normal">({pct.toFixed(0)}%)</span>
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div className="h-1.5 rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(100, pct)}%`, background: row.color, opacity: 0.7 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {superExhaustedAge && superExhaustedAge < form.life_expectancy && (
                  <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-3"
                    style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
                    <span className="text-red-400 mt-0.5 shrink-0">⚠️</span>
                    <div>
                      <p className="text-red-300 font-medium text-xs">Super shortfall detected</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        At {fmt(superPerYear)}/yr, your super runs out at age {superExhaustedAge} — {form.life_expectancy - superExhaustedAge} year{form.life_expectancy - superExhaustedAge !== 1 ? 's' : ''} before your life expectancy. Consider increasing voluntary contributions or adjusting your retirement income target.
                      </p>
                    </div>
                  </div>
                )}
                {(!superExhaustedAge || superExhaustedAge >= form.life_expectancy) && superAtPreserv > 0 && (
                  <div className="rounded-xl px-4 py-3 text-xs flex items-center gap-3"
                    style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
                    <span>✅</span>
                    <p className="text-slate-400">
                      Super covers <span className="text-white font-semibold">{fmt(superPerYear)}/yr</span> from age {preservationAge} and lasts beyond your life expectancy of {form.life_expectancy}.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
