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

// True if the user — or anyone in their household — has an active premium
// plan. One Premium subscription covers the whole household.
export async function isPremiumUser(userId) {
  const { data: own } = await supabaseAdmin
    .from('profiles').select('subscription_status').eq('id', userId).maybeSingle()
  if (own?.subscription_status === 'premium') return true

  const { data: membership } = await supabaseAdmin
    .from('household_members').select('household_id').eq('user_id', userId).maybeSingle()
  if (!membership) return false

  const { data: members } = await supabaseAdmin
    .from('household_members').select('user_id').eq('household_id', membership.household_id)
  const partnerIds = (members || []).map(m => m.user_id).filter(id => id !== userId)
  if (!partnerIds.length) return false

  const { data: premium } = await supabaseAdmin
    .from('profiles').select('id').in('id', partnerIds)
    .eq('subscription_status', 'premium').limit(1)
  return (premium || []).length > 0
}
