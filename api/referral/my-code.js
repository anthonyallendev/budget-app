import { supabaseAdmin, getUser } from '../_lib/supabase.js'

function generateCode(name) {
  const base = (name || 'USER')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
    .padEnd(4, 'X')
  const suffix = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
  return (base + suffix).slice(0, 10)
}

export default async function handler(req, res) {
  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // GET — return existing code or create one
  if (req.method === 'GET') {
    const { data: existing } = await supabaseAdmin
      .from('referral_codes')
      .select('code')
      .eq('user_id', user.id)
      .single()

    if (existing) return res.json({ code: existing.code })

    // Auto-generate from display name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const code = generateCode(profile?.full_name || '')

    const { data, error } = await supabaseAdmin
      .from('referral_codes')
      .insert({ user_id: user.id, code })
      .select('code')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ code: data.code })
  }

  // POST — set a custom code
  if (req.method === 'POST') {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'code is required' })

    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
    if (clean.length < 3) return res.status(400).json({ error: 'Code must be at least 3 characters' })

    // Check not taken by someone else
    const { data: taken } = await supabaseAdmin
      .from('referral_codes')
      .select('user_id')
      .eq('code', clean)
      .neq('user_id', user.id)
      .single()

    if (taken) return res.status(409).json({ error: 'That code is already taken. Try another.' })

    const { error } = await supabaseAdmin
      .from('referral_codes')
      .upsert({ user_id: user.id, code: clean }, { onConflict: 'user_id' })

    if (error) return res.status(500).json({ error: error.message })
    return res.json({ code: clean })
  }

  res.status(405).end()
}
