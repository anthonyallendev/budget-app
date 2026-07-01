import { plaid } from '../_lib/plaid.js'
import { supabaseAdmin, getUser } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { public_token, institution_name } = req.body

  try {
    // Exchange public token for a permanent access token
    const exchangeRes = await plaid.itemPublicTokenExchange({ public_token })
    const { access_token, item_id } = exchangeRes.data

    // Save the bank connection
    const { error: upsertErr } = await supabaseAdmin
      .from('plaid_items')
      .upsert({ user_id: user.id, item_id, access_token, institution_name },
               { onConflict: 'item_id' })

    if (upsertErr) throw upsertErr

    // Pull in transactions straight away so the user sees data immediately
    const synced = await syncTransactions(user.id, access_token, null)

    res.json({ success: true, synced })
  } catch (err) {
    console.error('exchange-token:', err.response?.data ?? err.message)
    res.status(500).json({ error: 'Failed to connect bank' })
  }
}

// ── shared sync helper ────────────────────────────────────────────────────────

export async function syncTransactions(userId, accessToken, cursor) {
  let nextCursor = cursor
  let hasMore    = true
  const added    = []

  while (hasMore) {
    const res = await plaid.transactionsSync({
      access_token: accessToken,
      cursor:       nextCursor ?? undefined,
      count:        100,
    })
    added.push(...res.data.added)
    nextCursor = res.data.next_cursor
    hasMore    = res.data.has_more
  }

  if (added.length > 0) {
    const rows = added.map(t => ({
      user_id:              userId,
      plaid_transaction_id: t.transaction_id,
      // Plaid: positive = debit (expense), negative = credit (income)
      type:                 t.amount > 0 ? 'expense' : 'income',
      amount:               Math.abs(t.amount),
      date:                 t.date,
      description:          t.merchant_name ?? t.name,
      merchant_name:        t.merchant_name ?? null,
      category:             t.personal_finance_category?.primary
                              ?? t.category?.[0]
                              ?? 'Other',
      pending:              t.pending,
      currency_code:        t.iso_currency_code ?? 'USD',
      source:               'plaid',
    }))

    const { error: upsertErr } = await supabaseAdmin
      .from('transactions')
      .upsert(rows, { onConflict: 'plaid_transaction_id', ignoreDuplicates: false })

    if (upsertErr) throw upsertErr
  }

  // Save cursor so next sync only fetches new data
  await supabaseAdmin
    .from('plaid_items')
    .update({ cursor: nextCursor })
    .eq('user_id', userId)
    .eq('access_token', accessToken)

  return added.length
}
