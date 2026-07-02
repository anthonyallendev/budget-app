import Stripe from 'stripe'
import { supabaseAdmin } from '../_lib/supabase.js'
import { send, creditEarnedEmail } from '../_lib/email.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function creditReferrer({ referredUserId, referralCode }) {
  try {
    // Look up who owns this referral code
    const { data: codeRow } = await supabaseAdmin
      .from('referral_codes')
      .select('user_id')
      .eq('code', referralCode)
      .single()

    if (!codeRow) return
    const referrerId = codeRow.user_id

    // Prevent self-referral (sanity check)
    if (referrerId === referredUserId) return

    // Ensure no duplicate credit for this referred user
    const { data: existingCredit } = await supabaseAdmin
      .from('referral_credits')
      .select('id')
      .eq('referral_id',
        supabaseAdmin.from('referrals').select('id').eq('referred_user_id', referredUserId).single()
      )
      .single()

    // Upsert referral record to subscribed status
    const { data: referral } = await supabaseAdmin
      .from('referrals')
      .upsert(
        { referrer_id: referrerId, referred_user_id: referredUserId, status: 'subscribed' },
        { onConflict: 'referred_user_id' }
      )
      .select('id, credit_applied')
      .single()

    if (!referral || referral.credit_applied) return // already credited

    // Mark referral as credited
    await supabaseAdmin
      .from('referrals')
      .update({ status: 'credited', credit_applied: true })
      .eq('id', referral.id)

    // Insert credit record
    const { data: creditRow } = await supabaseAdmin
      .from('referral_credits')
      .insert({ user_id: referrerId, referral_id: referral.id, amount_cents: 100, status: 'available' })
      .select()
      .single()

    // Apply $1 Stripe Customer Balance credit to the referrer's account
    const { data: referrerProfile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', referrerId)
      .single()

    if (referrerProfile?.stripe_customer_id) {
      const balanceTx = await stripe.customers.createBalanceTransaction(
        referrerProfile.stripe_customer_id,
        { amount: -100, currency: 'aud', description: 'Referral credit — $1 earned' }
      )
      await supabaseAdmin
        .from('referral_credits')
        .update({ status: 'applied', stripe_balance_tx_id: balanceTx.id })
        .eq('id', creditRow.id)
    }

    // Get total credits for the notification email
    const { count: totalCredits } = await supabaseAdmin
      .from('referral_credits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', referrerId)

    // Email the referrer
    const { data: { user: referrerAuth } } = await supabaseAdmin.auth.admin.getUserById(referrerId)
    if (referrerAuth?.email) {
      const template = creditEarnedEmail({
        referrerName: referrerProfile?.full_name || 'there',
        totalCredits: (totalCredits || 1) * 100,
      })
      await send({ to: referrerAuth.email, ...template })
    }
  } catch (err) {
    console.error('creditReferrer error:', err.message)
  }
}

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

        // Update subscriber's profile to premium
        const { data: subscribedProfile } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status:    'premium',
            stripe_subscription_id: session.subscription,
          })
          .eq('stripe_customer_id', session.customer)
          .select('id, referred_by_code, full_name')
          .single()

        // Credit the referrer $1 if this user was referred
        if (subscribedProfile?.referred_by_code) {
          await creditReferrer({
            referredUserId: subscribedProfile.id,
            referralCode: subscribedProfile.referred_by_code,
          })
        }
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
