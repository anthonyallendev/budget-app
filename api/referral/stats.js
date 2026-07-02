import Stripe from 'stripe'
import { supabaseAdmin, getUser } from '../_lib/supabase.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

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

  // Get Stripe customer balance if they have a customer ID
  let stripeBalance = 0
  if (profile?.stripe_customer_id) {
    try {
      const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
      // Stripe balance is negative when they have credit (inverted)
      stripeBalance = -customer.balance // positive = credit available
    } catch (_) {}
  }

  // Subscription monthly cost in cents
  const monthlyCostCents = profile?.subscription_status === 'premium' ? 900 : 0

  res.json({
    referrals: referrals || [],
    credits: credits || [],
    totalCredits,
    paidOut,
    available,
    stripeBalance,
    monthlyCostCents,
    connectAccount: connectRow || null,
    payoutEligibleCents: Math.max(0, available - monthlyCostCents),
  })
}
