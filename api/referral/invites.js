import { supabaseAdmin, getUser } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { data, error } = await supabaseAdmin
    .from('referral_invites')
    .select('email, sent_at, reminder_count, converted, subscribed')
    .eq('referrer_id', user.id)
    .order('sent_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json({ invites: data || [] })
}
