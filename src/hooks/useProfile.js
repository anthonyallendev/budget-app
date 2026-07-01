import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { if (mounted) setLoading(false); return }
      supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .maybeSingle()
        .then(({ data: p }) => {
          if (mounted) { setProfile(p); setLoading(false) }
        })
    })
    return () => { mounted = false }
  }, [])

  async function saveProfile(updates) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { data: null, error: { message: 'Not signed in.' } }
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: session.user.id, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (!error) setProfile(data)
    return { data, error }
  }

  return { profile, loading, saveProfile }
}
