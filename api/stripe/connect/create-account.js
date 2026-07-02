import Stripe from 'stripe'
import { supabaseAdmin, getUser } from '../../_lib/supabase.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // Check not already created
  const { data: existing } = await supabaseAdmin
    .from('stripe_connect_accounts')
    .select('stripe_account_id, onboarding_complete')
    .eq('user_id', user.id)
    .single()

  if (existing) return res.json({ accountId: existing.stripe_account_id, onboarding_complete: existing.onboarding_complete })

  const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(user.id)

  const account = await stripe.accounts.create({
    type: 'express',
    email: authUser?.email,
    metadata: { supabase_user_id: user.id },
    capabilities: {
      transfers: { requested: true },
    },
  })

  await supabaseAdmin
    .from('stripe_connect_accounts')
    .insert({ user_id: user.id, stripe_account_id: account.id })

  res.json({ accountId: account.id, onboarding_complete: false })
}
