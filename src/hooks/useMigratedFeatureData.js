import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Like useFeatureData, but backfills from an existing localStorage key the
// first time a user loads with no Supabase row yet — a one-time, read-through
// migration for data that used to live only in the browser (streaks, budget
// limits, debt tracker, etc). The old localStorage key is never deleted, so a
// rollback of this code can never lose data. Writes go to both Supabase
// (source of truth) and localStorage (cheap fast-paint cache, not load-bearing).
export function useMigratedFeatureData(feature, localStorageKey, defaultValue) {
  const [data, setData] = useState(defaultValue)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { if (mounted) setLoading(false); return }

        const { data: row, error } = await supabase
          .from('user_feature_data')
          .select('data')
          .eq('user_id', user.id)
          .eq('feature', feature)
          .maybeSingle()

        if (!error && row?.data) {
          if (mounted) { setData(row.data); setLoading(false) }
          return
        }

        // No Supabase row yet — one-time backfill from localStorage, if present.
        let backfill = null
        try {
          const raw = localStorage.getItem(localStorageKey)
          if (raw) backfill = JSON.parse(raw)
        } catch { /* ignore */ }

        if (backfill != null) {
          await supabase.from('user_feature_data').upsert({
            user_id: user.id,
            feature,
            data: backfill,
            updated_at: new Date().toISOString(),
          })
          if (mounted) setData(backfill)
        }
      } catch (err) {
        console.error(`useMigratedFeatureData load (${feature}):`, err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [feature, localStorageKey])

  const save = useCallback(async (next) => {
    setData(next)
    try { localStorage.setItem(localStorageKey, JSON.stringify(next)) } catch { /* ignore */ }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('user_feature_data').upsert({
        user_id: user.id,
        feature,
        data: next,
        updated_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error(`useMigratedFeatureData save (${feature}):`, err.message)
    }
  }, [feature, localStorageKey])

  return { data, save, loading }
}

// Non-hook variant for plain functions (not React components) that need to
// read-then-write a feature's data outside a component, e.g. statementPDF.js.
// Same read-through/backfill/mirror semantics as the hook above.
export async function readMigratedFeatureData(feature, localStorageKey, defaultValue) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return defaultValue

    const { data: row, error } = await supabase
      .from('user_feature_data')
      .select('data')
      .eq('user_id', user.id)
      .eq('feature', feature)
      .maybeSingle()
    if (!error && row?.data) return row.data
  } catch (err) {
    console.error(`readMigratedFeatureData (${feature}):`, err.message)
  }

  try {
    const raw = localStorage.getItem(localStorageKey)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return defaultValue
}

export async function writeMigratedFeatureData(feature, localStorageKey, next) {
  try { localStorage.setItem(localStorageKey, JSON.stringify(next)) } catch { /* ignore */ }
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('user_feature_data').upsert({
      user_id: user.id,
      feature,
      data: next,
      updated_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error(`writeMigratedFeatureData (${feature}):`, err.message)
  }
}
