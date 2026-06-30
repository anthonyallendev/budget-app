import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const CATEGORY_COLORS = [
  '#00d4ff', '#7c3aed', '#e040fb', '#06b6d4', '#8b5cf6',
  '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#ec4899',
]

function getMonthlyData(transactions) {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push({
      label: d.toLocaleString('en-AU', { month: 'short' }),
      year:  d.getFullYear(),
      month: d.getMonth(),
      income: 0,
      expenses: 0,
    })
  }
  transactions.forEach(tx => {
    const d = new Date(tx.date)
    const entry = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear())
    if (!entry) return
    if (tx.type === 'income') entry.income += parseFloat(tx.amount)
    else entry.expenses += parseFloat(tx.amount)
  })
  return months.map(({ label, income, expenses }) => ({ label, income, expenses }))
}

function getCategoryData(transactions) {
  const now = new Date()
  const thisMonth = transactions.filter(tx => {
    const d = new Date(tx.date)
    return tx.type === 'expense' &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
  })
  const totals = {}
  thisMonth.forEach(tx => {
    totals[tx.category] = (totals[tx.category] || 0) + parseFloat(tx.amount)
  })
  return Object.entries(totals)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
}

function MonthlyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm" style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }} className="font-semibold">
          {p.name === 'income' ? 'Income' : 'Expenses'}: ${p.value.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  )
}

function CategoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0].payload
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm" style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
      <p className="text-white font-semibold">{name}</p>
      <p style={{ color: payload[0].payload.fill }} className="font-bold">${value.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
    </div>
  )
}

export default function SpendingCharts({ transactions }) {
  const monthlyData  = getMonthlyData(transactions)
  const categoryData = getCategoryData(transactions)
  const hasMonthly   = monthlyData.some(m => m.income > 0 || m.expenses > 0)
  const hasCategory  = categoryData.length > 0

  const categoryDataWithColor = categoryData.map((d, i) => ({
    ...d,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Monthly bar chart */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-1">Monthly overview</h2>
        <p className="text-slate-500 text-xs mb-6">Income vs expenses — last 6 months</p>
        {hasMonthly ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={4} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip content={<MonthlyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="income"   fill="#00d4ff" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="expenses" fill="#e040fb" radius={[4,4,0,0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-slate-600 text-sm">
            Add transactions to see your monthly overview
          </div>
        )}
        <div className="flex gap-4 mt-4 justify-center">
          <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#00d4ff' }} />Income</span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#e040fb' }} />Expenses</span>
        </div>
      </div>

      {/* Category donut */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-1">Spending breakdown</h2>
        <p className="text-slate-500 text-xs mb-6">Expenses by category — this month</p>
        {hasCategory ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryDataWithColor}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryDataWithColor.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CategoryTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-slate-600 text-sm">
            Add expenses to see your spending breakdown
          </div>
        )}
        {hasCategory && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 justify-center">
            {categoryDataWithColor.map(d => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: d.fill }} />
                {d.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
