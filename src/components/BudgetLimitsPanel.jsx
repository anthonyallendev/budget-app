import { useState, useEffect } from 'react'

const EXPENSE_CATEGORIES = [
  'Housing', 'Food & Dining', 'Transport', 'Shopping',
  'Entertainment', 'Health', 'Utilities', 'Education', 'Other',
]

function load() {
  try { return JSON.parse(localStorage.getItem('budgetLimits')) || {} }
  catch { return {} }
}

function getSpentThisMonth(transactions) {
  const now = new Date()
  const spent = {}
  transactions
    .filter(tx => {
      const d = new Date(tx.date)
      return tx.type === 'expense' &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
    })
    .forEach(tx => {
      spent[tx.category] = (spent[tx.category] || 0) + parseFloat(tx.amount)
    })
  return spent
}

function ProgressBar({ pct }) {
  const color = pct >= 100 ? '#f43f5e' : pct >= 75 ? '#f59e0b' : '#00d4ff'
  return (
    <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, background: color, boxShadow: `0 0 8px ${color}60` }}
      />
    </div>
  )
}

export default function BudgetLimitsPanel({ transactions }) {
  const [limits, setLimits] = useState(load)
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    localStorage.setItem('budgetLimits', JSON.stringify(limits))
  }, [limits])

  const spent = getSpentThisMonth(transactions)

  function startEdit(cat) {
    setEditing(cat)
    setDraft(limits[cat] ?? '')
  }

  function saveEdit(cat) {
    const val = parseFloat(draft)
    if (!isNaN(val) && val > 0) {
      setLimits(l => ({ ...l, [cat]: val }))
    } else if (draft === '') {
      const next = { ...limits }
      delete next[cat]
      setLimits(next)
    }
    setEditing(null)
  }

  const categoriesWithLimits    = EXPENSE_CATEGORIES.filter(c => limits[c])
  const categoriesWithoutLimits = EXPENSE_CATEGORIES.filter(c => !limits[c])

  return (
    <div className="glass rounded-2xl p-6 mb-6">
      <h2 className="text-white font-semibold text-lg mb-1">Monthly budget limits</h2>
      <p className="text-slate-500 text-xs mb-6">
        Set a spending cap per category. Bars turn yellow at 75% and red when over.
      </p>

      <div className="flex flex-col gap-3">
        {/* Categories with limits */}
        {categoriesWithLimits.map(cat => {
          const s = spent[cat] || 0
          const l = limits[cat]
          const pct = (s / l) * 100
          const over = pct >= 100
          return (
            <div key={cat} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm font-medium">{cat}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs tabular-nums" style={{ color: over ? '#f43f5e' : '#64748b' }}>
                    ${s.toFixed(0)} /
                  </span>
                  {editing === cat ? (
                    <input
                      type="number"
                      autoFocus
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onBlur={() => saveEdit(cat)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(cat)}
                      className="w-20 text-right rounded-md px-2 py-0.5 text-white text-xs outline-none"
                      style={{ background: 'rgba(6,11,26,0.8)', border: '1px solid rgba(0,212,255,0.18)' }}
                      placeholder="limit"
                    />
                  ) : (
                    <button
                      onClick={() => startEdit(cat)}
                      className="text-xs text-slate-400 hover:text-white transition-colors tabular-nums"
                    >
                      ${l.toFixed(0)}
                    </button>
                  )}
                </div>
              </div>
              <ProgressBar pct={pct} />
              {over && (
                <p className="text-xs" style={{ color: '#f43f5e' }}>
                  Over by ${(s - l).toFixed(2)}
                </p>
              )}
            </div>
          )
        })}

        {/* Divider if mixed */}
        {categoriesWithLimits.length > 0 && categoriesWithoutLimits.length > 0 && (
          <div className="border-t border-white/5 my-1" />
        )}

        {/* Categories without limits */}
        {categoriesWithoutLimits.map(cat => {
          const s = spent[cat] || 0
          return (
            <div key={cat} className="flex items-center justify-between">
              <span className="text-slate-600 text-sm">{cat}</span>
              <div className="flex items-center gap-3">
                {s > 0 && <span className="text-slate-600 text-xs tabular-nums">${s.toFixed(0)} spent</span>}
                {editing === cat ? (
                  <input
                    type="number"
                    autoFocus
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={() => saveEdit(cat)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit(cat)}
                    className="w-20 text-right rounded-md px-2 py-0.5 text-white text-xs outline-none"
                    style={{ background: 'rgba(6,11,26,0.8)', border: '1px solid rgba(0,212,255,0.18)' }}
                    placeholder="set limit"
                  />
                ) : (
                  <button
                    onClick={() => startEdit(cat)}
                    className="text-xs text-slate-600 hover:text-cyan-glow transition-colors border border-white/10 hover:border-cyan-glow/30 rounded-md px-2 py-0.5"
                  >
                    + set limit
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
