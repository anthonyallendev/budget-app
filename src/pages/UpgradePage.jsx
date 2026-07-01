import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
}

const FREE_FEATURES = [
  'Dashboard & retirement calculator',
  'Manual transaction entry',
  'Budget targets & limits',
  'Retirement projections',
]

const PREMIUM_FEATURES = [
  'Everything in Free',
  'Bank sync — US, UK & Canada (Plaid)',
  'Bank sync — Australia (Basiq)',
  'Automatic transaction import',
  'CSV data export',
  'Priority support',
]

export default function UpgradePage() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [plan,    setPlan]    = useState('monthly')
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const isPremium = profile?.subscription_status === 'premium'

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start checkout')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: await authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setPortalLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3" style={{
            background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {isPremium ? 'You\'re on Premium' : 'Upgrade to Premium'}
          </h1>
          <p className="text-slate-400 text-lg">
            {isPremium
              ? 'Manage your subscription below.'
              : 'Connect your bank and let Retirely do the heavy lifting.'}
          </p>
        </div>

        {isPremium ? (
          <div className="glass rounded-2xl p-10 text-center flex flex-col items-center gap-6"
            style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))', border: '1px solid rgba(0,212,255,0.3)' }}>
              <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="#00d4ff" strokeWidth="1.5">
                <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-lg mb-1">Active subscription</p>
              <p className="text-slate-400 text-sm">You have full access to all Premium features.</p>
            </div>
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="px-6 py-3 rounded-xl text-sm font-medium glass text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              {portalLoading ? 'Opening…' : 'Manage subscription →'}
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        ) : (
          <>
            {/* Plan toggle */}
            <div className="flex justify-center mb-8">
              <div className="flex glass rounded-xl p-1 gap-1">
                {[['monthly', '$9 / month'], ['yearly', '$79 / year']].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setPlan(key)}
                    className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={plan === key
                      ? { background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', color: 'white' }
                      : { color: '#64748b' }
                    }
                  >
                    {label}
                    {key === 'yearly' && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}>
                        Save 26%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan cards */}
            <div className="grid sm:grid-cols-2 gap-5 mb-8">
              {/* Free */}
              <div className="glass rounded-2xl p-7 flex flex-col gap-5">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Free</p>
                  <p className="text-4xl font-black text-white">$0</p>
                  <p className="text-slate-600 text-sm mt-1">Forever</p>
                </div>
                <ul className="flex flex-col gap-2.5 flex-1">
                  {FREE_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                      <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="rgba(100,116,139,0.4)" />
                        <path d="M5 8l2 2 4-4" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="py-2.5 rounded-xl text-center text-sm text-slate-500 glass">
                  Current plan
                </div>
              </div>

              {/* Premium */}
              <div className="rounded-2xl p-7 flex flex-col gap-5 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.12))', border: '1px solid rgba(0,212,255,0.25)' }}>
                <div className="absolute top-4 right-4 text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', color: 'white' }}>
                  Premium
                </div>
                <div>
                  <p className="text-cyan-400 text-sm font-medium mb-1">Premium</p>
                  <p className="text-4xl font-black text-white">
                    {plan === 'yearly' ? '$79' : '$9'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {plan === 'yearly' ? 'per year · ~$6.58/mo' : 'per month'}
                  </p>
                </div>
                <ul className="flex flex-col gap-2.5 flex-1">
                  {PREMIUM_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="rgba(0,212,255,0.4)" />
                        <path d="M5 8l2 2 4-4" stroke="#00d4ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
                >
                  {loading ? 'Redirecting…' : `Get Premium — ${plan === 'yearly' ? '$79/yr' : '$9/mo'}`}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-center text-red-400 text-sm">{error}</p>
            )}

            <p className="text-center text-slate-600 text-xs">
              Cancel anytime · Secure payment via Stripe · No hidden fees
            </p>
          </>
        )}
      </div>
    </AppLayout>
  )
}
