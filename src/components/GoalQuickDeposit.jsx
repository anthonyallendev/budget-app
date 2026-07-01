import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function GoalQuickDeposit() {
  const [goals,    setGoals]    = useState([])
  const [selected, setSelected] = useState('')
  const [amount,   setAmount]   = useState('')
  const [saving,   setSaving]   = useState(false)
  const [flash,    setFlash]    = useState(null)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('savings_goals')
      .select('id,name,icon,target,saved')
      .eq('user_id', user.id)
      .order('created_at')
    const active = (data || []).filter(g => g.saved < g.target)
    setGoals(active)
    if (active.length > 0) setSelected(active[0].id)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || !selected) return
    setSaving(true)
    const goal = goals.find(g => g.id === selected)
    if (!goal) return
    const newSaved = Math.min(goal.target, goal.saved + amt)
    await supabase.from('savings_goals').update({ saved: newSaved }).eq('id', selected)
    setAmount('')
    setSaving(false)
    setFlash(goal.name)
    setTimeout(() => setFlash(null), 2500)
    load()
  }

  if (goals.length === 0) return null

  const goal = goals.find(g => g.id === selected) || goals[0]
  const pct  = goal ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Add to goal</h2>
        <Link to="/savings-goals" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">
          All goals →
        </Link>
      </div>

      {flash && (
        <div className="mb-3 rounded-lg px-4 py-2.5 text-sm text-cyan-300 text-center"
          style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
          Added to {flash}! 🎯
        </div>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        {/* Goal selector */}
        <div className="flex gap-2 flex-wrap">
          {goals.map(g => (
            <button type="button" key={g.id}
              onClick={() => setSelected(g.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
              style={selected === g.id
                ? { background: 'linear-gradient(135deg,#00d4ff22,#7c3aed22)', border: '1px solid rgba(0,212,255,0.3)', color: '#fff' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid transparent', color: '#64748b' }}>
              <span>{g.icon}</span>
              <span className="truncate max-w-[100px]">{g.name}</span>
            </button>
          ))}
        </div>

        {/* Progress for selected goal */}
        {goal && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{pct}% saved</span>
              <span>${goal.saved.toLocaleString()} / ${goal.target.toLocaleString()}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#7c3aed,#e040fb)', boxShadow: '0 0 6px rgba(124,58,237,0.4)' }} />
            </div>
          </div>
        )}

        {/* Quick amounts + custom input */}
        <div className="flex gap-2 items-center flex-wrap">
          {[50, 100, 250, 500].map(a => (
            <button type="button" key={a}
              onClick={() => setAmount(String(a))}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={amount === String(a)
                ? { background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
              +${a}
            </button>
          ))}
          <div className="relative flex-1 min-w-[80px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input type="number" min="1" placeholder="Custom"
              value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full rounded-lg pl-7 pr-3 py-1.5 text-white text-sm outline-none"
              style={{ background: 'rgba(6,11,26,0.8)', border: '1px solid rgba(0,212,255,0.18)' }}
              onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'}
              onBlur={e => e.target.style.boxShadow = 'none'} />
          </div>
          <button type="submit" disabled={!amount || saving}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50 shrink-0"
            style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}>
            {saving ? '…' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}
