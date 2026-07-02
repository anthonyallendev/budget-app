import { supabaseAdmin } from '../_lib/supabase.js'

const APP_URL = process.env.APP_URL ?? 'https://retirely.money'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { token } = req.query
  if (!token) return res.status(400).send('Missing token')

  const { data, error } = await supabaseAdmin
    .from('referral_invites')
    .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .select()
    .single()

  if (error || !data) {
    return res.status(404).send('Unsubscribe link not found or already used.')
  }

  // Redirect to a simple confirmation page
  res.setHeader('Location', `${APP_URL}/unsubscribed`)
  res.status(302).end()
}
