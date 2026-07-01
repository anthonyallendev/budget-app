import { supabase } from './supabase'

function getStreakDays() {
  try {
    const d = JSON.parse(localStorage.getItem('checkInStreak') || '{}')
    return parseInt(d.streak || 0)
  } catch { return 0 }
}

function getHealthScore() {
  try {
    const history = JSON.parse(localStorage.getItem('healthScoreHistory') || '[]')
    return history.length > 0 ? (history[history.length - 1].score || 0) : 0
  } catch { return 0 }
}

async function getSavingsPct(userId) {
  const { data } = await supabase
    .from('savings_goals')
    .select('target,saved')
    .eq('user_id', userId)
  if (!data || data.length === 0) return 0
  const pcts = data.map(g => g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0)
  return Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length)
}

// streak → 30 pts max (60 days), health → 50 pts, savings → 20 pts
function composite(streak, health, savings) {
  return Math.min(100, Math.round(Math.min(30, streak * 0.5) + health * 0.5 + savings * 0.2))
}

export async function publishLeaderboardScore(force = false) {
  if (!force) {
    try {
      const last = localStorage.getItem('lastScorePublish')
      if (last && Date.now() - parseInt(last) < 1000 * 60 * 60 * 6) return
    } catch { /* ignore */ }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles').select('username').eq('id', user.id).single()
  if (!profile?.username) return

  const streak  = getStreakDays()
  const health  = getHealthScore()
  const savings = await getSavingsPct(user.id)

  await supabase.from('leaderboard_scores').upsert({
    user_id:         user.id,
    username:        profile.username,
    streak_days:     streak,
    health_score:    health,
    savings_pct:     savings,
    composite_score: composite(streak, health, savings),
    updated_at:      new Date().toISOString(),
  }, { onConflict: 'user_id' })

  try { localStorage.setItem('lastScorePublish', String(Date.now())) } catch { /* ignore */ }
}
