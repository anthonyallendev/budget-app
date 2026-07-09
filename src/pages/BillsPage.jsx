import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { useMigratedFeatureData } from '../hooks/useMigratedFeatureData'

const inputStyle = {
  background: 'rgba(6,11,26,0.8)',
  border: '1px solid rgba(0,212,255,0.18)',
}
const focusGlow = e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'
const blurGlow  = e => e.target.style.boxShadow = 'none'

const CATEGORIES = ['Housing', 'Utilities', 'Subscriptions', 'Insurance', 'Transport', 'Health', 'Education', 'Other']
const FREQUENCIES = [
  { value: 'monthly',   label: 'Monthly'   },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly',    label: 'Yearly'    },
  { value: 'weekly',    label: 'Weekly'    },
]

const EMPTY = { name: '', amount: '', dueDay: '1', category: 'Utilities', frequency: 'monthly', notes: '' }

export function nextDueDate(bill) {
  const today = new Date(); today.setHours(0,0,0,0)
  const day   = parseInt(bill.dueDay)

  if (bill.frequency === 'weekly') {
    // dueDay = 0-6 (Sun-Sat)
    const diff = (day - today.getDay() + 7) % 7
    const d = new Date(today); d.setDate(today.getDate() + (diff === 0 ? 7 : diff))
    return d
  }

  if (bill.frequency === 'monthly') {
    let d = new Date(today.getFullYear(), today.getMonth(), day)
    if (d <= today) d = new Date(today.getFullYear(), today.getMonth() + 1, day)
    return d
  }

  if (bill.frequency === 'quarterly') {
    for (let i = 0; i <= 4; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i * 3, day)
      if (d > today) return d
    }
  }

  if (bill.frequency === 'yearly') {
    let d = new Date(today.getFullYear(), parseInt(bill.dueMonth || 0), day)
    if (d <= today) d = new Date(today.getFullYear() + 1, parseInt(bill.dueMonth || 0), day)
    return d
  }

  return null
}

export function daysUntilBill(bill) {
  const next = nextDueDate(bill)
  if (!next) return null
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.round((next - today) / (1000 * 60 * 60 * 24))
}

// getBills reads localStorage directly (unchanged) rather than the
// Supabase-backed hook below, since it's called synchronously from elsewhere
// (e.g. UpcomingBillsWidget on the Dashboard) — it stays fresh because the
// component's save() below always mirrors writes to this same localStorage key.
export function getBills() {
  try { return JSON.parse(localStorage.getItem('bills')) || [] } catch { return [] }
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function BillsPage() {
  const { data: bills, save: setBills } = useMigratedFeatureData('bills', 'bills', [])
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState(EMPTY)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleAdd(e) {
    e.preventDefault()
    if (!form.name || !form.amount) return
    setBills([...bills, { ...form, id: Date.now().toString() }])
    setForm(EMPTY)
    setShowForm(false)
  }

  function deleteBill(id) { setBills(bills.filter(x => x.id !== id)) }

  const sorted = [...bills].sort((a, b) => (daysUntilBill(a) ?? 999) - (daysUntilBill(b) ?? 999))
  const monthlyTotal = bills.reduce((s, b) => {
    const amt = parseFloat(b.amount) || 0
    if (b.frequency === 'monthly')   return s + amt
    if (b.frequency === 'quarterly') return s + amt / 3
    if (b.frequency === 'yearly')    return s + amt / 12
    if (b.frequency === 'weekly')    return s + amt * 4.33
    return s
  }, 0)

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">Upcoming Bills</h1>
          <p className="text-slate-400 text-sm">Track recurring bills so you always know what's coming.</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white glass transition-colors hover:text-cyan-400"
        >
          {showForm ? 'Cancel' : '+ Add bill'}
        </button>
      </div>

      {/* Monthly total */}
      {bills.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Total recurring</p>
            <p className="text-3xl font-bold text-gradient">${Math.round(monthlyTotal).toLocaleString()}<span className="text-base font-normal text-slate-500">/mo</span></p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-xs">Per year</p>
            <p className="text-white font-semibold">${Math.round(monthlyTotal * 12).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-5">Add a recurring bill</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Bill name <span className="text-pink-400">*</span></label>
                <input type="text" required placeholder="e.g. Netflix, Rent, Power bill"
                  value={form.name} onChange={e => set('name', e.target.value)}
                  className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                  style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Amount ($) <span className="text-pink-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input type="number" required min="0" step="0.01" placeholder="e.g. 19.99"
                    value={form.amount} onChange={e => set('amount', e.target.value)}
                    className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                    style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Frequency</label>
                <select value={form.frequency} onChange={e => set('frequency', e.target.value)}
                  className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={focusGlow} onBlur={blurGlow}>
                  {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">
                  {form.frequency === 'weekly' ? 'Day of week' : 'Day of month'}
                </label>
                {form.frequency === 'weekly' ? (
                  <select value={form.dueDay} onChange={e => set('dueDay', e.target.value)}
                    className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={focusGlow} onBlur={blurGlow}>
                    {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
                      .map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                ) : (
                  <input type="number" min="1" max="31" placeholder="e.g. 15"
                    value={form.dueDay} onChange={e => set('dueDay', e.target.value)}
                    className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                    style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={focusGlow} onBlur={blurGlow}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-sm">Notes <span className="text-slate-600 font-normal">(optional)</span></label>
                <input type="text" placeholder="e.g. auto-pays from savings"
                  value={form.notes} onChange={e => set('notes', e.target.value)}
                  className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                  style={inputStyle} onFocus={focusGlow} onBlur={blurGlow} />
              </div>
            </div>
            <button type="submit"
              className="py-3 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02] mt-1"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}>
              Save bill
            </button>
          </form>
        </div>
      )}

      {/* Bills list */}
      {bills.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">📅</p>
          <p className="text-slate-400 text-sm mb-1">No bills added yet.</p>
          <p className="text-slate-600 text-xs">Add recurring bills to always know what's coming up.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-white font-semibold">All bills</h2>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {sorted.map(bill => {
              const days = daysUntilBill(bill)
              const next = nextDueDate(bill)
              const urgent = days !== null && days <= 7
              const soon   = days !== null && days <= 14
              return (
                <div key={bill.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-center"
                    style={{ background: urgent ? 'rgba(224,64,251,0.12)' : 'rgba(255,255,255,0.04)' }}>
                    <span className="text-xs font-bold" style={{ color: urgent ? '#e040fb' : '#00d4ff' }}>
                      {next ? next.getDate() : '—'}
                    </span>
                    <span className="text-xs text-slate-600">
                      {next ? MONTHS[next.getMonth()] : ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{bill.name}</p>
                    <p className="text-slate-500 text-xs">
                      {bill.category} · {FREQUENCIES.find(f => f.value === bill.frequency)?.label}
                      {bill.notes && <span className="text-slate-600"> · {bill.notes}</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-semibold text-sm">${parseFloat(bill.amount).toFixed(2)}</p>
                    <p className="text-xs mt-0.5" style={{ color: urgent ? '#e040fb' : soon ? '#f59e0b' : '#475569' }}>
                      {days === 0 ? 'Due today!' : days === 1 ? 'Tomorrow' : days !== null ? `In ${days} days` : '—'}
                    </p>
                  </div>
                  <button onClick={() => deleteBill(bill.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none ml-2">×</button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
