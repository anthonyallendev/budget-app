import { useState, useEffect } from 'react'

function getWeekKey() {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('healthScoreHistory')) || [] } catch { return [] }
}

function computeScore(transactions) {
  if (!transactions || transactions.length === 0) return null

  const now      = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const thisMonth = transactions.filter(t => new Date(t.date) >= monthStart)
  const lastMonth = transactions.filter(t => {
    const d = new Date(t.date)
    return d >= lastMonthStart && d <= lastMonthEnd
  })

  const income    = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
  const expenses  = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  const lastIncome = lastMonth.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
  const lastExp   = lastMonth.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)

  const dayOfMonth   = now.getDate()
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const prorated     = lastIncome > 0 ? lastIncome * (dayOfMonth / daysInMonth) : income

  let score = 0
  const breakdown = []

  // Savings rate (0–30 pts)
  if (income > 0) {
    const savingsRate = (income - expenses) / income
    const pts = Math.round(Math.max(0, Math.min(30, savingsRate * 100)))
    score += pts
    breakdown.push({ label: 'Savings rate', pts, max: 30, good: savingsRate >= 0.1 })
  }

  // Spending trend (0–25 pts): spending down MoM = good
  if (lastExp > 0) {
    const change = (expenses - lastExp * (dayOfMonth / daysInMonth)) / lastExp
    const pts = change < -0.1 ? 25 : change < 0 ? 18 : change < 0.1 ? 12 : change < 0.25 ? 5 : 0
    score += pts
    breakdown.push({ label: 'Spending trend', pts, max: 25, good: pts >= 12 })
  } else {
    score += 12
    breakdown.push({ label: 'Spending trend', pts: 12, max: 25, good: true })
  }

  // Transaction activity (0–20 pts): actively tracking
  const txCount = thisMonth.length
  const pts3 = txCount >= 20 ? 20 : txCount >= 10 ? 15 : txCount >= 5 ? 10 : txCount > 0 ? 5 : 0
  score += pts3
  breakdown.push({ label: 'Tracking activity', pts: pts3, max: 20, good: pts3 >= 10 })

  // Surplus vs deficit (0–25 pts)
  const surplus = income - expenses
  const pts4 = surplus > 0 ? Math.round(Math.min(25, (surplus / Math.max(income, 1)) * 50)) : 0
  score += pts4
  breakdown.push({ label: 'Monthly surplus', pts: pts4, max: 25, good: surplus >= 0 })

  score = Math.min(100, Math.max(0, score))

  return { score, breakdown }
}

function scoreColor(s) {
  if (s >= 80) return '#00d4ff'
  if (s >= 60) return '#7c3aed'
  if (s >= 40) return '#f59e0b'
  return '#e040fb'
}

function scoreLabel(s) {
  if (s >= 80) return 'Excellent'
  if (s >= 60) return 'Good'
  if (s >= 40) return 'Fair'
  return 'Needs attention'
}

export default function FinancialHealthScore({ transactions = [] }) {
  const [history, setHistory] = useState(loadHistory)

  const result  = computeScore(transactions)
  const weekKey = getWeekKey()

  useEffect(() => {
    if (!result) return
    const updated = [...history.filter(h => h.week !== weekKey), { week: weekKey, score: result.score }]
    setHistory(updated)
    localStorage.setItem('healthScoreHistory', JSON.stringify(updated.slice(-26)))
  }, [transactions.length])

  if (!result) return null

  const { score, breakdown } = result
  const color = scoreColor(score)
  const prev  = history.filter(h => h.week !== weekKey).slice(-1)[0]
  const delta = prev ? score - prev.score : null

  // Arc SVG
  const R = 40, cx = 50, cy = 50
  const circumference = Math.PI * R
  const offset = circumference * (1 - score / 100)

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Financial health</h2>
        {delta !== null && (
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: `${delta >= 0 ? '#00d4ff' : '#e040fb'}18`, color: delta >= 0 ? '#00d4ff' : '#e040fb' }}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} pts this week
          </span>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Arc gauge */}
        <div className="shrink-0 flex flex-col items-center" style={{ width: 100 }}>
          <div className="relative" style={{ width: 100, height: 56 }}>
            <svg viewBox="0 0 100 56" width="100" height="56">
              <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
              <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
                fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xl font-bold leading-none" style={{ color }}>{score}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-none mt-1">{scoreLabel(score)}</p>
        </div>

        {/* Breakdown */}
        <div className="flex-1 flex flex-col gap-1.5">
          {breakdown.map(b => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-28 shrink-0">{b.label}</span>
              <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-1 rounded-full transition-all duration-700"
                  style={{ width: `${(b.pts / b.max) * 100}%`, background: b.good ? color : '#f59e0b' }} />
              </div>
              <span className="text-xs w-10 text-right shrink-0" style={{ color: b.good ? color : '#f59e0b' }}>
                {b.pts}/{b.max}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mini trend */}
      {history.length > 1 && (
        <div className="flex gap-1.5 items-end mt-4 h-8 border-t border-white/5 pt-4">
          {history.slice(-8).map((h, i) => {
            const ht = Math.max(4, (h.score / 100) * 32)
            return (
              <div key={i} className="flex-1 rounded-sm transition-all" title={`${h.week}: ${h.score}`}
                style={{ height: ht, background: `${scoreColor(h.score)}${h.week === weekKey ? 'cc' : '55'}` }} />
            )
          })}
        </div>
      )}
    </div>
  )
}
