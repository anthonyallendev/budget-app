import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PrivateRoute({ children }) {
  const [session, setSession]   = useState(undefined)
  const [profile, setProfile]   = useState(undefined)
  const location = useLocation()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
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
