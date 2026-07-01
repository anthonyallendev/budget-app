import { useState } from 'react'
import AppLayout from '../components/AppLayout'

// Tax brackets by country (2024-25 financial year approximations)
const TAX_CONFIGS = {
  Australia: {
    currency: 'AUD',
    brackets: [
      { min: 0,       max: 18200,  rate: 0    },
      { min: 18201,   max: 45000,  rate: 0.19 },
      { min: 45001,   max: 120000, rate: 0.325 },
      { min: 120001,  max: 180000, rate: 0.37 },
      { min: 180001,  max: Infinity, rate: 0.45 },
    ],
    // Medicare levy
    extraLevy: (income) => income > 18200 ? income * 0.02 : 0,
    extraLevyLabel: 'Medicare levy (2%)',
    superRate: 0.115,  // 11.5% super guarantee
    superLabel: 'Super (11.5%)',
  },
  'United States': {
    currency: 'USD',
    brackets: [
      { min: 0,       max: 11600,  rate: 0.10  },
      { min: 11601,   max: 47150,  rate: 0.12  },
      { min: 47151,   max: 100525, rate: 0.22  },
      { min: 100526,  max: 191950, rate: 0.24  },
      { min: 191951,  max: 243725, rate: 0.32  },
      { min: 243726,  max: 609350, rate: 0.35  },
      { min: 609351,  max: Infinity, rate: 0.37 },
    ],
    extraLevy: (income) => Math.min(income, 160200) * 0.0765,
    extraLevyLabel: 'FICA (Social Security + Medicare)',
    superRate: null,
    superLabel: null,
  },
  'United Kingdom': {
    currency: 'GBP',
    brackets: [
      { min: 0,       max: 12570,  rate: 0    },
      { min: 12571,   max: 50270,  rate: 0.20 },
      { min: 50271,   max: 125140, rate: 0.40 },
      { min: 125141,  max: Infinity, rate: 0.45 },
    ],
    extraLevy: (income) => {
      if (income <= 12570) return 0
      const ni = Math.min(income, 50270) - 12570
      return ni * 0.08 + Math.max(0, income - 50270) * 0.02
    },
    extraLevyLabel: 'National Insurance',
    superRate: null,
    superLabel: null,
  },
  Canada: {
    currency: 'CAD',
    brackets: [
      { min: 0,       max: 55867,  rate: 0.15  },
      { min: 55868,   max: 111733, rate: 0.205 },
      { min: 111734,  max: 154906, rate: 0.26  },
      { min: 154907,  max: 220000, rate: 0.29  },
      { min: 220001,  max: Infinity, rate: 0.33 },
    ],
    extraLevy: () => 0,
    extraLevyLabel: null,
    superRate: null,
    superLabel: null,
  },
}

function calcTax(income, brackets) {
  let tax = 0
  for (const b of brackets) {
    if (income <= b.min) break
    const taxable = Math.min(income, b.max) - b.min
    tax += taxable * b.rate
  }
  return tax
}

const COUNTRIES = Object.keys(TAX_CONFIGS)

const inputStyle = {
  background: 'rgba(6,11,26,0.8)',
  border: '1px solid rgba(0,212,255,0.18)',
}
const focusGlow = e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'
const blurGlow  = e => e.target.style.boxShadow = 'none'

function fmt(n, symbol) {
  return `${symbol}${Math.round(n).toLocaleString()}`
}

export default function TaxEstimatePage() {
  const [salary,  setSalary]  = useState('')
  const [country, setCountry] = useState('Australia')

  const cfg    = TAX_CONFIGS[country]
  const income = parseFloat(salary) || 0
  const symbol = cfg.currency === 'AUD' ? 'A$' : cfg.currency === 'USD' ? 'US$' : cfg.currency === 'GBP' ? '£' : 'CA$'

  const incomeTax  = calcTax(income, cfg.brackets)
  const levy       = cfg.extraLevy(income)
  const superAmt   = cfg.superRate ? income * cfg.superRate : 0
  const totalDeductions = incomeTax + levy
  const takeHome   = Math.max(0, income - totalDeductions)
  const effectiveRate = income > 0 ? (totalDeductions / income) * 100 : 0

  // Find marginal rate
  const marginalBracket = [...cfg.brackets].reverse().find(b => income > b.min)
  const marginalRate    = marginalBracket ? marginalBracket.rate * 100 : 0

  const rows = [
    { label: 'Gross salary',            value: income,           color: '#00d4ff', sign: '' },
    { label: 'Income tax',              value: -incomeTax,       color: '#e040fb', sign: '-' },
    cfg.extraLevyLabel
      ? { label: cfg.extraLevyLabel,    value: -levy,            color: '#f59e0b', sign: '-' }
      : null,
    { label: 'Take-home pay',           value: takeHome,         color: '#7c3aed', sign: '' },
  ].filter(Boolean)

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-1">Tax Estimate</h1>
      <p className="text-slate-400 text-sm mb-8">
        Estimate your take-home pay after income tax and levies.
        These are simplified estimates — consult a tax professional for your personal situation.
      </p>

      {/* Inputs */}
      <div className="glass rounded-2xl p-6 mb-6 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-slate-400 text-sm">Country</label>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
            style={{ ...inputStyle, colorScheme: 'dark' }}
            onFocus={focusGlow} onBlur={blurGlow}
          >
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-slate-400 text-sm">Annual gross salary ({cfg.currency})</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{symbol}</span>
            <input
              type="number"
              min="0"
              placeholder="e.g. 85000"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              className="w-full rounded-lg pl-8 pr-4 py-2.5 text-white text-sm outline-none"
              style={inputStyle}
              onFocus={focusGlow} onBlur={blurGlow}
            />
          </div>
        </div>
      </div>

      {income > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Breakdown */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-5">Annual breakdown</h2>
            <div className="flex flex-col gap-3">
              {rows.map((row, i) => (
                <div key={i} className={`flex justify-between items-center py-3 ${i < rows.length - 1 ? 'border-b border-white/5' : 'border-t border-white/10 mt-1'}`}>
                  <span className={i === rows.length - 1 ? 'text-white font-semibold' : 'text-slate-400 text-sm'}>
                    {row.label}
                  </span>
                  <span className={`font-semibold tabular-nums ${i === rows.length - 1 ? 'text-xl' : 'text-sm'}`}
                    style={{ color: row.color }}>
                    {row.sign}{fmt(Math.abs(row.value), symbol)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div className="flex flex-col gap-4">
            {[
              { label: 'Monthly take-home',   value: fmt(takeHome / 12, symbol),       color: '#7c3aed' },
              { label: 'Weekly take-home',    value: fmt(takeHome / 52, symbol),       color: '#7c3aed' },
              { label: 'Effective tax rate',  value: `${effectiveRate.toFixed(1)}%`,   color: '#e040fb' },
              { label: 'Marginal tax rate',   value: `${marginalRate.toFixed(0)}%`,    color: '#f59e0b' },
              ...(superAmt > 0 ? [{
                label: cfg.superLabel,
                value: `${fmt(superAmt, symbol)}/yr`,
                color: '#00d4ff',
              }] : []),
            ].map((stat, i) => (
              <div key={i} className="glass rounded-xl p-4 flex items-center justify-between">
                <span className="text-slate-400 text-sm">{stat.label}</span>
                <span className="font-bold text-lg" style={{ color: stat.color }}>{stat.value}</span>
              </div>
            ))}

            {/* Tax bracket bar */}
            <div className="glass rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-3">Tax brackets</p>
              {cfg.brackets.filter(b => b.rate > 0 && income >= b.min).map((b, i) => {
                const pct = b.rate * 100
                return (
                  <div key={i} className="flex items-center gap-3 mb-2 last:mb-0">
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: `hsl(${200 + i * 40}, 80%, 60%)` }} />
                    <span className="text-xs text-slate-500 flex-1">
                      {symbol}{b.min.toLocaleString()}
                      {b.max !== Infinity ? `–${symbol}${b.max.toLocaleString()}` : '+'}
                    </span>
                    <span className="text-xs font-semibold text-white">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {income === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">🧮</p>
          <p className="text-slate-400 text-sm">Enter your annual salary above to see your tax estimate.</p>
        </div>
      )}

      <p className="text-slate-600 text-xs text-center mt-6">
        Estimates based on {new Date().getFullYear()} tax rates. Does not account for deductions, offsets, state taxes, or individual circumstances.
        Not financial or tax advice.
      </p>
    </AppLayout>
  )
}
