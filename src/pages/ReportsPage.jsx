import { useState, useEffect, useMemo } from 'react'
import AppLayout from '../components/AppLayout'
import PremiumGate from '../components/PremiumGate'
import { useProfile } from '../hooks/useProfile'
import { useTransactions } from '../hooks/useTransactions'
import { openFinancialSummaryPDF } from '../lib/pdfReport'
import {
  generateMonthlyStatement,
  generateAnnualStatement,
  getAvailableMonths,
  getAvailableFinancialYears,
} from '../lib/statementPDF'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ── helpers ─────────────────────────────────────────────────────────────────

function fmt(n) {
  const abs = Math.abs(n)
  const neg = n < 0
  let s
  if (abs >= 1_000_000) s = `$${(abs / 1_000_000).toFixed(2)}M`
  else if (abs >= 1_000) s = `$${(abs / 1_000).toFixed(1)}k`
  else s = `$${Math.round(abs).toLocaleString()}`
  return neg ? `-${s}` : s
}

function getMonthlyData(transactions) {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d   = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const label = d.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })
    const monthTx = transactions.filter(t => { const td = new Date(t.date); return td >= d && td <= end })
    const income   = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    const savings  = income - expenses
    return { label, income, expenses, savings, savingsRate: income > 0 ? (savings / income) * 100 : 0 }
  })
}

function getCategoryData(transactions) {
  const now = new Date()
  const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
  const expenses = transactions.filter(t => t.type === 'expense' && new Date(t.date) >= yearAgo)
  const total = expenses.reduce((s, t) => s + parseFloat(t.amount), 0)
  const map = {}
  expenses.forEach(t => { map[t.category] = (map[t.category] || 0) + parseFloat(t.amount) })
  return Object.entries(map)
    .map(([category, amt]) => ({ category, total: amt, pct: total > 0 ? (amt / total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total)
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm">
      <p className="text-slate-400 mb-2 text-xs">{label}</p>
      {payload.map((p, i) => <p key={i} className="font-semibold" style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  )
}

function RateTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm">
      <p className="text-slate-400 mb-2 text-xs">{label}</p>
      {payload.map((p, i) => <p key={i} className="font-semibold" style={{ color: p.color }}>{p.name}: {p.value.toFixed(1)}%</p>)}
    </div>
  )
}

const PLACEHOLDER_MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((label, i) => ({
  label, income: 4200 + Math.sin(i) * 400, expenses: 3100 + Math.cos(i) * 300,
  savings: 1100 + Math.sin(i * 0.8) * 200, savingsRate: 22 + Math.sin(i) * 6,
}))

// ── Statements tab ────────────────────────────────────────────────────────────

function StatementRow({ label, sublabel, txCount, lastDownloaded, isNew, onDownload, downloading }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-white/5 last:border-0">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#00d4ff" strokeWidth="1.4">
          <path d="M4 2h8l4 4v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
          <path d="M12 2v4h4" strokeLinecap="round" />
          <path d="M7 9h6M7 12h6M7 15h4" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-medium text-sm">{label}</p>
          {isNew && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"
              style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}>
              NEW
            </span>
          )}
        </div>
        <p className="text-slate-500 text-xs mt-0.5">
          {sublabel}
          {txCount != null && <> · {txCount} transaction{txCount !== 1 ? 's' : ''}</>}
        </p>
        {lastDownloaded && (
          <p className="text-slate-600 text-xs mt-0.5">
            Last downloaded {new Date(lastDownloaded).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>
      <button
        onClick={onDownload}
        disabled={downloading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0"
        style={isNew
          ? { background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', color: '#fff' }
          : { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }
        }
      >
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10 3v10M6 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 15v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2" strokeLinecap="round" />
        </svg>
        {downloading ? 'Opening…' : 'Download PDF'}
      </button>
    </div>
  )
}

function StatementsTab({ transactions, profile, isPremium }) {
  const [downloads, setDownloads]     = useState({})
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    try { setDownloads(JSON.parse(localStorage.getItem('statementDownloads') || '{}')) } catch {}
  }, [])

  const earliestTx = useMemo(() => {
    if (!transactions.length) return null
    return transactions.reduce((earliest, t) =>
      !earliest || t.date < earliest ? t.date : earliest, null)
  }, [transactions])

  const months = useMemo(() => getAvailableMonths(earliestTx), [earliestTx])
  const fyears  = useMemo(() => getAvailableFinancialYears(), [])

  const now = new Date()
  const lastMonthKey = `${now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}-${String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, '0')}`

  // Most recent completed FY key
  const latestFyKey = fyears[0]?.key

  function countTx(startDate, endDate) {
    return transactions.filter(t => {
      const d = new Date(t.date)
      return d >= startDate && d <= endDate
    }).length
  }

  async function handleMonthly(m) {
    setDownloading(m.key)
    try {
      generateMonthlyStatement(transactions, m.year, m.month, profile)
      const updated = { ...downloads, [m.key]: new Date().toISOString() }
      setDownloads(updated)
    } finally {
      setTimeout(() => setDownloading(null), 1000)
    }
  }

  async function handleAnnual(fy) {
    setDownloading(fy.key)
    try {
      generateAnnualStatement(transactions, fy.key, fy.label, fy.startDate, fy.endDate, profile)
      const updated = { ...downloads, [fy.key]: new Date().toISOString() }
      setDownloads(updated)
    } finally {
      setTimeout(() => setDownloading(null), 1000)
    }
  }

  const content = (
    <div className="p-6">
      {/* New statement banner */}
      {!downloads[lastMonthKey] && months.length > 0 && (
        <div className="rounded-xl px-5 py-4 flex items-center gap-4 mb-6"
          style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,212,255,0.12)' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#00d4ff" strokeWidth="1.5">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 6v4l2.5 2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{months[0]?.label} statement is ready</p>
            <p className="text-slate-400 text-xs mt-0.5">Your monthly statement has been automatically generated and is ready to download.</p>
          </div>
          <button
            onClick={() => handleMonthly(months[0])}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}>
            Download
          </button>
        </div>
      )}

      {/* Annual statements */}
      {fyears.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Annual statements</p>
          <div className="glass rounded-2xl px-5" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
            {fyears.map(fy => (
              <StatementRow
                key={fy.key}
                label={`${fy.label} Annual Statement`}
                sublabel={`${fy.startDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} – ${fy.endDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                txCount={countTx(fy.startDate, fy.endDate)}
                lastDownloaded={downloads[fy.key]}
                isNew={fy.key === latestFyKey && !downloads[fy.key]}
                onDownload={() => handleAnnual(fy)}
                downloading={downloading === fy.key}
              />
            ))}
          </div>
        </div>
      )}

      {/* Monthly statements */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Monthly statements</p>
        {months.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-slate-500 text-sm">No completed months yet. Your first statement will appear here at the end of the current month.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl px-5" style={{ borderColor: 'rgba(0,212,255,0.12)' }}>
            {months.map(m => {
              const mStart = new Date(m.year, m.month, 1)
              const mEnd   = new Date(m.year, m.month + 1, 0, 23, 59, 59)
              return (
                <StatementRow
                  key={m.key}
                  label={`${m.label} Statement`}
                  sublabel={`${mStart.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${mEnd.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  txCount={countTx(mStart, mEnd)}
                  lastDownloaded={downloads[m.key]}
                  isNew={m.key === lastMonthKey && !downloads[m.key]}
                  onDownload={() => handleMonthly(m)}
                  downloading={downloading === m.key}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  if (!isPremium) {
    return (
      <PremiumGate
        feature="statements"
        description="Upgrade to access automatically generated monthly and annual PDF statements for your full financial history."
      >
        {content}
      </PremiumGate>
    )
  }

  return content
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { profile } = useProfile()
  const { transactions, loading } = useTransactions()
  const isPremium = profile?.subscription_status === 'premium'
  const [tab,       setTab]       = useState('overview')
  const [goals,     setGoals]     = useState([])
  const [netWorth,  setNetWorth]  = useState(null)
  const [exporting, setExporting] = useState(false)

  const monthlyData  = useMemo(() => getMonthlyData(transactions),  [transactions])
  const categoryData = useMemo(() => getCategoryData(transactions), [transactions])

  useEffect(() => {
    if (!isPremium) return
    async function loadExtra() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: g }, { data: nw }] = await Promise.all([
        supabase.from('savings_goals').select('*').eq('user_id', user.id),
        supabase.from('net_worth_snapshots').select('net_worth').eq('user_id', user.id).order('snapshot_date', { ascending: false }).limit(1),
      ])
      setGoals(g || [])
      setNetWorth(nw?.[0]?.net_worth ?? null)
    }
    loadExtra()
  }, [isPremium])

  const healthScore = (() => {
    try { const h = JSON.parse(localStorage.getItem('healthScoreHistory') || '[]'); return h.length ? h[h.length - 1].score : null } catch { return null }
  })()

  const totalIncome  = monthlyData.reduce((s, m) => s + m.income, 0)
  const totalExpense = monthlyData.reduce((s, m) => s + m.expenses, 0)
  const totalSavings = totalIncome - totalExpense
  const avgSavRate   = totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : '0.0'

  function handleExportPDF() {
    setExporting(true)
    try { openFinancialSummaryPDF({ monthlyData, categoryData, profile, netWorth, healthScore, goals }) }
    finally { setTimeout(() => setExporting(false), 1000) }
  }

  const chartData   = isPremium ? monthlyData  : PLACEHOLDER_MONTHS
  const displayCats = isPremium ? categoryData : []

  // Check for new statement available
  const now = new Date()
  const lastMonthKey = `${now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}-${String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, '0')}`
  const statementLog = (() => { try { return JSON.parse(localStorage.getItem('statementDownloads') || '{}') } catch { return {} } })()
  const hasNewStatement = isPremium && !statementLog[lastMonthKey]

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">Reports</h1>
          <p className="text-slate-400 text-sm">12-month history, spending breakdown, PDF export, and statements.</p>
        </div>
        {isPremium && tab === 'overview' && (
          <button
            onClick={handleExportPDF}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10 3v10M6 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 15v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2" strokeLinecap="round" />
            </svg>
            {exporting ? 'Opening…' : 'Download PDF Summary'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
        {[
          { key: 'overview',    label: 'Overview' },
          { key: 'statements',  label: 'Statements', badge: hasNewStatement },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={tab === t.key
              ? { background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', color: '#fff' }
              : { color: '#64748b' }
            }
          >
            {t.label}
            {t.badge && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400"
                style={{ boxShadow: '0 0 6px #00d4ff' }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === 'overview' && (
        <>
          {/* KPI strip */}
          {isPremium ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: '12-mo income',    value: fmt(totalIncome),  color: '#00d4ff' },
                { label: '12-mo expenses',  value: fmt(totalExpense), color: '#e040fb' },
                { label: '12-mo savings',   value: fmt(totalSavings), color: totalSavings >= 0 ? '#7c3aed' : '#f43f5e' },
                { label: 'Avg savings rate', value: `${avgSavRate}%`, color: '#00d4ff' },
              ].map(k => (
                <div key={k.label} className="glass rounded-2xl p-5 text-center">
                  <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">{k.label}</p>
                  <p className="text-2xl font-bold" style={{ color: k.color }}>{loading ? '—' : k.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {['12-mo income', '12-mo expenses', '12-mo savings', 'Avg savings rate'].map(label => (
                <div key={label} className="glass rounded-2xl p-5 text-center">
                  <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">{label}</p>
                  <p className="text-2xl font-bold text-slate-700">——</p>
                </div>
              ))}
            </div>
          )}

          {/* Income vs Expenses chart */}
          {isPremium ? (
            <div className="glass rounded-2xl p-6 mb-6">
              <h2 className="text-white font-semibold mb-1">Income vs Expenses — last 12 months</h2>
              <p className="text-slate-500 text-xs mb-6">Month-by-month breakdown of money in vs money out.</p>
              {loading ? <div className="h-56 flex items-center justify-center text-slate-600 text-sm">Loading…</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => fmt(v)} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={54} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 12 }} />
                    <Bar dataKey="income"   name="Income"   fill="#00d4ff" opacity={0.85} radius={[3,3,0,0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#e040fb" opacity={0.75} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (
            <PremiumGate feature="12-month income vs expenses chart" description="See your full year of income and spending in one view. Spot trends and plan ahead.">
              <div className="p-6">
                <h2 className="text-white font-semibold mb-1">Income vs Expenses — last 12 months</h2>
                <p className="text-slate-500 text-xs mb-6">Month-by-month breakdown</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={PLACEHOLDER_MONTHS} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <Bar dataKey="income"   fill="#00d4ff" opacity={0.5} radius={[3,3,0,0]} />
                    <Bar dataKey="expenses" fill="#e040fb" opacity={0.5} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PremiumGate>
          )}

          {/* Savings rate chart */}
          {isPremium ? (
            <div className="glass rounded-2xl p-6 mb-6">
              <h2 className="text-white font-semibold mb-1">Savings rate trend — last 12 months</h2>
              <p className="text-slate-500 text-xs mb-6">What percentage of your income you kept each month.</p>
              {loading ? <div className="h-48 flex items-center justify-center text-slate-600 text-sm">Loading…</div> : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={<RateTooltip />} />
                    <Line type="monotone" dataKey="savingsRate" name="Savings rate" stroke="#7c3aed" strokeWidth={2.5}
                      dot={{ fill: '#7c3aed', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          ) : (
            <PremiumGate feature="savings rate trend" description="Track whether your savings rate is improving month-over-month.">
              <div className="p-6">
                <h2 className="text-white font-semibold mb-1">Savings rate trend — last 12 months</h2>
                <p className="text-slate-500 text-xs mb-6">Month-by-month savings %</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={PLACEHOLDER_MONTHS}>
                    <Line type="monotone" dataKey="savingsRate" stroke="#7c3aed" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </PremiumGate>
          )}

          {/* Category breakdown */}
          {isPremium ? (
            <div className="glass rounded-2xl p-6 mb-6">
              <h2 className="text-white font-semibold mb-1">Top spending categories — last 12 months</h2>
              <p className="text-slate-500 text-xs mb-5">Where your money went this year.</p>
              {loading ? <div className="text-slate-600 text-sm">Loading…</div> : displayCats.length === 0 ? (
                <p className="text-slate-600 text-sm">No expense data yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {displayCats.slice(0, 8).map(c => (
                    <div key={c.category} className="flex items-center gap-3">
                      <span className="text-slate-300 text-sm w-36 shrink-0 truncate">{c.category}</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-2 rounded-full transition-all duration-700"
                          style={{ width: `${c.pct}%`, background: 'linear-gradient(90deg,#7c3aed,#e040fb)' }} />
                      </div>
                      <span className="text-slate-400 text-sm w-14 text-right shrink-0">{fmt(c.total)}</span>
                      <span className="text-slate-600 text-xs w-10 text-right shrink-0">{c.pct.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <PremiumGate feature="spending category breakdown" description="See exactly which categories are consuming the most of your budget over the full year.">
              <div className="p-6">
                <h2 className="text-white font-semibold mb-5">Top spending categories — last 12 months</h2>
                {['Groceries', 'Rent / Mortgage', 'Dining out', 'Transport', 'Subscriptions'].map((cat, i) => (
                  <div key={cat} className="flex items-center gap-3 mb-3">
                    <span className="text-slate-300 text-sm w-36 shrink-0">{cat}</span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-2 rounded-full" style={{ width: `${80 - i * 14}%`, background: 'linear-gradient(90deg,#7c3aed,#e040fb)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </PremiumGate>
          )}

          {!isPremium && (
            <PremiumGate feature="financial summary PDF" description="Download a clean, printable PDF report of your full financial picture — income, expenses, savings goals, net worth, and retirement projection.">
              <div className="p-8 text-center">
                <p className="text-4xl mb-3">📄</p>
                <h3 className="text-white font-semibold mb-1">Financial Summary Report</h3>
                <p className="text-slate-400 text-sm">One-click PDF of your entire financial picture.</p>
              </div>
            </PremiumGate>
          )}
        </>
      )}

      {/* ── Statements tab ── */}
      {tab === 'statements' && (
        <StatementsTab transactions={transactions} profile={profile} isPremium={isPremium} />
      )}
    </AppLayout>
  )
}
