import Stripe from 'stripe'
import { supabaseAdmin, getUser } from '../_lib/supabase.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const APP_URL = process.env.APP_URL ?? 'https://retirely.money'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return res.status(400).json({ error: 'No subscription found' })
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${APP_URL}/dashboard`,
    })
    res.json({ url: session.url })
  } catch (err) {
    console.error('create-portal:', err.message)
    res.status(500).json({ error: 'Failed to open billing portal' })
  }
}
