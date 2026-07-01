import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { supabase } from '../lib/supabase'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const inputStyle = {
  background: 'linear-gradient(rgba(6,11,26,0.8),rgba(6,11,26,0.8)) padding-box,linear-gradient(135deg,#00d4ff,#7c3aed,#e040fb) border-box',
  border: '1px solid transparent',
}
const focusGlow = e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'
const blurGlow  = e => e.target.style.boxShadow = 'none'

const ASSET_CATEGORIES    = ['Cash & savings', 'Super / pension', 'Investments', 'Property', 'Vehicle', 'Other assets']
const LIABILITY_CATEGORIES = ['Mortgage', 'Personal loan', 'Credit card', 'Car loan', 'HECS / student loan', 'Other debt']

function fmt(n) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`
  return `$${Math.round(n).toLocaleString()}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => p.value != null && (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

const EMPTY = { category: '', label: '', amount: '', type: 'asset' }

export default function NetWorthPage() {
  const [entries,  setEntries]  = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: ent }, { data: snap }] = await Promise.all([
      supabase.from('net_worth_entries').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('net_worth_snapshots').select('*').eq('user_id', user.id).order('snapshot_date'),
    ])
    setEntries(ent || [])
    setSnapshots(snap || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.category || !form.amount) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('net_worth_entries').insert({
      user_id:  user.id,
      type:     form.type,
      category: form.category,
      label:    form.label.trim() || null,
      amount:   parseFloat(form.amount),
    })
    setForm(EMPTY)
    setShowForm(false)
    setSaving(false)
    // Take a snapshot after any entry change
    await takeSnapshot(user.id)
    load()
  }

  async function handleDelete(id) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('net_worth_entries').delete().eq('id', id)
    await takeSnapshot(user.id)
    load()
  }

  async function takeSnapshot(userId) {
    const { data: ent } = await supabase.from('net_worth_entries').select('*').eq('user_id', userId)
    const assets      = (ent || []).filter(e => e.type === 'asset').reduce((s, e) => s + e.amount, 0)
    const liabilities = (ent || []).filter(e => e.type === 'liability').reduce((s, e) => s + e.amount, 0)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('net_worth_snapshots').upsert({
      user_id:       userId,
      snapshot_date: today,
      assets,
      liabilities,
      net_worth:     assets - liabilities,
    }, { onConflict: 'user_id,snapshot_date' })
  }

  const assets      = entries.filter(e => e.type === 'asset')
  const liabilities = entries.filter(e => e.type === 'liability')
  const totalAssets = assets.reduce((s, e) => s + e.amount, 0)
  const totalLiab   = liabilities.reduce((s, e) => s + e.amount, 0)
  const netWorth    = totalAssets - totalLiab

  const chartData = snapshots.map(s => ({
    date:         new Date(s.snapshot_date).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
    assets:       s.assets,
    liabilities:  s.liabilities,
    'Net worth':  s.net_worth,
  }))

  const categories = form.type === 'asset' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">Net Worth</h1>
          <p className="text-slate-400 text-sm">Your assets minus your liabilities — your true financial picture.</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white glass transition-colors hover:text-cyan-400"
        >
          {showForm ? 'Cancel' : '+ Add item'}
        </button>
      </div>

      {/* Hero net worth */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total assets',      value: fmt(totalAssets), color: '#00d4ff' },
          { label: 'Total liabilities', value: fmt(totalLiab),   color: '#e040fb' },
          { label: 'Net worth',         value: fmt(netWorth),    color: netWorth >= 0 ? '#7c3aed' : '#f43f5e' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-6 text-center">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">{s.label}</p>
            <p className="text-3xl font-bold" style={{ color: s.color, textShadow: `0 0 20px ${s.color}50` }}>
              {loading ? '—' : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-5">Add asset or liability</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-3">
              {['asset', 'liability'].map(t => (
                <button type="button" key={t}
                  onClick={() => { set('type', t); set('category', '') }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all"
                  style={form.type === t
                    ? { background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#64748b' }}
                >{t}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Category <span className="text-pink-400">*</span></label>
                <select required value={form.category} onChange={e => set('category', e.target.value)}
                  className="rounded-lg px-4 py-2.5 text-sm outline-none"
                  style={{ ...inputStyle, colorScheme: 'dark', color: form.category ? '#fff' : '#64748b' }}
                  onFocus={focusGlow} onBlur={blurGlow}>
                  <option value="" disabled>Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Label <span className="text-slate-600 font-normal">(optional)</span></label>
                <input type="text" placeholder="e.g. ANZ savings account"
                  value={form.label} onChange={e => set('label', e.target.value)}
                  className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                  style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-slate-400 text-sm">Current value ($) <span className="text-pink-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input type="number" required min="0" placeholder="e.g. 25000"
                    value={form.amount} onChange={e => set('amount', e.target.value)}
                    className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                    style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
                </div>
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}>
              {saving ? 'Saving…' : 'Add item'}
            </button>
          </form>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-6">Net worth over time</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradNW" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => fmt(v)} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Net worth" stroke="#7c3aed" strokeWidth={2} fill="url(#gradNW)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Assets and liabilities lists */}
      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { title: 'Assets', items: assets,      color: '#00d4ff', total: totalAssets },
            { title: 'Liabilities', items: liabilities, color: '#e040fb', total: totalLiab },
          ].map(({ title, items, color, total }) => (
            <div key={title} className="glass rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-semibold">{title}</h2>
                <span className="font-bold" style={{ color }}>{fmt(total)}</span>
              </div>
              {items.length === 0 ? (
                <p className="text-slate-600 text-sm">None added yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {items.map(e => (
                    <div key={e.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-sm text-slate-300">{e.label || e.category}</p>
                        {e.label && <p className="text-xs text-slate-600">{e.category}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm" style={{ color }}>${e.amount.toLocaleString()}</span>
                        <button onClick={() => handleDelete(e.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-slate-400 text-sm mb-1">No items added yet.</p>
          <p className="text-slate-600 text-xs">Add your assets (savings, super, property) and liabilities (mortgage, debts) above.</p>
        </div>
      )}
    </AppLayout>
  )
}
