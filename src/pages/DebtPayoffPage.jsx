import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { useMigratedFeatureData } from '../hooks/useMigratedFeatureData'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const inputStyle = {
  background: 'rgba(6,11,26,0.8)',
  border: '1px solid rgba(0,212,255,0.18)',
}
const focusGlow = e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'
const blurGlow  = e => e.target.style.boxShadow = 'none'

const DEBT_TYPES = ['Credit card', 'Personal loan', 'Car loan', 'HECS / student loan', 'Mortgage', 'Other']

const EMPTY_FORM = {
  name: '', debtType: 'Credit card',
  balance: '', rate: '', payment: '', extraPayment: '',
}

// ── Calculation helpers ───────────────────────────────────────────────────────

function calcPayoff(balance, annualRate, monthlyPayment) {
  if (!balance || !monthlyPayment || monthlyPayment <= 0) return null
  const r = annualRate / 100 / 12
  let bal = balance
  const chartData = []
  let months = 0
  let totalInterest = 0

  while (bal > 0 && months < 600) {
    const interest = bal * r
    totalInterest += interest
    bal = bal + interest - monthlyPayment
    if (bal < 0) bal = 0
    months++
    if (months % 3 === 0 || bal === 0) {
      chartData.push({ month: months, balance: Math.round(bal) })
    }
  }
  return { months, totalInterest, chartData }
}

function fmtM(months) {
  const yr = Math.floor(months / 12)
  const mo = months % 12
  if (yr === 0) return `${mo} month${mo !== 1 ? 's' : ''}`
  if (mo === 0) return `${yr} year${yr !== 1 ? 's' : ''}`
  return `${yr} yr ${mo} mo`
}

function minPayment(balance, annualRate) {
  const r = annualRate / 100 / 12
  return Math.ceil(balance * r * 1.5)
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm">
      <p className="text-slate-400 mb-1">Month {label}</p>
      {payload.map((p, i) => p.value != null && (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: ${p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

// ── Debt card ─────────────────────────────────────────────────────────────────

function DebtCard({ debt, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const balance  = parseFloat(debt.balance)
  const rate     = parseFloat(debt.rate)
  const payment  = parseFloat(debt.payment)
  const extra    = parseFloat(debt.extraPayment) || 0

  const base    = calcPayoff(balance, rate, payment)
  const boosted = extra > 0 ? calcPayoff(balance, rate, payment + extra) : null

  if (!base) return null

  const paidPct = Math.min(100, Math.round((base.totalInterest / (balance + base.totalInterest)) * 100))

  return (
    <div className="glass rounded-2xl p-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold">{debt.name || debt.debtType}</h3>
            {debt.name && (
              <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                {debt.debtType}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            ${parseFloat(debt.balance).toLocaleString()} at {debt.rate}% p.a. · ${parseFloat(debt.payment).toLocaleString()}/mo
            {extra > 0 && <span className="text-cyan-400"> + ${extra.toLocaleString()} extra</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-slate-500 hover:text-cyan-400 transition-colors px-2 py-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {expanded ? 'Hide chart ▲' : 'Show chart ▼'}
          </button>
          <button onClick={onDelete}
            className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none">×</button>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Payoff time',    value: fmtM(base.months),                                    color: '#00d4ff' },
          { label: 'Total interest', value: `$${Math.round(base.totalInterest).toLocaleString()}`, color: '#e040fb' },
          { label: 'Total paid',     value: `$${Math.round(balance + base.totalInterest).toLocaleString()}`, color: '#7c3aed' },
          boosted
            ? { label: `With +$${extra}/mo`, value: `${fmtM(boosted.months)} · save $${Math.round(base.totalInterest - boosted.totalInterest).toLocaleString()}`, color: '#22d3ee' }
            : { label: 'Interest share', value: `${paidPct}% of total`, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-slate-500 text-xs mb-1">{s.label}</p>
            <p className="text-sm font-semibold leading-snug" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar toward payoff */}
      <div className="mb-1">
        <div className="flex justify-between text-xs text-slate-600 mb-1.5">
          <span>Balance remaining</span>
          <span>${balance.toLocaleString()} of ${Math.round(balance + base.totalInterest).toLocaleString()} total cost</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-1.5 rounded-full transition-all duration-700"
            style={{
              width: `${100 - paidPct}%`,
              background: 'linear-gradient(90deg,#00d4ff,#7c3aed)',
              boxShadow: '0 0 8px rgba(0,212,255,0.3)',
            }} />
        </div>
      </div>

      {/* Expandable chart */}
      {expanded && (
        <div className="mt-5">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" type="number" domain={['dataMin', 'dataMax']}
                tickFormatter={v => `Mo ${v}`} tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`}
                tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip content={<CustomTooltip />} />
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
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DebtPayoffPage() {
  const { data: debts, save: setDebts } = useMigratedFeatureData('savedDebts', 'savedDebts', [])
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState(EMPTY_FORM)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleAdd(e) {
    e.preventDefault()
    if (!form.balance || !form.rate || !form.payment) return
    const newDebt = { ...form, id: Date.now().toString() }
    setDebts([...debts, newDebt])
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  function deleteDebt(id) {
    setDebts(debts.filter(x => x.id !== id))
  }

  const minPay = form.balance && form.rate ? minPayment(parseFloat(form.balance), parseFloat(form.rate)) : null

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">Debt Payoff Calculator</h1>
          <p className="text-slate-400 text-sm">Track your debts and see exactly how long until you're free of them.</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white glass transition-colors hover:text-cyan-400"
        >
          {showForm ? 'Cancel' : '+ Add debt'}
        </button>
      </div>

      {/* Add debt form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-5">Add a debt</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">
                  Nickname <span className="text-slate-600 font-normal">(optional)</span>
                </label>
                <input type="text" placeholder="e.g. Westpac credit card"
                  value={form.name} onChange={e => set('name', e.target.value)}
                  className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                  style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Debt type</label>
                <select value={form.debtType} onChange={e => set('debtType', e.target.value)}
                  className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={focusGlow} onBlur={blurGlow}>
                  {DEBT_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Current balance ($) <span className="text-pink-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input type="number" required min="0" placeholder="e.g. 12000"
                    value={form.balance} onChange={e => set('balance', e.target.value)}
                    className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                    style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Annual interest rate (%) <span className="text-pink-400">*</span></label>
                <div className="relative">
                  <input type="number" required min="0" max="100" step="0.1" placeholder="e.g. 19.9"
                    value={form.rate} onChange={e => set('rate', e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                    style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">
                  Monthly payment ($) <span className="text-pink-400">*</span>
                  {minPay && <span className="text-slate-600 ml-2 font-normal">min ~${minPay}</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input type="number" required min="0" placeholder="e.g. 300"
                    value={form.payment} onChange={e => set('payment', e.target.value)}
                    className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                    style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">
                  Extra monthly payment ($) <span className="text-slate-600 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input type="number" min="0" placeholder="e.g. 100"
                    value={form.extraPayment} onChange={e => set('extraPayment', e.target.value)}
                    className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                    style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
                </div>
              </div>
            </div>
            <button type="submit"
              className="py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02] mt-1"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}>
              Save debt
            </button>
          </form>
        </div>
      )}

      {/* Saved debts list */}
      {debts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">💳</p>
          <p className="text-slate-400 text-sm mb-1">No debts added yet.</p>
          <p className="text-slate-600 text-xs">Add a debt above to see your payoff timeline and total interest.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {debts.map(debt => (
            <DebtCard key={debt.id} debt={debt} onDelete={() => deleteDebt(debt.id)} />
          ))}

          {/* Summary if multiple debts */}
          {debts.length > 1 && (() => {
            const validDebts = debts.filter(d => calcPayoff(parseFloat(d.balance), parseFloat(d.rate), parseFloat(d.payment)))
            const totalBalance  = validDebts.reduce((s, d) => s + parseFloat(d.balance), 0)
            const totalInterest = validDebts.reduce((s, d) => s + (calcPayoff(parseFloat(d.balance), parseFloat(d.rate), parseFloat(d.payment))?.totalInterest || 0), 0)
            const totalPayment  = validDebts.reduce((s, d) => s + parseFloat(d.payment) + (parseFloat(d.extraPayment) || 0), 0)
            return (
              <div className="glass rounded-2xl p-5 flex flex-wrap gap-6 items-center">
                <p className="text-slate-400 text-sm font-medium">All debts combined</p>
                {[
                  { label: 'Total owed',      value: `$${Math.round(totalBalance).toLocaleString()}`,  color: '#e040fb' },
                  { label: 'Total interest',  value: `$${Math.round(totalInterest).toLocaleString()}`, color: '#f59e0b' },
                  { label: 'Monthly outgoing',value: `$${Math.round(totalPayment).toLocaleString()}/mo`, color: '#00d4ff' },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-slate-500 text-xs">{s.label}</p>
                    <p className="font-bold text-lg" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}
    </AppLayout>
  )
}
