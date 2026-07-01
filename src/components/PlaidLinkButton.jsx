import { useCallback, useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { supabase } from '../lib/supabase'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

function UpgradePrompt() {
  return (
    <div className="flex flex-col items-center gap-3">
      <a
        href="/upgrade"
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-300 hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
      >
        Upgrade to connect your bank
      </a>
      <p className="text-slate-600 text-xs text-center max-w-xs">Premium feature · $9/month</p>
    </div>
  )
}

export default function PlaidLinkButton({ onSuccess, isPremium }) {
  const [linkToken, setLinkToken] = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [syncing,   setSyncing]   = useState(false)

  const { open, ready } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess: async (public_token, metadata) => {
      setSyncing(true)
      setError(null)
      try {
        const res = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify({
            public_token,
            institution_name: metadata.institution?.name ?? 'Unknown bank',
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Connection failed')
        onSuccess?.()
      } catch (err) {
        setError(err.message)
      } finally {
        setSyncing(false)
        setLinkToken(null)
      }
    },
    onExit: (err) => {
      setLinkToken(null)
      if (err?.display_message) setError(err.display_message)
    },
  })

  // Open Link as soon as the token arrives
  useEffect(() => {
    if (linkToken && ready) open()
  }, [linkToken, ready, open])

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: await authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not start connection')
      setLinkToken(data.link_token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isPremium) return <UpgradePrompt />

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleConnect}
        disabled={loading || syncing}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-300 hover:scale-105 hover:glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
      >
        {/* Bank icon */}
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M2 7l8-4 8 4v1H2V7z" strokeLinejoin="round" />
          <path d="M4 8v7M8 8v7M12 8v7M16 8v7" strokeLinecap="round" />
          <path d="M2 15h16v2H2z" strokeLinejoin="round" />
        </svg>
        {syncing ? 'Importing transactions…' : loading ? 'Starting…' : 'Connect your bank'}
      </button>
      {error && (
        <p className="text-red-400 text-xs text-center max-w-xs">{error}</p>
      )}
      <p className="text-slate-600 text-xs text-center max-w-xs">
        Powered by Plaid · Bank-grade 256-bit encryption · We never store your credentials
      </p>
    </div>
  )
}
