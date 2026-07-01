import Stripe from 'stripe'
import { supabaseAdmin } from '../_lib/supabase.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function getRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode !== 'subscription') break
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status:    'premium',
            stripe_subscription_id: session.subscription,
          })
          .eq('stripe_customer_id', session.customer)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const isPremium = sub.status === 'active' || sub.status === 'trialing'
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status:    isPremium ? 'premium' : 'free',
            stripe_subscription_id: sub.id,
          })
          .eq('stripe_customer_id', sub.customer)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status:    'free',
            stripe_subscription_id: null,
          })
          .eq('stripe_customer_id', sub.customer)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }

  res.json({ received: true })
}
