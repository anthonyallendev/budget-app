import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

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
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm hidden sm:block">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Log out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 p-8 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-1">
          Good morning 👋
        </h1>
        <p className="text-slate-400 mb-8 text-sm">
          Here's your financial overview for today.
        </p>

        {/* Placeholder stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Monthly spending', value: '$0.00', accent: '#00d4ff' },
            { label: 'Budget remaining', value: '$0.00', accent: '#7c3aed' },
            { label: 'Net savings', value: '$0.00', accent: '#e040fb' },
          ].map(card => (
            <div
              key={card.label}
              className="glass rounded-2xl p-6"
              style={{ borderColor: `${card.accent}20` }}
            >
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">{card.label}</p>
              <p
                className="text-3xl font-bold"
                style={{ color: card.accent, textShadow: `0 0 20px ${card.accent}50` }}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Coming soon area */}
        <div className="glass rounded-2xl p-10 text-center" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-xl font-semibold mb-2">Dashboard coming soon</h2>
          <p className="text-slate-400 text-sm">
            Connect your bank and your spending charts will appear here.
          </p>
        </div>
      </main>
    </div>
  )
}
