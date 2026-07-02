import { supabaseAdmin, getUser } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { referralCode } = req.body
  if (!referralCode) return res.status(400).json({ error: 'referralCode is required' })

  const clean = referralCode.toUpperCase().trim()

  // Look up who owns this code
  const { data: codeRow } = await supabaseAdmin
    .from('referral_codes')
    .select('user_id')
    .eq('code', clean)
    .single()

  if (!codeRow) return res.status(404).json({ error: 'Referral code not found' })

  // Prevent self-referral
  if (codeRow.user_id === user.id) return res.status(400).json({ error: 'Cannot refer yourself' })

  // Check not already referred
  const { data: existing } = await supabaseAdmin
    .from('referrals')
    .select('id')
    .eq('referred_user_id', user.id)
    .single()

  if (existing) return res.json({ ok: true, alreadyRecorded: true })

  // Save the code on the new user's profile and create a referral record
  await Promise.all([
    supabaseAdmin
      .from('profiles')
      .update({ referred_by_code: clean })
      .eq('id', user.id),

    supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: codeRow.user_id,
        referred_user_id: user.id,
        status: 'signed_up',
      }),
  ])

  // Mark any email invite for this user's email as converted
  const { data: { user: fullUser } } = await supabaseAdmin.auth.admin.getUserById(user.id)
  if (fullUser?.email) {
    await supabaseAdmin
      .from('referral_invites')
      .update({ converted: true })
      .eq('referrer_id', codeRow.user_id)
      .eq('email', fullUser.email.toLowerCase())
  }

  res.json({ ok: true })
}
