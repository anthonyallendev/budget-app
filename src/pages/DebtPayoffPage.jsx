import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const inputStyle = {
  background: 'rgba(6,11,26,0.8)',
  border: '1px solid rgba(0,212,255,0.18)',
}
const focusGlow = e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'
const blurGlow  = e => e.target.style.boxShadow = 'none'

function calcPayoff(balance, annualRate, monthlyPayment) {
  if (!balance || !monthlyPayment || monthlyPayment <= 0) return null
  const r = annualRate / 100 / 12
  let bal = balance
  const data = []
  let months = 0
  let totalInterest = 0

  while (bal > 0 && months < 600) {
    const interest = bal * r
    totalInterest += interest
    bal = bal + interest - monthlyPayment
    if (bal < 0) bal = 0
    months++
    if (months % 3 === 0 || bal === 0) {
      data.push({ month: months, balance: Math.round(bal) })
    }
  }
  return { months, totalInterest, chartData: data }
}

function minPayment(balance, annualRate) {
  const r = annualRate / 100 / 12
  return Math.ceil(balance * r * 1.5)  // rough minimum
}

function fmtM(months) {
  const yr = Math.floor(months / 12)
  const mo = months % 12
  if (yr === 0) return `${mo} month${mo !== 1 ? 's' : ''}`
  if (mo === 0) return `${yr} year${yr !== 1 ? 's' : ''}`
  return `${yr} yr ${mo} mo`
}

const DEBT_TYPES = ['Credit card', 'Personal loan', 'Car loan', 'HECS / student loan', 'Mortgage', 'Other']

const DEFAULTS = {
  debtType:  'Credit card',
  balance:   '',
  rate:      '',
  payment:   '',
  extraPayment: '',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm">
      <p className="text-slate-400 mb-1">Month {label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: ${p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function DebtPayoffPage() {
  const [form, setForm] = useState(DEFAULTS)
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const balance  = parseFloat(form.balance)  || 0
  const rate     = parseFloat(form.rate)     || 0
  const payment  = parseFloat(form.payment)  || 0
  const extra    = parseFloat(form.extraPayment) || 0

  const base    = calcPayoff(balance, rate, payment)
  const boosted = extra > 0 ? calcPayoff(balance, rate, payment + extra) : null

  const minPay = balance && rate ? minPayment(balance, rate) : null

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-1">Debt Payoff Calculator</h1>
      <p className="text-slate-400 text-sm mb-8">
        See how long it takes to pay off a debt and how much interest you'll pay.
        Add an extra payment amount to see the difference.
      </p>

      {/* Inputs */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-sm">Debt type</label>
            <select
              value={form.debtType}
              onChange={e => set('debtType', e.target.value)}
              className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={focusGlow} onBlur={blurGlow}
            >
              {DEBT_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-sm">Current balance ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <input type="number" min="0" placeholder="e.g. 12000" value={form.balance}
                onChange={e => set('balance', e.target.value)}
                className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-sm">Annual interest rate (%)</label>
            <div className="relative">
              <input type="number" min="0" max="100" step="0.1" placeholder="e.g. 19.9"
                value={form.rate} onChange={e => set('rate', e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-sm">Monthly payment ($)
              {minPay && <span className="text-slate-600 ml-2 font-normal">min ~${minPay}</span>}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <input type="number" min="0" placeholder="e.g. 300" value={form.payment}
                onChange={e => set('payment', e.target.value)}
                className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-slate-400 text-sm">Extra monthly payment ($)
              <span className="text-slate-600 ml-2 font-normal">optional — see how much faster you'd pay it off</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <input type="number" min="0" placeholder="e.g. 100" value={form.extraPayment}
                onChange={e => set('extraPayment', e.target.value)}
                className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
            </div>
          </div>
        </div>
      </div>

      {base && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Base result */}
          <div className="glass rounded-2xl p-6">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">Current plan</p>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Payoff time',     value: fmtM(base.months),                         color: '#00d4ff' },
                { label: 'Total interest',  value: `$${Math.round(base.totalInterest).toLocaleString()}`, color: '#e040fb' },
                { label: 'Total paid',      value: `$${Math.round(balance + base.totalInterest).toLocaleString()}`, color: '#7c3aed' },
              ].map((s, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-slate-400 text-sm">{s.label}</span>
                  <span className="font-bold text-lg" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Boosted result */}
          {boosted ? (
            <div className="glass rounded-2xl p-6">
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">
                With extra ${extra}/mo
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Payoff time',    value: fmtM(boosted.months),
                    sub: `${fmtM(base.months - boosted.months)} faster`, color: '#00d4ff' },
                  { label: 'Total interest', value: `$${Math.round(boosted.totalInterest).toLocaleString()}`,
                    sub: `Save $${Math.round(base.totalInterest - boosted.totalInterest).toLocaleString()}`, color: '#e040fb' },
                  { label: 'Total paid',     value: `$${Math.round(balance + boosted.totalInterest).toLocaleString()}`,
                    sub: null, color: '#7c3aed' },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-slate-400 text-sm">{s.label}</span>
                    <div className="text-right">
                      <p className="font-bold text-lg" style={{ color: s.color }}>{s.value}</p>
                      {s.sub && <p className="text-xs text-emerald-400">{s.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 flex items-center justify-center">
              <p className="text-slate-600 text-sm text-center">
                Add an extra monthly payment above<br />to see the savings.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {base && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-6">Balance over time</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" type="number" domain={['dataMin', 'dataMax']}
                tickFormatter={v => `Mo ${v}`} tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`}
                tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
              <Line data={base.chartData} type="monotone" dataKey="balance"
                name="Current plan" stroke="#e040fb" strokeWidth={2} dot={false} />
              {boosted && (
                <Line data={boosted.chartData} type="monotone" dataKey="balance"
                  name={`+$${extra}/mo`} stroke="#00d4ff" strokeWidth={2} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!base && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">💳</p>
          <p className="text-slate-400 text-sm">Fill in the fields above to calculate your debt payoff timeline.</p>
        </div>
      )}
    </AppLayout>
  )
}
