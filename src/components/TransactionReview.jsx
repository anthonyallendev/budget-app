import { useState, useEffect, useMemo } from 'react'

const CATEGORIES = {
  expense: ['Housing', 'Food & Dining', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Utilities', 'Education', 'Other'],
  income:  ['Salary', 'Freelance', 'Side Hustle', 'Other'],
  savings: ['Stocks / ETFs', 'Superannuation', 'Crypto', 'Property', 'Bonds', 'Other'],
}

const STORAGE_KEY = 'txReviewedIds'

function getReviewedIds() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) }
  catch { return new Set() }
}

function persistReviewed(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

function fmt(n) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n)
}

function typeColor(type) {
  if (type === 'income')  return '#00d4ff'
  if (type === 'savings') return '#7c3aed'
  return '#e040fb'
}

const inputBase = {
  background: 'rgba(6,11,26,0.8)',
  border: '1px solid rgba(0,212,255,0.18)',
}

export function getUnreviewedCount(transactions) {
  const reviewed = getReviewedIds()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  return transactions.filter(t => new Date(t.date) >= cutoff && !reviewed.has(t.id)).length
}

export default function TransactionReview({ transactions, onUpdate, onClose }) {
  const [reviewedIds, setReviewedIds] = useState(getReviewedIds)
  const [index, setIndex] = useState(0)
  const [editingCategory, setEditingCategory] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const cutoff = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 7); return d
  }, [])

  const queue = useMemo(
    () => transactions.filter(t => new Date(t.date) >= cutoff && !reviewedIds.has(t.id)),
    [transactions, cutoff, reviewedIds]
  )

  const current = queue[index]

  useEffect(() => {
    if (current) {
      setSelectedCategory(current.category || '')
      setEditingCategory(false)
    }
  }, [current?.id])

  useEffect(() => {
    if (queue.length === 0) setDone(true)
  }, [queue.length])

  function markAndAdvance(id) {
    const updated = new Set(reviewedIds)
    updated.add(id)
    setReviewedIds(updated)
    persistReviewed(updated)
    setIndex(0)
  }

  async function handleConfirm() {
    if (!current) return
    if (selectedCategory !== current.category) {
      setSaving(true)
      try { await onUpdate(current.id, { category: selectedCategory }) }
      finally { setSaving(false) }
    }
    markAndAdvance(current.id)
  }

  function handleSkip() {
    if (!current) return
    setIndex(i => {
      const next = i + 1
      if (next >= queue.length) { setDone(true); return i }
      return next
    })
  }

  const reviewed = transactions.filter(t => new Date(t.date) >= cutoff && reviewedIds.has(t.id)).length
  const total = transactions.filter(t => new Date(t.date) >= cutoff).length

  const categoryOptions = current
    ? [...new Set([
        ...(CATEGORIES[current.type] || CATEGORIES.expense),
        current.category,
      ].filter(Boolean))]
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md glass rounded-3xl flex flex-col overflow-hidden"
        style={{ border: '1px solid rgba(0,212,255,0.15)', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <h2 className="text-white font-bold text-lg">7-day review</h2>
            <p className="text-slate-500 text-xs mt-0.5">Check your recent transactions look right</p>
          </div>
          <button onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center">
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>{reviewed} of {total} reviewed</span>
            {!done && queue.length > 0 && <span>{queue.length} remaining</span>}
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${total > 0 ? (reviewed / total) * 100 : 0}%`, background: 'linear-gradient(90deg,#00d4ff,#7c3aed)' }} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {done ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-white font-bold text-xl mb-2">All caught up!</h3>
              <p className="text-slate-400 text-sm">All your transactions from the last 7 days have been reviewed.</p>
              <button onClick={onClose}
                className="mt-6 px-6 py-3 rounded-xl font-semibold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}>
                Close
              </button>
            </div>
          ) : current ? (
            <div className="flex flex-col gap-4">
              {/* Transaction card */}
              <div className="rounded-2xl p-5 flex flex-col gap-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${typeColor(current.type)}22` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-base truncate">
                      {current.description || current.merchant_name || '—'}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {new Date(current.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {current.source && current.source !== 'manual' && (
                        <span className="ml-2 opacity-60">· {current.source}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-xl" style={{ color: typeColor(current.type) }}>
                      {current.type === 'income' ? '+' : '-'}{fmt(current.amount)}
                    </p>
                    <span className="text-xs capitalize px-2 py-0.5 rounded-full"
                      style={{ background: `${typeColor(current.type)}18`, color: typeColor(current.type) }}>
                      {current.type}
                    </span>
                  </div>
                </div>

                {/* Category */}
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs uppercase tracking-wider">Category</span>
                  {editingCategory ? (
                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      className="flex-1 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                      style={{ ...inputBase, colorScheme: 'dark' }}
                      autoFocus
                    >
                      {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingCategory(true)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                      style={{ background: 'rgba(0,212,255,0.08)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}
                    >
                      {selectedCategory || 'Uncategorised'}
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Queue preview */}
              {queue.length > 1 && (
                <p className="text-center text-slate-600 text-xs">
                  {queue.length - 1} more to review after this
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        {!done && current && (
          <div className="px-6 py-5 border-t border-white/5 flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors glass"
            >
              Skip →
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}
            >
              {saving ? 'Saving…' : selectedCategory !== current.category ? 'Save & confirm ✓' : 'Looks right ✓'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
