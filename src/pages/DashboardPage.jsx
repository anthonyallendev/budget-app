import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import SpendingCharts from '../components/SpendingCharts'
import RetirementHero from '../components/RetirementHero'
import { useTransactions } from '../hooks/useTransactions'

function getMonthStats(transactions) {
  const now = new Date()
  const thisMonth = transactions.filter(tx => {
    const d = new Date(tx.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const spent   = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  const earned  = thisMonth.filter(t => t.type === 'income').reduce((s, t)  => s + parseFloat(t.amount), 0)
  const savings = earned - spent
  return { spent, savings }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { transactions, loading } = useTransactions()
  const { spent, savings } = getMonthStats(transactions)
  const fmt = n => `$${Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const [showUpgradedBanner, setShowUpgradedBanner] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      setShowUpgradedBanner(true)
      window.history.replaceState({}, '', '/dashboard')
      setTimeout(() => setShowUpgradedBanner(false), 6000)
    }
  }, [])

  return (
    <AppLayout>
      {showUpgradedBanner && (
        <div className="mb-6 glass rounded-xl px-5 py-3 text-sm flex items-center gap-3"
          style={{ borderColor: 'rgba(0,212,255,0.3)', color: '#00d4ff' }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.5l-4.9 2.7.9-5.5L2 7.8l5.5-.8z" strokeLinejoin="round" />
          </svg>
          Welcome to Premium! Head to Transactions to connect your bank.
        </div>
      )}
      <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
      <p className="text-slate-400 text-sm mb-8">
        {new Date().toLocaleString('en-AU', { month: 'long', year: 'numeric' })}
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Spent this month',  value: fmt(spent),   accent: '#e040fb', prefix: '-' },
          { label: 'Net savings',       value: fmt(savings), accent: savings >= 0 ? '#00d4ff' : '#e040fb', prefix: savings >= 0 ? '+' : '-' },
        ].map(card => (
          <div key={card.label} className="glass rounded-2xl p-6" style={{ borderColor: `${card.accent}20` }}>
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">{card.label}</p>
            {loading
              ? <div className="h-8 w-24 rounded bg-white/5 animate-pulse" />
              : <p className="text-3xl font-bold" style={{ color: card.accent, textShadow: `0 0 20px ${card.accent}50` }}>
                  {card.prefix}{card.value}
                </p>
            }
          </div>
        ))}
      </div>

      {/* Retirement hero — the big number */}
      <div className="mb-6">
        <RetirementHero />
      </div>

      {/* Charts */}
      <SpendingCharts transactions={transactions} />
    </AppLayout>
  )
}
