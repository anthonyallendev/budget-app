import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import SpendingCharts from '../components/SpendingCharts'
import SpendingInsights from '../components/SpendingInsights'
import RetirementHero from '../components/RetirementHero'
import OnboardingChecklist from '../components/OnboardingChecklist'
import CheckInStreak from '../components/CheckInStreak'
import SpendingPace from '../components/SpendingPace'
import UpcomingBillsWidget from '../components/UpcomingBillsWidget'
import WeeklyCheckIn from '../components/WeeklyCheckIn'
import GoalQuickDeposit from '../components/GoalQuickDeposit'
import MilestoneBanner from '../components/MilestoneBanner'
import FinancialHealthScore from '../components/FinancialHealthScore'
import InterestRateWidget from '../components/InterestRateWidget'
import { useTransactions } from '../hooks/useTransactions'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

function getMonthStats(transactions) {
  const now = new Date()
  const thisMonth = transactions.filter(tx => {
    const d = new Date(tx.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const spent   = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  const earned  = thisMonth.filter(t => t.type === 'income').reduce((s, t)  => s + parseFloat(t.amount), 0)
  const surplus = earned - spent
  return { spent, earned, surplus }
}

function getLastMonthStats(transactions) {
  const now = new Date()
  const lastMonth = transactions.filter(tx => {
    const d = new Date(tx.date)
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear()
  })
  const spent  = lastMonth.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  const earned = lastMonth.filter(t => t.type === 'income').reduce((s, t)  => s + parseFloat(t.amount), 0)
  return { spent, earned }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { transactions, loading } = useTransactions()
  const { profile } = useProfile()
  const [hasGoal, setHasGoal] = useState(false)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('savings_goals').select('id').eq('user_id', user.id).limit(1)
        .then(({ data }) => setHasGoal(!!(data && data.length > 0)))
    })
  }, [])
  const { spent, earned, surplus } = getMonthStats(transactions)
  const last = getLastMonthStats(transactions)
  const fmt = n => `$${Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const pctChange = (curr, prev) => prev === 0 ? null : Math.round(((curr - prev) / prev) * 100)

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

      {/* Onboarding checklist — hides once all steps complete */}
      <OnboardingChecklist profile={profile} transactions={transactions} hasGoal={hasGoal} />

      {/* Cash flow summary + retirement age */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Income this month', value: fmt(earned), accent: '#00d4ff', prefix: '+',
            change: pctChange(earned, last.earned), changeLabel: 'vs last month',
          },
          {
            label: 'Spent this month', value: fmt(spent), accent: '#e040fb', prefix: '-',
            change: pctChange(spent, last.spent), changeLabel: 'vs last month',
          },
          {
            label: surplus >= 0 ? 'Surplus' : 'Deficit',
            value: fmt(surplus),
            accent: surplus >= 0 ? '#7c3aed' : '#f43f5e',
            prefix: surplus >= 0 ? '+' : '-',
            change: null, changeLabel: 'income minus expenses',
          },
        ].map(card => (
          <div key={card.label} className="glass rounded-2xl p-6">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">{card.label}</p>
            {loading
              ? <div className="h-8 w-24 rounded bg-white/5 animate-pulse" />
              : <>
                  <p className="text-3xl font-bold" style={{ color: card.accent, textShadow: `0 0 20px ${card.accent}50` }}>
                    {card.prefix}{card.value}
                  </p>
                  <p className="text-xs mt-2" style={{ color: card.change == null ? '#475569' : card.change > 0 ? '#f43f5e' : '#22d3ee' }}>
                    {card.change != null
                      ? `${card.change > 0 ? '▲' : '▼'} ${Math.abs(card.change)}% ${card.changeLabel}`
                      : card.changeLabel}
                  </p>
                </>
            }
          </div>
        ))}
        <RetirementHero compact />
      </div>

      {/* Milestone banners — goal completions, net worth highs, debt milestones */}
      <div className="mb-6">
        <MilestoneBanner transactions={transactions} />
      </div>

      {/* Engagement row: streak + health score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <CheckInStreak />
        <FinancialHealthScore transactions={transactions} />
      </div>

      {/* Weekly check-in modal trigger */}
      <div className="mb-6">
        <WeeklyCheckIn />
      </div>

      {/* Spending pace */}
      <div className="mb-6">
        <SpendingPace transactions={transactions} />
      </div>

      {/* Utility row: goals quick-deposit + upcoming bills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <GoalQuickDeposit />
        <UpcomingBillsWidget />
      </div>

      {/* Interest rates context */}
      <div className="mb-6">
        <InterestRateWidget />
      </div>

      {/* Spending insights */}
      <SpendingInsights transactions={transactions} />

      {/* Charts */}
      <SpendingCharts transactions={transactions} />
    </AppLayout>
  )
}
