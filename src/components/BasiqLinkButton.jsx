import { useState } from 'react'
import { supabase } from '../lib/supabase'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

export default function BasiqLinkButton() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleConnect() {
    setLoading(true)
    setError(null)
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
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M2 7l8-4 8 4v1H2V7z" strokeLinejoin="round" />
          <path d="M4 8v7M8 8v7M12 8v7M16 8v7" strokeLinecap="round" />
          <path d="M2 15h16v2H2z" strokeLinejoin="round" />
        </svg>
        {loading ? 'Opening…' : 'Connect Australian bank'}
      </button>
      {error && <p className="text-red-400 text-xs text-center max-w-xs">{error}</p>}
      <p className="text-slate-600 text-xs text-center max-w-xs">
        Powered by Basiq · Supports 100+ Australian banks
      </p>
    </div>
  )
}
