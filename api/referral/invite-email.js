import { supabaseAdmin, getUser } from '../_lib/supabase.js'
import { send, inviteEmail } from '../_lib/email.js'

const APP_URL = process.env.APP_URL ?? 'https://retirely.money'
const DAILY_LIMIT = 20

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { email } = req.body
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email address required' })
  }

  const normalised = email.toLowerCase().trim()

  // Don't invite yourself
  const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(user.id)
  if (authUser?.email?.toLowerCase() === normalised) {
    return res.status(400).json({ error: 'You cannot invite yourself' })
  }

  // Rate limit: max DAILY_LIMIT invites per day
  const since = new Date(Date.now() - 86400_000).toISOString()
  const { count } = await supabaseAdmin
    .from('referral_invites')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .gte('sent_at', since)

  if ((count || 0) >= DAILY_LIMIT) {
    return res.status(429).json({ error: `You can send up to ${DAILY_LIMIT} invites per day` })
  }

  // Get referral code
  const { data: codeRow } = await supabaseAdmin
    .from('referral_codes')
    .select('code')
    .eq('user_id', user.id)
    .single()

  if (!codeRow) return res.status(400).json({ error: 'You need a referral code first' })

  // Upsert invite record
  const { data: invite, error: inviteErr } = await supabaseAdmin
    .from('referral_invites')
    .upsert(
      { referrer_id: user.id, email: normalised, referral_code: codeRow.code, sent_at: new Date().toISOString() },
      { onConflict: 'referrer_id,email', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (inviteErr) return res.status(500).json({ error: inviteErr.message })

  // Already converted — don't email again
  if (invite.converted) {
    return res.status(200).json({ ok: true, alreadyConverted: true })
  }

  // Get referrer's name
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const referralLink = `${APP_URL}/?ref=${codeRow.code}`
  const template = inviteEmail({
    referrerName: profile?.full_name || 'A friend',
    referralLink,
  })

  try {
    await send({ to: normalised, ...template })
  } catch (err) {
    return res.status(502).json({ error: `Email failed: ${err.message}` })
  }

  res.json({ ok: true })
}
