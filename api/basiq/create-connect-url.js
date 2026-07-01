import { basiq } from '../_lib/basiq.js'
import { supabaseAdmin, getUser } from '../_lib/supabase.js'

const APP_URL = process.env.APP_URL ?? 'https://retirely.money'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

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

    // Generate a Basiq Connect URL
    const authLink = await basiq('POST', `/users/${basiqUserId}/auth_link`, {
      scope: 'CLIENT_ACCESS',
      email: user.email,
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
