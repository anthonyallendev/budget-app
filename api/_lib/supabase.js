import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS, server-side only, never sent to the browser
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Verify a Supabase JWT and return the user, or null if invalid
export async function getUser(req) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return null
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  return error ? null : user
}
