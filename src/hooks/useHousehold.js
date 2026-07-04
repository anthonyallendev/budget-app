import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Household (partner mode) state + actions, backed by the Supabase RPCs
// created in migration_2026-07-04_premium_features.sql.
export function useHousehold() {
  const [household, setHousehold] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('get_household')
    if (err) {
      // Table/function missing (migration not run yet) or transient failure
      setError(err.message)
      setHousehold(null)
      setMembers([])
    } else {
      setError(null)
      setHousehold(data?.household ?? null)
      setMembers(data?.members ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function createHousehold(name) {
    const { error: err } = await supabase.rpc('create_household', { p_name: name })
    if (err) throw new Error(err.message)
    await refresh()
  }

  async function joinHousehold(code) {
    const { error: err } = await supabase.rpc('join_household', { p_code: code })
    if (err) throw new Error(err.message)
    await refresh()
  }

  async function leaveHousehold() {
    const { error: err } = await supabase.rpc('leave_household')
    if (err) throw new Error(err.message)
    await refresh()
  }

  return { household, members, loading, error, createHousehold, joinHousehold, leaveHousehold, refresh }
}

// All transactions visible to the household (own + partner's, via RLS policy)
export function useHouseholdTransactions(enabled) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) { setTransactions([]); setLoading(false); return }
    let mounted = true
    async function load() {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(2000)
      if (mounted) { setTransactions(data || []); setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [enabled])

  return { transactions, loading }
}
