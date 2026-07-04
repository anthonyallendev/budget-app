import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// One Premium subscription covers the whole household: if the user's own plan
// is free but a household member has Premium, we surface them as premium with
// premium_via_household set (so e.g. the Upgrade page can tell the difference).
async function withHouseholdPremium(p) {
  if (!p || p.subscription_status === 'premium') return p
  const { data, error } = await supabase.rpc('household_has_premium')
  if (!error && data === true) {
    return { ...p, subscription_status: 'premium', premium_via_household: true }
  }
  return p
}

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
        .then(async ({ data: p }) => {
          const effective = await withHouseholdPremium(p)
          if (mounted) { setProfile(effective); setLoading(false) }
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
    if (!error) setProfile(await withHouseholdPremium(data))
    return { data, error }
  }

  return { profile, loading, saveProfile }
}
