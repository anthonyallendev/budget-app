import { useState } from 'react'
import { supabase } from '../lib/supabase'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

const inputStyle = {
  background: 'rgba(6,11,26,0.8)',
  border: '1px solid rgba(168,85,247,0.2)',
}

export default function BasiqLinkButton() {
  const [step,   setStep]   = useState('idle') // idle | needs-mobile | loading
  const [mobile, setMobile] = useState('')
  const [error,  setError]  = useState(null)

  async function handleConnect() {
    setError(null)

    // Check if user already has mobile saved
    const { data: { session } } = await supabase.auth.getSession()
    const { data: profile } = await supabase
      .from('profiles')
      .select('mobile')
      .eq('id', session.user.id)
      .single()

    if (!profile?.mobile) {
      setStep('needs-mobile')
      return
    }

    await openConnect()
  }

  async function handleMobileSubmit(e) {
    e.preventDefault()
    const trimmed = mobile.trim()
    if (!trimmed) return

    setError(null)

    // Save mobile to profile
    const { data: { session } } = await supabase.auth.getSession()
    const { error: saveErr } = await supabase
      .from('profiles')
      .update({ mobile: trimmed })
      .eq('id', session.user.id)

    if (saveErr) { setError('Could not save mobile — please try again'); return }

    await openConnect()
  }

  async function openConnect() {
    setStep('loading')
    try {
      const res = await fetch('/api/basiq/create-connect-url', {
        method: 'POST',
        headers: await authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start connection')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setStep('idle')
    }
  }

  if (step === 'needs-mobile') {
    return (
      <form onSubmit={handleMobileSubmit} className="flex flex-col gap-3 w-full">
        <p className="text-slate-400 text-xs">
          Your mobile number is needed for bank verification.
        </p>
        <input
          type="tel"
          placeholder="+61 400 000 000"
          value={mobile}
          onChange={e => setMobile(e.target.value)}
          autoFocus
          className="rounded-lg px-4 py-2.5 text-white text-sm outline-none w-full"
          style={inputStyle}
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={!mobile.trim()}
          className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
        >
          Continue →
        </button>
      </form>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleConnect}
        disabled={step === 'loading'}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M2 7l8-4 8 4v1H2V7z" strokeLinejoin="round" />
          <path d="M4 8v7M8 8v7M12 8v7M16 8v7" strokeLinecap="round" />
          <path d="M2 15h16v2H2z" strokeLinejoin="round" />
        </svg>
        {step === 'loading' ? 'Opening…' : 'Connect Australian bank'}
      </button>
      {error && <p className="text-red-400 text-xs text-center max-w-xs">{error}</p>}
      <p className="text-slate-600 text-xs text-center max-w-xs">
        Powered by Basiq · Supports 100+ Australian banks
      </p>
    </div>
  )
}
