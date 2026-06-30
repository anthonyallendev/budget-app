import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NAV = [
  { to: '/dashboard',      label: 'Dashboard',      icon: '📊' },
  { to: '/transactions',   label: 'Transactions',   icon: '💳' },
  { to: '/budget-targets', label: 'Budget Targets', icon: '🎯' },
  { to: '/budget-limits',  label: 'Budget Limits',  icon: '📋' },
]

export default function AppLayout({ children }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-space-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 glass border-b border-cyan-glow/10">
        <span className="text-lg font-bold text-gradient">Retirely.money</span>
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Open menu"
        >
          <span className="w-5 h-0.5 bg-slate-400 rounded-full" />
          <span className="w-5 h-0.5 bg-slate-400 rounded-full" />
          <span className="w-5 h-0.5 bg-slate-400 rounded-full" />
        </button>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className="fixed top-0 right-0 h-full w-72 z-50 flex flex-col transition-transform duration-300"
        style={{
          background: 'rgba(6,11,26,0.97)',
          borderLeft: '1px solid rgba(0,212,255,0.1)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <span className="text-lg font-bold text-gradient">Retirely.money</span>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-500 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 p-4 flex-1">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive
                ? { background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', borderLeft: '2px solid #00d4ff' }
                : {}
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
          >
            <span>🚪</span>
            Log out
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="relative z-10 pt-20 p-6 md:p-8 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  )
}
