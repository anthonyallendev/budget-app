import { basiq } from '../_lib/basiq.js'
import { supabaseAdmin, getUser } from '../_lib/supabase.js'

const APP_URL = process.env.APP_URL ?? 'https://retirely.money'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('subscription_status').eq('id', user.id).single()
  if (profile?.subscription_status !== 'premium') {
    return res.status(403).json({ error: 'upgrade_required' })
  }

  try {
    // Get or create Basiq user for this Retirely user
    const { data: existing } = await supabaseAdmin
      .from('basiq_users')
      .select('basiq_user_id')
      .eq('user_id', user.id)
      .single()

    let basiqUserId = existing?.basiq_user_id

    if (!basiqUserId) {
      const created = await basiq('POST', '/users', { email: user.email })
      basiqUserId = created.id
      const { error } = await supabaseAdmin
        .from('basiq_users')
        .insert({ user_id: user.id, basiq_user_id: basiqUserId })
      if (error) throw error
    }

    // Read mobile from user's profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('mobile')
      .eq('id', user.id)
      .single()

    if (!profile?.mobile) {
      return res.status(400).json({ error: 'Mobile number required for Australian bank sync. Please add it to your profile.' })
    }

    // Generate a Basiq Connect URL
    const authLink = await basiq('POST', `/users/${basiqUserId}/auth_link`, {
      scope: 'CLIENT_ACCESS',
      email: user.email,
      mobile: profile.mobile,
      redirectUrl: `${APP_URL}/transactions?basiq=connected`,
    })

    const url = authLink.links?.public
    if (!url) throw new Error(`No connect URL in response: ${JSON.stringify(authLink)}`)

    res.json({ url })
  } catch (err) {
    console.error('basiq create-connect-url:', err.message)
    res.status(500).json({ error: err.message })
  }
}
