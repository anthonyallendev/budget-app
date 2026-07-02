import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    // Persist ?ref=CODE from URL into localStorage so it survives page transitions
    const ref = searchParams.get('ref')
    if (ref) localStorage.setItem('referralCode', ref.toUpperCase().trim())
  }, [searchParams])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message || error.code || JSON.stringify(error))
      else navigate('/dashboard')
    } else {
      const { data: signUpData, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message || error.code || JSON.stringify(error))
      } else {
        // Record referral attribution in background (non-blocking)
        const storedRef = localStorage.getItem('referralCode')
        if (storedRef && signUpData?.session) {
          fetch('/api/referral/record-signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${signUpData.session.access_token}`,
            },
            body: JSON.stringify({ referralCode: storedRef }),
          }).then(() => localStorage.removeItem('referralCode')).catch(() => {})
        }
        setMessage('Check your email to confirm your account, then log in.')
      }
    }

    setLoading(false)
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-space-900 flex items-center justify-center px-4 overflow-hidden">

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold text-gradient">Retirely</Link>
          <h1 className="text-white text-2xl font-semibold mt-5">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {mode === 'login' ? 'Sign in to your dashboard' : 'Start your financial journey'}
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-7 flex flex-col gap-5">
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm text-red-300 border border-red-500/30"
              style={{ background: 'rgba(239,68,68,0.1)' }}>
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg px-4 py-3 text-sm text-cyan-300 border border-cyan-glow/30"
              style={{ background: 'rgba(0,212,255,0.08)' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-sm">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-lg px-4 py-2.5 text-white text-sm outline-none transition-all duration-200 focus:border-cyan-glow/60"
                style={{
                  background: 'rgba(6,11,26,0.8)',
                  border: '1px solid rgba(0,212,255,0.18)',
                }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'}
                onBlur={e => e.target.style.boxShadow = 'none'}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-sm">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg px-4 py-2.5 text-white text-sm outline-none transition-all duration-200"
                style={{
                  background: 'rgba(6,11,26,0.8)',
                  border: '1px solid rgba(0,212,255,0.18)',
                }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'}
                onBlur={e => e.target.style.boxShadow = 'none'}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 rounded-lg font-semibold text-white text-sm transition-all duration-300 hover:scale-[1.02] hover:glow-cyan disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-slate-600 text-xs">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white transition-all duration-200 hover:border-slate-500"
            style={{
              background: 'rgba(6,11,26,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
              <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-slate-500 text-sm">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }}
              className="text-cyan-glow hover:underline font-medium"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
