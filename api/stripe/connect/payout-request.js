import Stripe from 'stripe'
import { supabaseAdmin, getUser } from '../../_lib/supabase.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const [{ data: connectRow }, { data: credits }, { data: profile }] = await Promise.all([
    supabaseAdmin.from('stripe_connect_accounts').select('*').eq('user_id', user.id).single(),
    supabaseAdmin.from('referral_credits').select('*').eq('user_id', user.id).neq('status', 'paid_out'),
    supabaseAdmin.from('profiles').select('subscription_status').eq('id', user.id).single(),
  ])

  if (!connectRow?.onboarding_complete) {
    return res.status(400).json({ error: 'You must complete identity verification before requesting a payout.' })
  }

  const available = (credits || []).reduce((s, c) => s + c.amount_cents, 0)
  const monthlyCostCents = profile?.subscription_status === 'premium' ? 900 : 0

  // Payout amount = credits above the subscription cost
  const payoutCents = available - monthlyCostCents
  if (payoutCents <= 0) {
    return res.status(400).json({ error: 'Not enough credits for a payout yet.' })
  }

  // Minimum payout $5 to avoid Stripe micro-transfer fees
  if (payoutCents < 500) {
    return res.status(400).json({ error: 'Minimum payout is $5. Keep earning referrals!' })
  }

  // Transfer from platform to connected account
  const transfer = await stripe.transfers.create({
    amount: payoutCents,
    currency: 'aud',
    destination: connectRow.stripe_account_id,
    metadata: { user_id: user.id, reason: 'referral_payout' },
  })

  // Mark credits as paid out
  const creditIds = (credits || []).map(c => c.id)
  await supabaseAdmin
    .from('referral_credits')
    .update({ status: 'paid_out', paid_out_at: new Date().toISOString() })
    .in('id', creditIds)

  res.json({
    ok: true,
    transferId: transfer.id,
    payoutCents,
    payoutDollars: (payoutCents / 100).toFixed(2),
  })
}
