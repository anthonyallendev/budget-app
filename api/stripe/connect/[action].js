import Stripe from 'stripe'
import { supabaseAdmin, getUser } from '../../_lib/supabase.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const APP_URL = process.env.APP_URL ?? 'https://retirely.money'

async function createAccount(req, res, user) {
  if (req.method !== 'POST') return res.status(405).end()

  const { data: existing } = await supabaseAdmin
    .from('stripe_connect_accounts').select('stripe_account_id, onboarding_complete')
    .eq('user_id', user.id).single()
  if (existing) return res.json({ accountId: existing.stripe_account_id, onboarding_complete: existing.onboarding_complete })

  const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(user.id)
  const account = await stripe.accounts.create({
    type: 'express',
    email: authUser?.email,
    metadata: { supabase_user_id: user.id },
    capabilities: { transfers: { requested: true } },
  })

  await supabaseAdmin
    .from('stripe_connect_accounts').insert({ user_id: user.id, stripe_account_id: account.id })
  res.json({ accountId: account.id, onboarding_complete: false })
}

async function onboardingLink(req, res, user) {
  if (req.method !== 'POST') return res.status(405).end()

  const { data: connectRow } = await supabaseAdmin
    .from('stripe_connect_accounts').select('stripe_account_id').eq('user_id', user.id).single()
  if (!connectRow) return res.status(404).json({ error: 'No Connect account found. Create one first.' })

  const account = await stripe.accounts.retrieve(connectRow.stripe_account_id)
  if (account.payouts_enabled && account.charges_enabled) {
    await supabaseAdmin
      .from('stripe_connect_accounts')
      .update({ onboarding_complete: true, payouts_enabled: true }).eq('user_id', user.id)
    return res.json({ alreadyComplete: true })
  }

  const link = await stripe.accountLinks.create({
    account: connectRow.stripe_account_id,
    refresh_url: `${APP_URL}/referrals?connect=refresh`,
    return_url:  `${APP_URL}/referrals?connect=complete`,
    type: 'account_onboarding',
  })
  res.json({ url: link.url })
}

async function payoutRequest(req, res, user) {
  if (req.method !== 'POST') return res.status(405).end()

  const [{ data: connectRow }, { data: credits }, { data: profile }] = await Promise.all([
    supabaseAdmin.from('stripe_connect_accounts').select('*').eq('user_id', user.id).single(),
    supabaseAdmin.from('referral_credits').select('*').eq('user_id', user.id).neq('status', 'paid_out'),
    supabaseAdmin.from('profiles').select('subscription_status').eq('id', user.id).single(),
  ])

  if (!connectRow?.onboarding_complete)
    return res.status(400).json({ error: 'You must complete identity verification before requesting a payout.' })

  const available = (credits || []).reduce((s, c) => s + c.amount_cents, 0)
  const monthlyCostCents = profile?.subscription_status === 'premium' ? 900 : 0
  const payoutCents = available - monthlyCostCents

  if (payoutCents <= 0) return res.status(400).json({ error: 'Not enough credits for a payout yet.' })
  if (payoutCents < 500) return res.status(400).json({ error: 'Minimum payout is $5. Keep earning referrals!' })

  const transfer = await stripe.transfers.create({
    amount: payoutCents, currency: 'aud',
    destination: connectRow.stripe_account_id,
    metadata: { user_id: user.id, reason: 'referral_payout' },
  })

  await supabaseAdmin
    .from('referral_credits')
    .update({ status: 'paid_out', paid_out_at: new Date().toISOString() })
    .in('id', (credits || []).map(c => c.id))

  res.json({ ok: true, transferId: transfer.id, payoutCents, payoutDollars: (payoutCents / 100).toFixed(2) })
}

// ── Router ────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  switch (req.query.action) {
    case 'create-account':   return createAccount(req, res, user)
    case 'onboarding-link':  return onboardingLink(req, res, user)
    case 'payout-request':   return payoutRequest(req, res, user)
    default:                 return res.status(404).json({ error: 'Unknown action' })
  }
}
