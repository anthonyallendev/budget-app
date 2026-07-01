import { supabaseAdmin, getUser } from '../_lib/supabase.js'
import { syncTransactions } from './exchange-token.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: items, error } = await supabaseAdmin
    .from('plaid_items')
    .select('access_token, cursor')
    .eq('user_id', user.id)

  if (error) return res.status(500).json({ error: error.message })
  if (!items?.length) return res.json({ synced: 0 })

  let total = 0
  for (const item of items) {
    total += await syncTransactions(user.id, item.access_token, item.cursor)
  }

  res.json({ synced: total })
}
