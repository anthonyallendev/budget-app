function detectRecurring(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense')
  const groups = {}

  expenses.forEach(tx => {
    const key = `${tx.category}::${parseFloat(tx.amount).toFixed(2)}`
    if (!groups[key]) groups[key] = []
    groups[key].push(new Date(tx.date))
  })

  const recurring = []
  Object.entries(groups).forEach(([key, dates]) => {
    if (dates.length < 2) return
    dates.sort((a, b) => a - b)

    // Check if dates span at least 2 different months
    const months = new Set(dates.map(d => `${d.getFullYear()}-${d.getMonth()}`))
    if (months.size < 2) return

    const [cat, amount] = key.split('::')
    const lastDate = dates[dates.length - 1]
    recurring.push({ category: cat, amount: parseFloat(amount), count: dates.length, lastDate })
  })

  return recurring.sort((a, b) => b.amount - a.amount)
}

export default function RecurringTransactions({ transactions }) {
  const recurring = detectRecurring(transactions)
  if (recurring.length === 0) return null

  const total = recurring.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white font-semibold">Recurring expenses</h2>
        <span className="text-xs text-slate-500">${total.toFixed(2)}/mo est.</span>
      </div>
      <p className="text-slate-500 text-xs mb-5">
        Amounts that repeat across multiple months — likely subscriptions or regular bills.
      </p>
      <div className="flex flex-col gap-2">
        {recurring.map((r, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div>
              <p className="text-sm text-slate-300 font-medium">{r.category}</p>
              <p className="text-xs text-slate-600">
                {r.count}× detected · last{' '}
                {r.lastDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <span className="text-sm font-semibold" style={{ color: '#e040fb' }}>
              -${r.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
