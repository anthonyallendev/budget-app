import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../components/AppLayout'
import { supabase } from '../lib/supabase'
import { publishLeaderboardScore } from '../lib/leaderboard'

const CATEGORIES = [
  {
    key:   'composite_score',
    label: 'Overall',
    emoji: '👑',
    unit:  'pts',
    max:   100,
    desc:  'Streak + health + savings combined',
    color: 'linear-gradient(135deg,#f59e0b,#7c3aed)',
  },
  {
    key:   'streak_days',
    label: 'Streak',
    emoji: '🔥',
    unit:  'days',
    max:   null, // relative to top score
    desc:  'Most consecutive daily check-ins',
    color: 'linear-gradient(135deg,#f97316,#ef4444)',
  },
  {
    key:   'health_score',
    label: 'Health',
    emoji: '💚',
    unit:  '/100',
    max:   100,
    desc:  'Financial health score this week',
    color: 'linear-gradient(135deg,#00d4ff,#7c3aed)',
  },
  {
    key:   'savings_pct',
    label: 'Savings',
    emoji: '💰',
    unit:  '%',
    max:   100,
    desc:  'Average savings goal completion',
    color: 'linear-gradient(135deg,#7c3aed,#e040fb)',
  },
]

const MEDALS = [
  { emoji: '🥇', glow: '#f59e0b' },
  { emoji: '🥈', glow: '#94a3b8' },
  { emoji: '🥉', glow: '#b45309' },
]

const STREAK_TIER = days =>
  days >= 365 ? { emoji: '👑', label: 'Legendary' }
  : days >= 180 ? { emoji: '🚀', label: 'Unstoppable' }
  : days >= 84  ? { emoji: '💎', label: 'Diamond' }
  : days >= 56  ? { emoji: '💪', label: 'Committed' }
  : days >= 35  ? { emoji: '🔥🔥🔥', label: 'On Fire' }
  : days >= 28  ? { emoji: '🔥🔥', label: 'Blazing' }
  : days >= 21  ? { emoji: '🔥', label: 'Heating Up' }
  : days >= 14  ? { emoji: '🌱', label: 'Growing' }
  : days >= 7   ? { emoji: '⭐', label: 'One Week' }
  : { emoji: '👍', label: 'Started' }

function validateUsername(u) {
  if (!u || u.trim().length < 3) return 'At least 3 characters'
  if (u.trim().length > 20)       return 'Max 20 characters'
  if (!/^[a-zA-Z0-9_]+$/.test(u.trim())) return 'Letters, numbers and underscores only'
  return null
}

function fmt(val, cat) {
  if (val === null || val === undefined) return '—'
  const n = typeof val === 'number' ? val : parseFloat(val)
  if (isNaN(n)) return '—'
  if (cat.key === 'savings_pct') return n.toFixed(1)
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export default function LeaderboardPage() {
  const [catKey,         setCatKey]         = useState('composite_score')
  const [rows,           setRows]           = useState([])
  const [totalUsers,     setTotalUsers]     = useState(0)
  const [myUserId,       setMyUserId]       = useState(null)
  const [myEntry,        setMyEntry]        = useState(null)
  const [myRank,         setMyRank]         = useState(null)
  const [username,       setUsername]       = useState(null)
  const [input,          setInput]          = useState('')
  const [inputError,     setInputError]     = useState('')
  const [saving,         setSaving]         = useState(false)
  const [editingName,    setEditingName]    = useState(false)
  const [loading,        setLoading]        = useState(true)

  const cat = CATEGORIES.find(c => c.key === catKey)

  // Init: get user + username
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setMyUserId(user.id)
      supabase.from('profiles').select('username').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.username) setUsername(data.username)
        })
    })
  }, [])

  const loadBoard = useCallback(async () => {
    setLoading(true)
    const { data, count } = await supabase
      .from('leaderboard_scores')
      .select('*', { count: 'exact' })
      .order(catKey, { ascending: false })
      .limit(10)

    setRows(data || [])
    setTotalUsers(count || 0)

    if (myUserId) {
      const { data: me } = await supabase
        .from('leaderboard_scores')
        .select('*')
        .eq('user_id', myUserId)
        .single()
      setMyEntry(me || null)

      if (me) {
        const { count: above } = await supabase
          .from('leaderboard_scores')
          .select('user_id', { count: 'exact', head: true })
          .gt(catKey, me[catKey])
        setMyRank((above || 0) + 1)
      }
    }
    setLoading(false)
  }, [catKey, myUserId])

  useEffect(() => { loadBoard() }, [loadBoard])

  async function saveUsername() {
    const err = validateUsername(input)
    if (err) { setInputError(err); return }
    setSaving(true)
    setInputError('')
    const trimmed = input.trim()
    const { error } = await supabase.from('profiles').update({ username: trimmed }).eq('id', myUserId)
    if (error) {
      setInputError(error.message.includes('unique') ? 'That username is taken — try another' : error.message)
      setSaving(false)
      return
    }
    await supabase.from('leaderboard_scores').update({ username: trimmed }).eq('user_id', myUserId)
    setUsername(trimmed)
    setEditingName(false)
    setSaving(false)
    await publishLeaderboardScore(true)
    loadBoard()
  }

  const myInTop10   = rows.some(r => r.user_id === myUserId)
  const isEarlyDays = totalUsers < 10
  const topScore    = rows.length > 0 ? (rows[0][catKey] || 1) : 1

  function barPct(val) {
    const n = parseFloat(val) || 0
    const max = cat.max ?? topScore
    return Math.min(100, max > 0 ? (n / max) * 100 : 0)
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-4xl leading-none">🏆</span>
          <h1 className="text-3xl font-bold text-gradient">Leaderboard</h1>
        </div>
        <p className="text-slate-400 text-sm">Compete on habits, not on wealth — your username, not your name or money.</p>
      </div>

      {/* Username card */}
      {(!username || editingName) ? (
        <div className="glass rounded-2xl p-6 mb-6" style={{ border: '1px solid rgba(0,212,255,0.25)' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎮</span>
            <div>
              <h2 className="text-white font-semibold">{editingName ? 'Change your username' : 'Choose your player name'}</h2>
              <p className="text-slate-500 text-xs">Shown publicly on the leaderboard — no real names or financials ever shown.</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex-1 min-w-0">
              <input type="text" placeholder="e.g. RetireBy40, SavingsNinja_AU, WealthWizard"
                value={input}
                onChange={e => { setInput(e.target.value); setInputError('') }}
                onKeyDown={e => e.key === 'Enter' && saveUsername()}
                maxLength={20}
                className="w-full rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                style={{ background: 'rgba(6,11,26,0.8)', border: `1px solid ${inputError ? 'rgba(244,63,94,0.4)' : 'rgba(0,212,255,0.18)'}` }}
                onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'}
                onBlur={e => e.target.style.boxShadow = 'none'}
              />
              {inputError
                ? <p className="text-xs text-red-400 mt-1">{inputError}</p>
                : <p className="text-xs text-slate-600 mt-1">3–20 chars · letters, numbers, underscores</p>
              }
            </div>
            <div className="flex gap-2 shrink-0">
              {editingName && (
                <button onClick={() => { setEditingName(false); setInputError('') }}
                  className="px-4 py-2.5 rounded-lg text-sm text-slate-500 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  Cancel
                </button>
              )}
              <button onClick={saveUsername} disabled={saving || !input.trim()}
                className="px-5 py-2.5 rounded-lg font-semibold text-white text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}>
                {saving ? '…' : editingName ? 'Save' : 'Join leaderboard 🚀'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl px-5 py-4 mb-6 flex items-center gap-4">
          <span className="text-2xl">🎮</span>
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-0.5">Your username</p>
            <p className="text-white font-semibold">{username}</p>
          </div>
          {myEntry && (
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-white">{myEntry.composite_score ?? 0}</p>
                <p className="text-xs text-slate-500">pts</p>
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: '#f97316' }}>{myEntry.streak_days ?? 0}</p>
                <p className="text-xs text-slate-500">day streak</p>
              </div>
            </div>
          )}
          <button onClick={() => { setEditingName(true); setInput(username) }}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors ml-2 shrink-0">
            Edit
          </button>
        </div>
      )}

      {/* Early bird banner */}
      {isEarlyDays && (
        <div className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,rgba(0,212,255,0.07),rgba(124,58,237,0.07))', border: '1px solid rgba(0,212,255,0.18)' }}>
          <span className="text-2xl">🐦</span>
          <div>
            <p className="text-white font-semibold text-sm">You're an early bird!</p>
            <p className="text-slate-500 text-xs">The leaderboard is warming up — stake your claim before the competition arrives.</p>
          </div>
          <span className="ml-auto text-xs text-slate-600 shrink-0">{totalUsers} {totalUsers === 1 ? 'player' : 'players'} so far</span>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setCatKey(c.key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
            style={catKey === c.key
              ? { background: 'linear-gradient(135deg,rgba(0,212,255,0.12),rgba(124,58,237,0.12))', border: '1px solid rgba(0,212,255,0.3)', color: '#fff', boxShadow: '0 0 12px rgba(0,212,255,0.1)' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}>
            <span className="text-base">{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Main leaderboard card */}
      <div className="glass rounded-2xl overflow-hidden mb-4">
        {/* Card header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <span className="text-2xl">{cat.emoji}</span>
          <div className="flex-1">
            <h2 className="text-white font-semibold">{cat.label} Rankings</h2>
            <p className="text-slate-500 text-xs">{cat.desc}</p>
          </div>
          {!isEarlyDays && totalUsers > 0 && (
            <span className="text-xs text-slate-600 shrink-0">{totalUsers} players</span>
          )}
        </div>

        {loading ? (
          <div className="divide-y divide-white/5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-8 h-5 rounded bg-white/5" />
                <div className="flex-1">
                  <div className="w-28 h-3.5 rounded bg-white/5 mb-2" />
                  <div className="w-full h-1 rounded bg-white/5" />
                </div>
                <div className="w-12 h-5 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-center px-6">
            <span className="text-5xl mb-4">🏗️</span>
            <p className="text-white font-semibold mb-1">No scores yet</p>
            <p className="text-slate-500 text-sm">Set a username above and visit the dashboard to post your first score!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map((row, i) => {
              const isMe  = row.user_id === myUserId
              const medal = MEDALS[i]
              const pct   = barPct(row[catKey])
              const tier  = catKey === 'streak_days' ? STREAK_TIER(row.streak_days) : null

              return (
                <div key={row.user_id}
                  className="flex items-center gap-4 px-6 py-4 transition-colors"
                  style={isMe ? { background: 'rgba(0,212,255,0.035)' } : {}}>

                  {/* Rank / medal */}
                  <div className="w-8 text-center shrink-0">
                    {medal ? (
                      <span className="text-xl" style={{ filter: `drop-shadow(0 0 4px ${medal.glow})` }}>
                        {medal.emoji}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono text-sm">#{i + 1}</span>
                    )}
                  </div>

                  {/* Username + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">{row.username}</span>
                      {tier && (
                        <span className="text-xs text-slate-500">{tier.emoji} {tier.label}</span>
                      )}
                      {isMe && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-bold shrink-0"
                          style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.25)' }}>
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: i < 3 ? cat.color : 'linear-gradient(90deg,#7c3aed,#00d4ff)', boxShadow: i === 0 ? '0 0 8px rgba(245,158,11,0.3)' : 'none' }} />
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0 min-w-[56px]">
                    <span className="font-bold text-white">{fmt(row[catKey], cat)}</span>
                    <span className="text-slate-600 text-xs ml-1">{cat.unit}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* My rank if outside top 10 */}
      {myEntry && !myInTop10 && myRank && (
        <div className="glass rounded-2xl px-6 py-4 flex items-center gap-4 mb-4"
          style={{ border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="w-8 text-center shrink-0">
            <span className="text-slate-500 font-mono text-sm">#{myRank}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-white">{myEntry.username}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.25)' }}>
                YOU
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {myRank <= 20 ? 'So close — keep going! 🔥' : 'Build your habits to climb the rankings 💪'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="font-bold text-white">{fmt(myEntry[catKey], cat)}</span>
            <span className="text-slate-600 text-xs ml-1">{cat.unit}</span>
          </div>
        </div>
      )}

      {/* How scoring works */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-1">How scores are calculated</h3>
        <p className="text-slate-500 text-xs mb-5">Scores update automatically each time you visit the dashboard.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { emoji: '👑', label: 'Overall (0–100 pts)', desc: 'Streak 30% · Health 50% · Savings 20%' },
            { emoji: '🔥', label: 'Streak (days)',       desc: 'How many consecutive days you\'ve visited' },
            { emoji: '💚', label: 'Health (0–100)',      desc: 'Your weekly financial health score' },
            { emoji: '💰', label: 'Savings (%)',         desc: 'Average completion across all savings goals' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3 rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.025)' }}>
              <span className="text-xl shrink-0 leading-none mt-0.5">{item.emoji}</span>
              <div>
                <p className="text-white text-sm font-medium mb-0.5">{item.label}</p>
                <p className="text-slate-500 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
