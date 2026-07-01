import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // If exchange already completed before this component mounted, redirect now
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { navigate('/dashboard', { replace: true }); return }
    })

    // Otherwise wait for Supabase to finish the PKCE code exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard', { replace: true })
      }
    })

    // Safety fallback: if nothing resolves in 10s, go back to login
    const timeout = setTimeout(() => navigate('/login', { replace: true }), 10000)

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#060b1a' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full animate-spin"
          style={{ border: '2px solid rgba(0,212,255,0.2)', borderTopColor: '#00d4ff' }} />
        <p className="text-slate-500 text-sm">Signing you in…</p>
      </div>
    </div>
  )
}
