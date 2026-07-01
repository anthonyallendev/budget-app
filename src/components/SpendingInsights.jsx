function getCategorySpend(transactions, month, year) {
  const result = {}
  transactions
    .filter(tx => {
      const d = new Date(tx.date)
      return tx.type === 'expense' && d.getMonth() === month && d.getFullYear() === year
    })
    .forEach(tx => {
      result[tx.category] = (result[tx.category] || 0) + parseFloat(tx.amount)
    })
  return result
}

export default function SpendingInsights({ transactions }) {
  if (transactions.length === 0) return null

  const now  = new Date()
  const thisM = now.getMonth()
  const thisY = now.getFullYear()
  const lm    = new Date(thisY, thisM - 1, 1)

  const thisMonth = getCategorySpend(transactions, thisM,          thisY)
  const lastMonth = getCategorySpend(transactions, lm.getMonth(),  lm.getFullYear())

  const insights = []

  Object.entries(thisMonth).forEach(([cat, curr]) => {
    const prev = lastMonth[cat]
    if (!prev || prev === 0) return
    const pct = Math.round(((curr - prev) / prev) * 100)
    if (Math.abs(pct) < 10) return
    insights.push({ cat, curr, prev, pct })
  })

  // New categories that appeared this month
  Object.entries(thisMonth).forEach(([cat, curr]) => {
    if (!lastMonth[cat]) {
      insights.push({ cat, curr, prev: 0, pct: null })
    }
  })

  insights.sort((a, b) => {
    if (a.pct === null) return 1
    if (b.pct === null) return -1
    return Math.abs(b.pct) - Math.abs(a.pct)
  })

  if (insights.length === 0) return null

  return (
    <div className="glass rounded-2xl p-6 mb-6">
      <h2 className="text-white font-semibold mb-1">Spending insights</h2>
      <p className="text-slate-500 text-xs mb-5">
        Month-over-month changes in your spending categories.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {insights.slice(0, 6).map((ins, i) => {
          const isUp   = ins.pct === null || ins.pct > 0
          const color  = isUp ? '#e040fb' : '#00d4ff'
          const arrow  = ins.pct === null ? '🆕' : ins.pct > 0 ? '▲' : '▼'
          const label  = ins.pct === null
            ? 'New this month'
            : `${Math.abs(ins.pct)}% vs last month`
          return (
            <div key={i} className="rounded-xl p-4 flex items-center justify-between gap-4"
              style={{ background: isUp ? 'rgba(224,64,251,0.06)' : 'rgba(0,212,255,0.06)' }}>
              <div>
                <p className="text-sm text-slate-300 font-medium">{ins.cat}</p>
                <p className="text-xs mt-0.5" style={{ color }}>
                  {arrow} {label}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-white">${ins.curr.toFixed(0)}</p>
                {ins.prev > 0 && (
                  <p className="text-xs text-slate-600">${ins.prev.toFixed(0)} last mo.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
