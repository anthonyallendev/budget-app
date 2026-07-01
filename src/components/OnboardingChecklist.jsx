import { Link } from 'react-router-dom'

const STEPS = [
  { key: 'profile',      label: 'Set up your profile',          link: '/onboarding',     desc: 'Add your name, DOB, and country.' },
  { key: 'transaction',  label: 'Add your first transaction',   link: '/transactions',   desc: 'Enter income or an expense manually.' },
  { key: 'budget',       label: 'Set a budget limit',           link: '/budget-limits',  desc: 'Cap spending in a category.' },
  { key: 'retirement',   label: 'Configure retirement goal',    link: '/retirement',     desc: 'Enter your salary and savings target.' },
  { key: 'bank',         label: 'Connect your bank',            link: '/transactions',   desc: 'Sync transactions automatically. Premium feature.' },
  { key: 'goal',         label: 'Create a savings goal',        link: '/savings-goals',  desc: 'Track progress toward something you want.' },
]

export default function OnboardingChecklist({ profile, transactions, hasGoal }) {
  const checks = {
    profile:      !!(profile?.full_name && profile?.date_of_birth),
    transaction:  transactions.length > 0,
    budget:       !!(() => { try { const b = JSON.parse(localStorage.getItem('budgetLimits')); return b && Object.keys(b).length > 0 } catch { return false } })(),
    retirement:   !!(profile?.annual_salary),
    bank:         transactions.some(t => t.source === 'plaid' || t.source === 'basiq'),
    goal:         !!hasGoal,
  }

  const done  = Object.values(checks).filter(Boolean).length
  const total = STEPS.length
  if (done === total) return null

  const pct = Math.round((done / total) * 100)

  return (
    <div className="glass rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-white font-semibold">Getting started</h2>
        <span className="text-xs text-slate-500">{done} / {total} complete</span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#00d4ff,#7c3aed)', boxShadow: '0 0 8px rgba(0,212,255,0.4)' }} />
      </div>
      <div className="flex flex-col gap-2">
        {STEPS.map(step => {
          const complete = checks[step.key]
          return (
            <Link key={step.key} to={step.link}
              className="flex items-center gap-4 py-2.5 px-3 rounded-xl transition-all hover:bg-white/[0.03]">
              <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                style={complete
                  ? { background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', boxShadow: '0 0 8px rgba(0,212,255,0.3)' }
                  : { border: '1px solid rgba(255,255,255,0.15)' }}>
                {complete && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M1.5 5l2.5 2.5L8.5 2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${complete ? 'text-slate-500 line-through' : 'text-white'}`}>
                  {step.label}
                </p>
                {!complete && <p className="text-xs text-slate-600 mt-0.5">{step.desc}</p>}
              </div>
              {!complete && (
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#475569" strokeWidth="1.5">
                  <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
