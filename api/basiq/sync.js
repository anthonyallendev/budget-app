import { basiq } from '../_lib/basiq.js'
import { supabaseAdmin, getUser } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: basiqUserRow } = await supabaseAdmin
    .from('basiq_users')
    .select('basiq_user_id')
    .eq('user_id', user.id)
    .single()

  if (!basiqUserRow) return res.json({ synced: 0 })

  try {
    const allTx = []
    let path = `/users/${basiqUserRow.basiq_user_id}/transactions?limit=500`

    while (path) {
      const data = await basiq('GET', path)
      allTx.push(...(data.data ?? []))
      if (data.links?.next) {
        const next = new URL(data.links.next)
        path = next.pathname + next.search
      } else {
        path = null
      }
    }

    if (!allTx.length) return res.json({ synced: 0 })

    const rows = allTx.map(t => ({
      user_id:              user.id,
      basiq_transaction_id: t.id,
      type:                 t.direction === 'credit' ? 'income' : 'expense',
      amount:               Math.abs(parseFloat(t.amount)),
      date:                 t.postDate ?? t.transactionDate,
      description:          t.description,
      merchant_name:        t.enrich?.merchant?.businessName ?? null,
      category:             t.enrich?.category?.basiqCategory ?? t.class ?? 'Other',
      pending:              t.status === 'pending',
      currency_code:        t.currency ?? 'AUD',
      source:               'basiq',
    }))

    const { error } = await supabaseAdmin
      .from('transactions')
      .upsert(rows, { onConflict: 'basiq_transaction_id', ignoreDuplicates: true })

    if (error) throw error

    res.json({ synced: rows.length })
  } catch (err) {
    console.error('basiq sync:', err.message)
    res.status(500).json({ error: err.message })
  }
}
