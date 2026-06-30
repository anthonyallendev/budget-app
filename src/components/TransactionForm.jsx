import { useState } from 'react'

const TABS = ['Expense', 'Income', 'Investments']

const CATEGORIES = {
  Expense:     ['Housing', 'Food & Dining', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Utilities', 'Education', 'Other'],
  Income:      ['Salary', 'Freelance', 'Side Hustle', 'Other'],
  Investments: ['Stocks / ETFs', 'Superannuation', 'Crypto', 'Property', 'Bonds', 'Other'],
}

const TAB_TYPE = { Expense: 'expense', Income: 'income', Investments: 'expense' }

const today = () => new Date().toISOString().split('T')[0]

export default function TransactionForm({ onAdd }) {
  const [tab, setTab] = useState('Expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES.Expense[0])
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(today())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleTabChange(newTab) {
    setTab(newTab)
    setCategory(CATEGORIES[newTab][0])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onAdd({ type: TAB_TYPE[tab], amount: parseFloat(amount), category, description, date })
      setAmount('')
      setDescription('')
      setDate(today())
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const inputStyle = {
    background: 'rgba(6,11,26,0.8)',
    border: '1px solid rgba(0,212,255,0.15)',
  }
  const focusGlow = e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'
  const blurGlow  = e => e.target.style.boxShadow = 'none'

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-white font-semibold text-lg mb-5">Add transaction</h2>

      {error && (
        <div className="mb-4 rounded-lg px-4 py-3 text-sm text-red-300 border border-red-500/30"
          style={{ background: 'rgba(239,68,68,0.1)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Tab toggle */}
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {TABS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => handleTabChange(t)}
              className="flex-1 py-2 text-sm font-semibold transition-all duration-200"
              style={tab === t
                ? { background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', color: '#fff' }
                : { background: 'rgba(6,11,26,0.6)', color: '#64748b' }
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs">Amount ($)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="rounded-lg px-3 py-2.5 text-white text-sm outline-none"
              style={inputStyle}
              onFocus={focusGlow}
              onBlur={blurGlow}
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="rounded-lg px-3 py-2.5 text-white text-sm outline-none"
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={focusGlow}
              onBlur={blurGlow}
            />
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 text-xs">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="rounded-lg px-3 py-2.5 text-white text-sm outline-none"
            style={{ ...inputStyle, colorScheme: 'dark' }}
            onFocus={focusGlow}
            onBlur={blurGlow}
          >
            {CATEGORIES[tab].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 text-xs">Description <span className="text-slate-600">(optional)</span></label>
          <input
            type="text"
            placeholder="e.g. Woolworths grocery run"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="rounded-lg px-3 py-2.5 text-white text-sm outline-none"
            style={inputStyle}
            onFocus={focusGlow}
            onBlur={blurGlow}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="py-2.5 rounded-lg font-semibold text-white text-sm transition-all duration-300 hover:scale-[1.02] hover:glow-cyan disabled:opacity-50 mt-1"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
        >
          {loading ? 'Saving…' : 'Add transaction'}
        </button>
      </form>
    </div>
  )
}
