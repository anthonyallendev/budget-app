import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchTransactions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) setError(error.message)
    else setTransactions(data)
    setLoading(false)
  }

  useEffect(() => { fetchTransactions() }, [])

  async function addTransaction({ type, amount, category, description, date }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('transactions')
      .insert({ user_id: user.id, type, amount, category, description, date })

    if (error) throw new Error(error.message)
    await fetchTransactions()
  }

  async function deleteTransaction(id) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetchTransactions()
  }

  return { transactions, loading, error, addTransaction, deleteTransaction, refresh: fetchTransactions }
}
