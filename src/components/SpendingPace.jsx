function getWeekBounds() {
  const now   = new Date()
  const day   = now.getDay() // 0=Sun
  const mon   = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7)); mon.setHours(0,0,0,0)
  const sun   = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999)
  return { mon, sun }
}

function getLastWeekBounds() {
  const { mon } = getWeekBounds()
  const lastMon = new Date(mon); lastMon.setDate(mon.getDate() - 7)
  const lastSun = new Date(mon); lastSun.setDate(mon.getDate() - 1); lastSun.setHours(23,59,59,999)
  return { mon: lastMon, sun: lastSun }
}

function getMonthBounds() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return { start, end, totalDays: end.getDate() }
}

export default function SpendingPace({ transactions }) {
  const now         = new Date()
  const { mon, sun }               = getWeekBounds()
  const { mon: lMon, sun: lSun }   = getLastWeekBounds()
  const { start, totalDays }       = getMonthBounds()
  const dayOfMonth  = now.getDate()

  const thisWeek = transactions
    .filter(t => { const d = new Date(t.date); return t.type === 'expense' && d >= mon && d <= sun })
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  const lastWeek = transactions
    .filter(t => { const d = new Date(t.date); return t.type === 'expense' && d >= lMon && d <= lSun })
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  const monthSoFar = transactions
    .filter(t => { const d = new Date(t.date); return t.type === 'expense' && d >= start && d <= now })
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  const dailyRate     = dayOfMonth > 0 ? monthSoFar / dayOfMonth : 0
  const projectedMonth = dailyRate * totalDays
  const weekChange    = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null
  const daysPassed    = dayOfMonth
  const pctMonth      = Math.round((daysPassed / totalDays) * 100)
  const onPace        = monthSoFar / daysPassed <= projectedMonth / totalDays

  if (transactions.length === 0) return null

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Spending pace</h2>
        <span className="text-xs text-slate-500">{pctMonth}% through the month</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* This week */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-slate-500 text-xs mb-1">This week</p>
          <p className="text-xl font-bold text-white">${thisWeek.toFixed(0)}</p>
          {weekChange !== null && (
            <p className="text-xs mt-1" style={{ color: weekChange > 0 ? '#e040fb' : '#00d4ff' }}>
              {weekChange > 0 ? '▲' : '▼'} {Math.abs(weekChange)}% vs last week
            </p>
          )}
          {weekChange === null && lastWeek === 0 && (
            <p className="text-xs mt-1 text-slate-600">First week recorded</p>
          )}
        </div>

        {/* Daily average */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-slate-500 text-xs mb-1">Daily average</p>
          <p className="text-xl font-bold text-white">${dailyRate.toFixed(0)}</p>
          <p className="text-xs mt-1 text-slate-600">this month so far</p>
        </div>

        {/* Month projection */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-slate-500 text-xs mb-1">Month projection</p>
          <p className="text-xl font-bold" style={{ color: onPace ? '#00d4ff' : '#e040fb' }}>
            ${Math.round(projectedMonth).toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: onPace ? '#00d4ff' : '#e040fb' }}>
            {onPace ? '✓ On pace' : '▲ Above pace'}
          </p>
        </div>
      </div>

      {/* Month progress bar */}
      <div className="mt-4">
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-1.5 rounded-full transition-all duration-700"
            style={{
              width: `${pctMonth}%`,
              background: 'linear-gradient(90deg,#7c3aed,#00d4ff)',
              boxShadow: '0 0 8px rgba(0,212,255,0.2)',
            }} />
        </div>
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>1st</span>
          <span>{new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}th</span>
        </div>
      </div>
    </div>
  )
}
