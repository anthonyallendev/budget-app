import Stripe from 'stripe'
import { supabaseAdmin, getUser } from '../_lib/supabase.js'
import { send, inviteEmail } from '../_lib/email.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const APP_URL = process.env.APP_URL ?? 'https://retirely.money'
const DAILY_LIMIT = 20

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateCode(name) {
  const base = (name || 'USER').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6).padEnd(4, 'X')
  const suffix = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
  return (base + suffix).slice(0, 10)
}

// ── Route handlers ────────────────────────────────────────────────────────────

async function myCode(req, res, user) {
  if (req.method === 'GET') {
    const { data: existing } = await supabaseAdmin
      .from('referral_codes').select('code').eq('user_id', user.id).single()
    if (existing) return res.json({ code: existing.code })

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('full_name').eq('id', user.id).single()
    const code = generateCode(profile?.full_name || '')
    const { data, error } = await supabaseAdmin
      .from('referral_codes').insert({ user_id: user.id, code }).select('code').single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ code: data.code })
  }

  if (req.method === 'POST') {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'code is required' })
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
    if (clean.length < 3) return res.status(400).json({ error: 'Code must be at least 3 characters' })
    const { data: taken } = await supabaseAdmin
      .from('referral_codes').select('user_id').eq('code', clean).neq('user_id', user.id).single()
    if (taken) return res.status(409).json({ error: 'That code is already taken. Try another.' })
    const { error } = await supabaseAdmin
      .from('referral_codes').upsert({ user_id: user.id, code: clean }, { onConflict: 'user_id' })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ code: clean })
  }

  res.status(405).end()
}

async function stats(req, res, user) {
  if (req.method !== 'GET') return res.status(405).end()

  const [{ data: referrals }, { data: credits }, { data: connectRow }, { data: profile }] =
    await Promise.all([
      supabaseAdmin.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('referral_credits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('stripe_connect_accounts').select('*').eq('user_id', user.id).single(),
      supabaseAdmin.from('profiles').select('stripe_customer_id, subscription_status').eq('id', user.id).single(),
    ])

  const totalCredits = (credits || []).reduce((s, c) => s + c.amount_cents, 0)
  const paidOut = (credits || []).filter(c => c.status === 'paid_out').reduce((s, c) => s + c.amount_cents, 0)
  const available = totalCredits - paidOut

  let stripeBalance = 0
  if (profile?.stripe_customer_id) {
    try {
      const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
      stripeBalance = -customer.balance
    } catch (_) {}
  }

  const monthlyCostCents = profile?.subscription_status === 'premium' ? 900 : 0
  res.json({
    referrals: referrals || [],
    credits: credits || [],
    totalCredits, paidOut, available, stripeBalance, monthlyCostCents,
    connectAccount: connectRow || null,
    payoutEligibleCents: Math.max(0, available - monthlyCostCents),
  })
}

async function inviteEmailHandler(req, res, user) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email } = req.body
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Valid email address required' })

  const normalised = email.toLowerCase().trim()

  const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(user.id)
  if (authUser?.email?.toLowerCase() === normalised)
    return res.status(400).json({ error: 'You cannot invite yourself' })

  const since = new Date(Date.now() - 86400_000).toISOString()
  const { count } = await supabaseAdmin
    .from('referral_invites').select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id).gte('sent_at', since)
  if ((count || 0) >= DAILY_LIMIT)
    return res.status(429).json({ error: `You can send up to ${DAILY_LIMIT} invites per day` })

  const { data: codeRow } = await supabaseAdmin
    .from('referral_codes').select('code').eq('user_id', user.id).single()
  if (!codeRow) return res.status(400).json({ error: 'You need a referral code first' })

  const { data: invite, error: inviteErr } = await supabaseAdmin
    .from('referral_invites')
    .upsert(
      { referrer_id: user.id, email: normalised, referral_code: codeRow.code, sent_at: new Date().toISOString() },
      { onConflict: 'referrer_id,email', ignoreDuplicates: false }
    )
    .select().single()
  if (inviteErr) return res.status(500).json({ error: inviteErr.message })
  if (invite.converted) return res.json({ ok: true, alreadyConverted: true })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('full_name').eq('id', user.id).single()

  const referralLink = `${APP_URL}/?ref=${codeRow.code}`
  const template = inviteEmail({ referrerName: profile?.full_name || 'A friend', referralLink })
  try {
    await send({ to: normalised, ...template })
  } catch (err) {
    return res.status(502).json({ error: `Email failed: ${err.message}` })
  }
  res.json({ ok: true })
}

async function recordSignup(req, res, user) {
  if (req.method !== 'POST') return res.status(405).end()

  const { referralCode } = req.body
  if (!referralCode) return res.status(400).json({ error: 'referralCode is required' })

  const clean = referralCode.toUpperCase().trim()
  const { data: codeRow } = await supabaseAdmin
    .from('referral_codes').select('user_id').eq('code', clean).single()
  if (!codeRow) return res.status(404).json({ error: 'Referral code not found' })
  if (codeRow.user_id === user.id) return res.status(400).json({ error: 'Cannot refer yourself' })

  const { data: existing } = await supabaseAdmin
    .from('referrals').select('id').eq('referred_user_id', user.id).single()
  if (existing) return res.json({ ok: true, alreadyRecorded: true })

  await Promise.all([
    supabaseAdmin.from('profiles').update({ referred_by_code: clean }).eq('id', user.id),
    supabaseAdmin.from('referrals').insert({
      referrer_id: codeRow.user_id, referred_user_id: user.id, status: 'signed_up',
    }),
  ])

  const { data: { user: fullUser } } = await supabaseAdmin.auth.admin.getUserById(user.id)
  if (fullUser?.email) {
    await supabaseAdmin
      .from('referral_invites').update({ converted: true })
      .eq('referrer_id', codeRow.user_id).eq('email', fullUser.email.toLowerCase())
  }
  res.json({ ok: true })
}

async function invitesList(req, res, user) {
  if (req.method !== 'GET') return res.status(405).end()
  const { data, error } = await supabaseAdmin
    .from('referral_invites')
    .select('email, sent_at, reminder_count, converted, subscribed')
    .eq('referrer_id', user.id).order('sent_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ invites: data || [] })
}

async function unsubscribe(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const { token } = req.query
  if (!token) return res.status(400).send('Missing token')

  const { data, error } = await supabaseAdmin
    .from('referral_invites')
    .update({ subscribed: false, unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token).select().single()

  if (error || !data) return res.status(404).send('Unsubscribe link not found or already used.')
  res.setHeader('Location', `${APP_URL}/unsubscribed`)
  res.status(302).end()
}

// ── Router ────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const action = req.query.action

  // unsubscribe is public (no auth)
  if (action === 'unsubscribe') return unsubscribe(req, res)

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  switch (action) {
    case 'my-code':       return myCode(req, res, user)
    case 'stats':         return stats(req, res, user)
    case 'invite-email':  return inviteEmailHandler(req, res, user)
    case 'record-signup': return recordSignup(req, res, user)
    case 'invites':       return invitesList(req, res, user)
    default:              return res.status(404).json({ error: 'Unknown action' })
  }
}
