import Stripe from 'stripe'
import { supabaseAdmin, getUser } from '../../_lib/supabase.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const APP_URL = process.env.APP_URL ?? 'https://retirely.money'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: connectRow } = await supabaseAdmin
    .from('stripe_connect_accounts')
    .select('stripe_account_id')
    .eq('user_id', user.id)
    .single()

  if (!connectRow) return res.status(404).json({ error: 'No Connect account found. Create one first.' })

  // Check current status from Stripe
  const account = await stripe.accounts.retrieve(connectRow.stripe_account_id)
  if (account.payouts_enabled && account.charges_enabled) {
    await supabaseAdmin
      .from('stripe_connect_accounts')
      .update({ onboarding_complete: true, payouts_enabled: true })
      .eq('user_id', user.id)
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
