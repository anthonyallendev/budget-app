import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Loads/saves a per-user jsonb blob in user_feature_data (one row per feature).
// Falls back gracefully (local state only) if the table doesn't exist yet.
export function useFeatureData(feature, defaultValue) {
  const [data, setData] = useState(defaultValue)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (mounted) setLoading(false); return }
      const { data: row, error } = await supabase
        .from('user_feature_data')
        .select('data')
        .eq('user_id', user.id)
        .eq('feature', feature)
        .maybeSingle()
      if (mounted) {
        if (!error && row?.data) setData(row.data)
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [feature])

  const save = useCallback(async (next) => {
    setData(next)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('user_feature_data').upsert({
      user_id: user.id,
      feature,
      data: next,
      updated_at: new Date().toISOString(),
    })
  }, [feature])

  return { data, save, loading }
}
