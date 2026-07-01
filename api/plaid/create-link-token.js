import { Products, CountryCode } from 'plaid'
import { plaid } from '../_lib/plaid.js'
import { getUser } from '../_lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const response = await plaid.linkTokenCreate({
      user:         { client_user_id: user.id },
      client_name:  'Retirely',
      products:     [Products.Transactions],
      country_codes: [CountryCode.Us, CountryCode.Gb, CountryCode.Ca],
      language:     'en',
    })
    res.json({ link_token: response.data.link_token })
  } catch (err) {
    console.error('create-link-token:', err.response?.data ?? err.message)
    res.status(500).json({ error: 'Failed to create link token' })
  }
}
