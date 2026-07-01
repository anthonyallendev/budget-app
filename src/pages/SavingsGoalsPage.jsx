import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { supabase } from '../lib/supabase'

const inputStyle = {
  background: 'rgba(6,11,26,0.8)',
  border: '1px solid rgba(0,212,255,0.18)',
}
const focusGlow = e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'
const blurGlow  = e => e.target.style.boxShadow = 'none'

const ICONS = ['🏖️','🏠','🚗','💍','🎓','✈️','💻','🏋️','🐣','🌱','💰','🎯']

const EMPTY_FORM = { name: '', target: '', saved: '', target_date: '', icon: '🎯' }

function daysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr) - new Date()
  return Math.max(0, Math.ceil(d / (1000 * 60 * 60 * 24)))
}

function monthsUntil(dateStr) {
  if (!dateStr) return null
  const now   = new Date()
  const target = new Date(dateStr)
  return Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()))
}

export default function SavingsGoalsPage() {
  const [goals,      setGoals]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [editId,     setEditId]     = useState(null)

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setGoals(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.target) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const row = {
      user_id:     user.id,
      name:        form.name.trim(),
      icon:        form.icon,
      target:      parseFloat(form.target),
      saved:       parseFloat(form.saved) || 0,
      target_date: form.target_date || null,
    }
    if (editId) {
      await supabase.from('savings_goals').update(row).eq('id', editId)
    } else {
      await supabase.from('savings_goals').insert(row)
    }
    setSaving(false)
    setForm(EMPTY_FORM)
    setShowForm(false)
    setEditId(null)
    load()
  }

  async function handleDelete(id) {
    await supabase.from('savings_goals').delete().eq('id', id)
    load()
  }

  function startEdit(goal) {
    setForm({
      name:        goal.name,
      icon:        goal.icon || '🎯',
      target:      goal.target,
      saved:       goal.saved,
      target_date: goal.target_date || '',
    })
    setEditId(goal.id)
    setShowForm(true)
  }

  async function addToSaved(goal, amount) {
    const newSaved = Math.min(goal.target, goal.saved + amount)
    await supabase.from('savings_goals').update({ saved: newSaved }).eq('id', goal.id)
    load()
  }

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">Savings Goals</h1>
          <p className="text-slate-400 text-sm">Track your progress toward the things that matter.</p>
        </div>
        <button
          onClick={() => { setShowForm(f => !f); setEditId(null); setForm(EMPTY_FORM) }}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white glass transition-colors hover:text-cyan-400"
        >
          {showForm ? 'Cancel' : '+ New goal'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-5">{editId ? 'Edit goal' : 'New savings goal'}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Icon picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-sm">Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(ic => (
                  <button type="button" key={ic}
                    onClick={() => set('icon', ic)}
                    className="w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all"
                    style={{
                      background: form.icon === ic ? 'linear-gradient(135deg,#00d4ff,#7c3aed)' : 'rgba(255,255,255,0.05)',
                      boxShadow: form.icon === ic ? '0 0 12px rgba(0,212,255,0.3)' : 'none',
                    }}
                  >{ic}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Goal name <span className="text-pink-400">*</span></label>
                <input type="text" required placeholder="e.g. Emergency fund"
                  value={form.name} onChange={e => set('name', e.target.value)}
                  className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                  style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Target amount ($) <span className="text-pink-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input type="number" min="1" required placeholder="e.g. 10000"
                    value={form.target} onChange={e => set('target', e.target.value)}
                    className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                    style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Amount already saved ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input type="number" min="0" placeholder="0"
                    value={form.saved} onChange={e => set('saved', e.target.value)}
                    className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                    style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Target date <span className="text-slate-600 font-normal">(optional)</span></label>
                <input type="date"
                  value={form.target_date} onChange={e => set('target_date', e.target.value)}
                  className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                  style={{ ...inputStyle, colorScheme: 'dark' }} onFocus={focusGlow} onBlur={blurGlow} />
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-50 mt-1"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}>
              {saving ? 'Saving…' : editId ? 'Update goal' : 'Create goal'}
            </button>
          </form>
        </div>
      )}

      {/* Goals grid */}
      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-slate-600 text-sm">Loading…</div>
      ) : goals.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">🎯</p>
          <p className="text-slate-400 text-sm mb-2">No savings goals yet.</p>
          <p className="text-slate-600 text-xs">Add your first goal using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {goals.map(goal => {
            const pct      = Math.min(100, Math.round((goal.saved / goal.target) * 100))
            const left     = Math.max(0, goal.target - goal.saved)
            const mo       = monthsUntil(goal.target_date)
            const monthly  = mo && mo > 0 ? left / mo : null
            const done     = pct >= 100

            return (
              <div key={goal.id} className="glass rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{goal.icon || '🎯'}</span>
                    <div>
                      <p className="text-white font-semibold leading-tight">{goal.name}</p>
                      {goal.target_date && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          {done ? '🎉 Complete!' : `${daysUntil(goal.target_date)} days left`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(goal)}
                      className="text-slate-600 hover:text-cyan-400 transition-colors text-sm">✏️</button>
                    <button onClick={() => handleDelete(goal.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: done ? '#00d4ff' : '#7c3aed' }}>{pct}%</span>
                    <span className="text-slate-500">
                      ${goal.saved.toLocaleString()} / ${goal.target.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: done
                          ? 'linear-gradient(90deg,#00d4ff,#7c3aed)'
                          : 'linear-gradient(90deg,#7c3aed,#e040fb)',
                        boxShadow: done ? '0 0 8px rgba(0,212,255,0.4)' : '0 0 8px rgba(124,58,237,0.4)',
                      }} />
                  </div>
                </div>

                {monthly && !done && (
                  <p className="text-xs text-slate-500">
                    Need <span className="text-white font-semibold">${Math.round(monthly).toLocaleString()}/mo</span> to reach goal on time
                  </p>
                )}

                {/* Quick-add buttons */}
                {!done && (
                  <div className="flex gap-2 flex-wrap">
                    {[100, 500, 1000].map(amt => (
                      <button key={amt}
                        onClick={() => addToSaved(goal, amt)}
                        className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        +${amt}
                      </button>
                    ))}
                  </div>
                )}

                {done && (
                  <p className="text-center text-sm font-semibold text-gradient">Goal reached! 🎉</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
