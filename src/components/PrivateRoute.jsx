import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PrivateRoute({ children }) {
  const [session, setSession]   = useState(undefined)
  const [profile, setProfile]   = useState(undefined)
  const location = useLocation()

  // True when the URL contains OAuth callback params being processed by Supabase.
  // PKCE flow uses ?code=, implicit flow uses #access_token=.
  // We check once on mount — by the time SIGNED_IN fires the params are gone.
  const hasOAuthParams =
    window.location.search.includes('code=') ||
    window.location.hash.includes('access_token=')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      // While an OAuth code exchange is in flight, Supabase fires INITIAL_SESSION
      // with a null session before it has finished. Ignoring that null lets us
      // stay on the loading screen until the real SIGNED_IN event arrives.
      if (event === 'INITIAL_SESSION' && !s && hasOAuthParams) return

      setSession(s)
      if (!s) { setProfile(null); return }
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', s.user.id)
        .maybeSingle()
        .then(({ data: p }) => setProfile(p ?? null))
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined || profile === undefined) {
    return (
      <div className="min-h-screen bg-space-900 flex items-center justify-center">
        <div className="text-slate-500">Loading…</div>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (!profile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
