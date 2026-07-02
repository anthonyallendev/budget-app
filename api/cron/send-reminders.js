import { supabaseAdmin } from '../_lib/supabase.js'
import { send, reminderEmail } from '../_lib/email.js'

const APP_URL = process.env.APP_URL ?? 'https://retirely.money'

// Called by Vercel Cron on the 1st of each month (see vercel.json)
// Protected by CRON_SECRET so it can't be triggered externally
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const auth = req.headers.authorization
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get all subscribed, unconverted invites that haven't been reminded in 28+ days
  const cutoff = new Date(Date.now() - 28 * 86400_000).toISOString()
  const { data: invites, error } = await supabaseAdmin
    .from('referral_invites')
    .select('id, email, referral_code, unsubscribe_token, reminder_count, referrer_id')
    .eq('subscribed', true)
    .eq('converted', false)
    .or(`last_reminder_at.is.null,last_reminder_at.lte.${cutoff}`)
    .lte('reminder_count', 3) // max 3 monthly reminders (then stop)

  if (error) {
    console.error('send-reminders error:', error.message)
    return res.status(500).json({ error: error.message })
  }

  if (!invites?.length) return res.json({ sent: 0 })

  // Fetch referrer profiles in bulk
  const referrerIds = [...new Set(invites.map(i => i.referrer_id))]
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .in('id', referrerIds)

  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))

  let sent = 0
  for (const invite of invites) {
    const referrerName = profileMap[invite.referrer_id]?.full_name || 'A friend'
    const referralLink = `${APP_URL}/?ref=${invite.referral_code}`
    const unsubscribeUrl = `${APP_URL}/api/referral/unsubscribe?token=${invite.unsubscribe_token}`

    const template = reminderEmail({ referrerName, referralLink, unsubscribeUrl })

    try {
      await send({ to: invite.email, ...template })
      await supabaseAdmin
        .from('referral_invites')
        .update({
          reminder_count: invite.reminder_count + 1,
          last_reminder_at: new Date().toISOString(),
        })
        .eq('id', invite.id)
      sent++
    } catch (err) {
      console.error(`Failed to email ${invite.email}:`, err.message)
    }
  }

  res.json({ sent, total: invites.length })
}
