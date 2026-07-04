import { useState, useEffect, useMemo } from 'react'
import AppLayout from '../components/AppLayout'
import PremiumGate from '../components/PremiumGate'
import { useProfile } from '../hooks/useProfile'
import { useHousehold, useHouseholdTransactions } from '../hooks/useHousehold'
import { supabase } from '../lib/supabase'

const fmt = n => `$${Math.round(Math.abs(n)).toLocaleString()}`
const inputStyle = { background: 'rgba(6,11,26,0.8)', border: '1px solid rgba(0,212,255,0.18)' }

function SetupCard({ createHousehold, joinHousehold }) {
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function run(fn) {
    setBusy(true); setError(null)
    try { await fn() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
      <div className="glass rounded-2xl p-6 flex flex-col gap-4" style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
        <span className="text-3xl">🏠</span>
        <div>
          <h2 className="text-white font-semibold mb-1">Start a household</h2>
          <p className="text-slate-400 text-xs leading-relaxed">Create your household, then share the invite code with your partner so you can budget together.</p>
        </div>
        {mode === 'create' ? (
          <>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Allens"
              className="w-full rounded-lg px-3 py-2.5 text-white text-sm outline-none" style={inputStyle} />
            <button disabled={busy} onClick={() => run(() => createHousehold(name))}
              className="py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
              {busy ? 'Creating…' : 'Create household'}
            </button>
          </>
        ) : (
          <button onClick={() => setMode('create')}
            className="py-2.5 rounded-xl font-semibold text-white text-sm mt-auto transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
            Create household
          </button>
        )}
      </div>

      <div className="glass rounded-2xl p-6 flex flex-col gap-4" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
        <span className="text-3xl">💌</span>
        <div>
          <h2 className="text-white font-semibold mb-1">Join with a code</h2>
          <p className="text-slate-400 text-xs leading-relaxed">Already got an invite code from your partner? Enter it here to link your accounts.</p>
        </div>
        {mode === 'join' ? (
          <>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. 4F7A2C9B" maxLength={8}
              className="w-full rounded-lg px-3 py-2.5 text-white text-sm outline-none tracking-widest font-mono" style={inputStyle} />
            <button disabled={busy || code.length < 6} onClick={() => run(() => joinHousehold(code))}
              className="py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #e040fb)' }}>
              {busy ? 'Joining…' : 'Join household'}
            </button>
          </>
        ) : (
          <button onClick={() => setMode('join')}
            className="py-2.5 rounded-xl font-semibold text-white text-sm mt-auto transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #e040fb)' }}>
            Enter invite code
          </button>
        )}
      </div>

      {error && (
        <p className="md:col-span-2 text-red-400 text-sm rounded-xl px-4 py-3"
          style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

function HouseholdDashboard({ household, members, leaveHousehold, isPremium }) {
  const [copied, setCopied] = useState(false)
  const [userId, setUserId] = useState(null)
  const { transactions, loading: txLoading } = useHouseholdTransactions(isPremium)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id ?? null))
  }, [])

  const monthStats = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthTx = transactions.filter(t => new Date(t.date) >= start)
    const perMember = {}
    let income = 0, expenses = 0
    for (const t of monthTx) {
      const amt = parseFloat(t.amount)
      perMember[t.user_id] = perMember[t.user_id] || { income: 0, expenses: 0 }
      if (t.type === 'income') { income += amt; perMember[t.user_id].income += amt }
      if (t.type === 'expense') { expenses += amt; perMember[t.user_id].expenses += amt }
    }
    return { income, expenses, perMember, count: monthTx.length }
  }, [transactions])

  function copyCode() {
    navigator.clipboard?.writeText(household.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between" style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
        <div>
          <h2 className="text-white font-semibold text-lg">🏠 {household.name}</h2>
          <p className="text-slate-500 text-xs mt-1">{members.length} member{members.length !== 1 ? 's' : ''} · combined view of everyone's transactions</p>
        </div>
        {members.length < 2 && (
          <div className="flex items-center gap-3">
            <div>
              <p className="text-slate-500 text-xs mb-1">Invite code — share with your partner</p>
              <p className="font-mono text-xl tracking-widest text-cyan-400" style={{ textShadow: '0 0 12px rgba(0,212,255,0.4)' }}>
                {household.invite_code}
              </p>
            </div>
            <button onClick={copyCode}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff' }}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* This month combined — premium (one subscription covers the household) */}
      {isPremium ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Household income this month', value: fmt(monthStats.income), color: '#00d4ff' },
            { label: 'Household spending this month', value: fmt(monthStats.expenses), color: '#e040fb' },
            { label: 'Net this month', value: fmt(monthStats.income - monthStats.expenses), color: monthStats.income - monthStats.expenses >= 0 ? '#00b894' : '#f43f5e' },
          ].map(k => (
            <div key={k.label} className="glass rounded-2xl p-5 text-center">
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">{k.label}</p>
              <p className="text-2xl font-bold" style={{ color: k.color }}>{txLoading ? '—' : k.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <PremiumGate
          feature="the combined household view"
          description="One Premium subscription covers your whole household — when either of you upgrades, you both unlock the combined money picture and every other Premium feature.">
          <div className="grid grid-cols-3 gap-4 p-5">
            {['Household income', 'Household spending', 'Net this month'].map((l, i) => (
              <div key={l} className="glass rounded-2xl p-5 text-center">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">{l}</p>
                <p className="text-2xl font-bold" style={{ color: ['#00d4ff', '#e040fb', '#00b894'][i] }}>
                  {['$9,420', '$6,180', '$3,240'][i]}
                </p>
              </div>
            ))}
          </div>
        </PremiumGate>
      )}

      {/* Members */}
      <div className="glass rounded-2xl p-6" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
        <h2 className="text-white font-semibold mb-4">Members</h2>
        <div className="flex flex-col gap-3">
          {members.map(m => {
            const stats = monthStats.perMember[m.user_id] || { income: 0, expenses: 0 }
            return (
              <div key={m.user_id} className="flex items-center gap-4 py-3 px-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))', color: '#00d4ff' }}>
                  {(m.name || 'M')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {m.name}{m.user_id === userId ? ' (you)' : ''}
                    {m.user_id === household.owner_id ? ' 👑' : ''}
                  </p>
                  <p className="text-slate-500 text-xs">Joined {new Date(m.joined_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                {isPremium && (
                  <div className="text-right text-xs shrink-0">
                    <p style={{ color: '#00d4ff' }}>+{fmt(stats.income)}</p>
                    <p style={{ color: '#e040fb' }}>−{fmt(stats.expenses)}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {members.length < 2 && (
          <p className="text-slate-500 text-xs mt-4">
            Waiting for your partner — they sign up (or log in), go to Household, and enter the invite code above.
          </p>
        )}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-slate-600 text-xs max-w-md">
          Household members can see each other's transactions in this combined view.
          Everyone keeps their own login, budgets and goals.
        </p>
        <button onClick={() => { if (confirm('Leave this household? Your partner will keep theirs.')) leaveHousehold() }}
          className="px-4 py-2 rounded-lg text-xs text-slate-500 hover:text-red-400 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          Leave household
        </button>
      </div>
    </div>
  )
}

function HouseholdBody({ isPremium }) {
  const { household, members, loading, error, createHousehold, joinHousehold, leaveHousehold } = useHousehold()

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading…</div>

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center max-w-xl">
        <p className="text-3xl mb-3">🛠️</p>
        <p className="text-slate-300 text-sm">Household mode isn't set up on the server yet.</p>
        <p className="text-slate-600 text-xs mt-2">The database migration needs to be run in Supabase first. ({error})</p>
      </div>
    )
  }

  if (!household) return <SetupCard createHousehold={createHousehold} joinHousehold={joinHousehold} />
  return <HouseholdDashboard household={household} members={members} leaveHousehold={leaveHousehold} isPremium={isPremium} />
}

export default function HouseholdPage() {
  const { profile, loading } = useProfile()
  const isPremium = profile?.subscription_status === 'premium'

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-1">Household</h1>
      <p className="text-slate-400 text-sm mb-8">
        Budget as a couple — link accounts and see your combined finances in one place.
        One Premium subscription covers the whole household.
      </p>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-500">Loading…</div>
      ) : (
        <HouseholdBody isPremium={isPremium} />
      )}
    </AppLayout>
  )
}
