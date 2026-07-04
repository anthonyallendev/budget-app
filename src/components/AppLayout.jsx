import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'

// ── HUD-style SVG icons ──────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      {/* Corner ticks */}
      <path d="M2 5V2H5" strokeLinecap="round" />
      <path d="M15 2H18V5" strokeLinecap="round" />
      <path d="M18 15V18H15" strokeLinecap="round" />
      <path d="M5 18H2V15" strokeLinecap="round" />
      {/* 3-bar chart */}
      <rect x="4.5" y="12" width="2.5" height="4"   rx="0.4" strokeWidth="1" />
      <rect x="8.75" y="8.5" width="2.5" height="7.5" rx="0.4" strokeWidth="1" />
      <rect x="13" y="5.5" width="2.5" height="10.5" rx="0.4" strokeWidth="1" />
    </svg>
  )
}

function IconRetirement() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      {/* Diamond */}
      <path d="M10 2L18 10L10 18L2 10Z" strokeLinejoin="round" />
      {/* Inner diamond */}
      <path d="M10 6L14 10L10 14L6 10Z" strokeLinejoin="round" strokeWidth="0.8" />
      {/* Centre dot */}
      <circle cx="10" cy="10" r="1.2" fill="currentColor" strokeWidth="0" />
    </svg>
  )
}

function IconTransactions() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      {/* Hexagon */}
      <path d="M10 2L17.3 6V14L10 18L2.7 14V6Z" strokeLinejoin="round" />
      {/* Up arrow */}
      <path d="M10 13V8" strokeLinecap="round" />
      <path d="M7.5 10.5L10 8L12.5 10.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Bottom tick */}
      <path d="M8 14.5H12" strokeLinecap="round" strokeWidth="0.9" />
    </svg>
  )
}

function IconBudgetTargets() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      {/* Outer ring with gaps */}
      <path d="M10 2.5A7.5 7.5 0 0 1 17.5 10" strokeLinecap="round" />
      <path d="M17.5 10A7.5 7.5 0 0 1 10 17.5" strokeLinecap="round" />
      <path d="M10 17.5A7.5 7.5 0 0 1 2.5 10" strokeLinecap="round" />
      <path d="M2.5 10A7.5 7.5 0 0 1 10 2.5" strokeLinecap="round" />
      {/* Middle ring */}
      <circle cx="10" cy="10" r="4.5" strokeWidth="0.9" />
      {/* Centre dot */}
      <circle cx="10" cy="10" r="1.3" fill="currentColor" strokeWidth="0" />
    </svg>
  )
}

function IconBudgetLimits() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      {/* Corner marks */}
      <path d="M2 4.5H4" strokeLinecap="round" strokeWidth="1" />
      <path d="M2 10H4"  strokeLinecap="round" strokeWidth="1" />
      <path d="M2 15.5H4" strokeLinecap="round" strokeWidth="1" />
      {/* Bars */}
      <path d="M6 4.5H16"   strokeLinecap="round" strokeWidth="1.4" />
      <path d="M6 10H13"    strokeLinecap="round" strokeWidth="1.4" />
      <path d="M6 15.5H10" strokeLinecap="round" strokeWidth="1.4" />
      {/* End caps */}
      <circle cx="16" cy="4.5"  r="1"   fill="currentColor" strokeWidth="0" />
      <circle cx="13" cy="10"   r="1"   fill="currentColor" strokeWidth="0" />
      <circle cx="10" cy="15.5" r="1"   fill="currentColor" strokeWidth="0" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M8 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4" strokeLinecap="round" />
      <path d="M13 14l4-4-4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 10H8" strokeLinecap="round" />
    </svg>
  )
}

// ── Hamburger icon ───────────────────────────────────────────────────────────

function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
      {/* Corner ticks */}
      <path d="M1 3.5H3" strokeLinecap="round" />
      <path d="M19 3.5H21" strokeLinecap="round" />
      <path d="M1 18.5H3" strokeLinecap="round" />
      <path d="M19 18.5H21" strokeLinecap="round" />
      {/* Lines */}
      <path d="M5 3.5H17"  strokeLinecap="round" strokeWidth="1.2" />
      <path d="M5 11H17"  strokeLinecap="round" strokeWidth="1.2" />
      <path d="M5 18.5H13" strokeLinecap="round" strokeWidth="1.2" />
    </svg>
  )
}

// ── Nav config ───────────────────────────────────────────────────────────────

function IconInvesting() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <polyline points="2,14 7,9 11,12 18,5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 5h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconTax() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="2" width="14" height="16" rx="1.5" />
      <path d="M7 6h6M7 10h6M7 14h4" strokeLinecap="round" />
    </svg>
  )
}

function IconDebt() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6.5v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconGoals() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M4 10h12M10 4v12" strokeLinecap="round" />
      <circle cx="10" cy="10" r="7.5" />
      <circle cx="10" cy="10" r="3" />
    </svg>
  )
}

function IconNetWorth() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 16l4-5 4 2 4-7 4 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 18h16" strokeLinecap="round" />
    </svg>
  )
}

function IconBills() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="3" width="14" height="14" rx="1.5" />
      <path d="M7 7h2M7 10h6M7 13h4" strokeLinecap="round" />
      <circle cx="14.5" cy="7" r="1" fill="currentColor" strokeWidth="0" />
    </svg>
  )
}

function IconLeaderboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M10 2l2.2 4.5 5 .7-3.6 3.5.85 4.9L10 13.3l-4.45 2.3.85-4.9L2.8 7.2l5-.7z" strokeLinejoin="round" />
    </svg>
  )
}

function IconReports() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="2" width="14" height="16" rx="1.5" />
      <path d="M7 6h6M7 9.5h6M7 13h4" strokeLinecap="round" />
      <path d="M12 13h2v3h-2z" strokeLinejoin="round" strokeWidth="1" />
    </svg>
  )
}

function IconReferral() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      {/* Two people */}
      <circle cx="6.5" cy="6" r="2.5" />
      <path d="M2 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" strokeLinecap="round" />
      {/* Plus / add person on right */}
      <circle cx="14.5" cy="6" r="2.5" />
      <path d="M12 16c0-2.5 1.8-4 4-4" strokeLinecap="round" />
      {/* Link arrow */}
      <path d="M10 9l2.5 1.5" strokeLinecap="round" strokeWidth="0.9" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2" strokeLinecap="round" />
      <path d="M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" strokeLinecap="round" />
    </svg>
  )
}

const NAV = [
  { to: '/dashboard',      label: 'Dashboard',      Icon: IconDashboard      },
  { to: '/retirement',     label: 'Retirement',     Icon: IconRetirement     },
  { to: '/transactions',   label: 'Transactions',   Icon: IconTransactions   },
  { to: '/budget-targets', label: 'Budget Targets', Icon: IconBudgetTargets  },
  { to: '/budget-limits',  label: 'Budget Limits',  Icon: IconBudgetLimits   },
  { to: '/investing',      label: 'Investing',      Icon: IconInvesting      },
  { to: '/savings-goals',  label: 'Savings Goals',  Icon: IconGoals          },
  { to: '/net-worth',      label: 'Net Worth',      Icon: IconNetWorth       },
  { to: '/tax',            label: 'Tax Estimate',   Icon: IconTax            },
  { to: '/debt',           label: 'Debt Payoff',    Icon: IconDebt           },
  { to: '/bills',          label: 'Bills',          Icon: IconBills          },
  { to: '/leaderboard',   label: 'Leaderboard',    Icon: IconLeaderboard    },
  { to: '/reports',       label: 'Reports',        Icon: IconReports        },
  { to: '/referrals',    label: 'Refer & Earn',   Icon: IconReferral       },
  { to: '/settings',    label: 'Settings',       Icon: IconSettings       },
]

// ── Layout ───────────────────────────────────────────────────────────────────

export default function AppLayout({ children }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { profile } = useProfile()
  const isPremium = profile?.subscription_status === 'premium'

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-space-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 glass border-b border-cyan-glow/10">
        <span className="text-xl font-bold text-gradient">Retirely</span>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors"
          aria-label="Open menu"
        >
          <IconMenu />
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
          <span className="text-3xl font-bold text-gradient">Retirely</span>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-500 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-cyan-400'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive
                ? {
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(124,58,237,0.12))',
                    borderLeft: '2px solid #00d4ff',
                    filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.3))',
                  }
                : {}
              }
            >
              {({ isActive }) => (
                <>
                  <span style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.8))' } : {}}>
                    <Icon />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* About + Upgrade + Logout */}
        <div className="p-4 border-t border-white/5 flex flex-col gap-1">
          {isPremium ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.08))', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.3">
                <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.5l-4.9 2.7.9-5.5L2 7.8l5.5-.8z" strokeLinejoin="round" />
              </svg>
              Premium
              <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 6px #00d4ff' }} />
            </div>
          ) : (
            <NavLink
              to="/upgrade"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={({ isActive }) => isActive
                ? { background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))', color: '#00d4ff' }
                : { background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.08))', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }
              }
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.5l-4.9 2.7.9-5.5L2 7.8l5.5-.8z" strokeLinejoin="round" />
              </svg>
              Upgrade to Premium
            </NavLink>
          )}
          <NavLink
            to="/about"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all duration-200"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 9v5" strokeLinecap="round" />
              <circle cx="10" cy="6.5" r="0.75" fill="currentColor" strokeWidth="0" />
            </svg>
            About Retirely
          </NavLink>
          <NavLink
            to="/privacy"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all duration-200"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M10 2l6 2.5v5c0 3.8-2.5 7-6 8.5C6.5 16.5 4 13.3 4 9.5v-5L10 2z" strokeLinejoin="round" />
              <path d="M7.5 10l2 2 3-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Privacy Policy
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
          >
            <IconLogout />
            Log out
          </button>
        </div>
      </aside>

      {/* Page content — fixed scroll container so content clips at the header bottom */}
      <main
        className="fixed inset-x-0 bottom-0 z-10 overflow-y-auto overflow-x-hidden"
        style={{ top: '73px' }}
      >
        <div className="pt-6 pb-8 px-6 md:px-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
