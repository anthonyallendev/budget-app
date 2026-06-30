import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTransactions } from '../hooks/useTransactions'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'
import BudgetRatioPanel from '../components/BudgetRatioPanel'
import RetirementPanel from '../components/RetirementPanel'
import SpendingCharts from '../components/SpendingCharts'

function getMonthStats(transactions) {
  const now = new Date()
  const thisMonth = transactions.filter(tx => {
    const d = new Date(tx.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const spent   = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  const earned  = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
  const savings = earned - spent
  return { spent, earned, savings }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions()
  const { spent, earned, savings } = getMonthStats(transactions)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const fmt = n => `$${Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="min-h-screen bg-space-900 text-white flex flex-col">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-[20%] w-[500px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #00d4ff, transparent 70%)' }} />
        <div className="absolute bottom-0 left-[10%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 glass border-b border-cyan-glow/10">
        <span className="text-lg font-bold text-gradient">BudgetApp</span>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Log out
        </button>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-slate-400 mb-8 text-sm">Your financial overview for {new Date().toLocaleString('en-AU', { month: 'long', year: 'numeric' })}</p>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Spent this month',  value: fmt(spent),   accent: '#e040fb', prefix: '-' },
            { label: 'Earned this month', value: fmt(earned),  accent: '#00d4ff', prefix: '+' },
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

        {/* Charts */}
        <SpendingCharts transactions={transactions} />

        {/* Budget ratio */}
        <BudgetRatioPanel />

        {/* Retirement estimate */}
        <RetirementPanel transactions={transactions} />

        {/* Form + List */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          <TransactionForm onAdd={addTransaction} />
          <TransactionList transactions={transactions} onDelete={deleteTransaction} />
        </div>
      </main>
    </div>
  )
}
