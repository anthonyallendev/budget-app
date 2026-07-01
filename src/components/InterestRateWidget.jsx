import { useState } from 'react'

const RATES_KEY = 'interestRateWidget'

function loadData() {
  try { return JSON.parse(localStorage.getItem(RATES_KEY)) || {} } catch { return {} }
}

const DEFAULT = {
  rba:       4.35,
  savings:   '',
  mortgage:  '',
  creditCard:'',
  personal:  '',
}

export default function InterestRateWidget() {
  const saved = loadData()
  const [rates, setRates] = useState({ ...DEFAULT, ...saved })
  const [editing, setEditing] = useState(false)

  function set(k, v) {
    const next = { ...rates, [k]: v }
    setRates(next)
    localStorage.setItem(RATES_KEY, JSON.stringify(next))
  }

  function RateBadge({ label, value, type }) {
    if (!value && value !== 0) return null
    const v = parseFloat(value)
    const ref = parseFloat(rates.rba)
    const debt = type === 'debt'
    const spread = debt ? v - ref : v - ref
    const color = debt ? (v > ref + 5 ? '#e040fb' : v > ref ? '#f59e0b' : '#00d4ff') : (v >= ref ? '#00d4ff' : '#f59e0b')
    return (
      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <p className="text-slate-500 text-xs mb-1">{label}</p>
        <p className="text-white font-semibold text-lg">{v.toFixed(2)}%</p>
        {!isNaN(ref) && <p className="text-xs mt-0.5" style={{ color }}>
          {spread >= 0 ? '+' : ''}{spread.toFixed(2)}% vs RBA
        </p>}
      </div>
    )
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-white text-sm outline-none"
  const inputStyle = { background: 'rgba(6,11,26,0.8)', border: '1px solid rgba(0,212,255,0.18)' }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-semibold">Interest rates</h2>
          <p className="text-slate-500 text-xs">RBA cash rate vs your rates</p>
        </div>
        <button onClick={() => setEditing(e => !e)}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:text-white text-slate-500"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          {editing ? 'Done' : 'Edit rates'}
        </button>
      </div>

      {editing ? (
        <div className="flex flex-col gap-3">
          {[
            { key: 'rba',        label: 'RBA cash rate (%)',     placeholder: '4.35' },
            { key: 'savings',    label: 'Your savings rate (%)', placeholder: 'e.g. 5.10' },
            { key: 'mortgage',   label: 'Mortgage rate (%)',      placeholder: 'e.g. 6.29' },
            { key: 'creditCard', label: 'Credit card rate (%)',   placeholder: 'e.g. 20.99' },
            { key: 'personal',   label: 'Personal loan (%)',      placeholder: 'e.g. 12.99' },
          ].map(f => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-slate-500 text-xs">{f.label}</label>
              <input type="number" step="0.01" placeholder={f.placeholder}
                value={rates[f.key]}
                onChange={e => set(f.key, e.target.value)}
                className={inputCls} style={inputStyle}
                onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'}
                onBlur={e => e.target.style.boxShadow = 'none'} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-xl p-3 col-span-1" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
            <p className="text-slate-500 text-xs mb-1">RBA cash rate</p>
            <p className="text-cyan-400 font-bold text-lg">{parseFloat(rates.rba).toFixed(2)}%</p>
            <p className="text-xs text-slate-600 mt-0.5">benchmark</p>
          </div>
          <RateBadge label="Your savings" value={rates.savings} type="savings" />
          <RateBadge label="Mortgage" value={rates.mortgage} type="debt" />
          <RateBadge label="Credit card" value={rates.creditCard} type="debt" />
          <RateBadge label="Personal loan" value={rates.personal} type="debt" />
          {!rates.savings && !rates.mortgage && !rates.creditCard && !rates.personal && (
            <button onClick={() => setEditing(true)}
              className="col-span-2 sm:col-span-2 rounded-xl p-3 text-xs text-slate-600 text-left hover:text-slate-400 transition-colors"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              + Add your rates to see how they compare
            </button>
          )}
        </div>
      )}
    </div>
  )
}
