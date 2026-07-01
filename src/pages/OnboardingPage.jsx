import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'

const COUNTRIES = [
  { name: 'Australia',      preservationAge: 60 },
  { name: 'United States',  preservationAge: 65 },
  { name: 'United Kingdom', preservationAge: 57 },
  { name: 'Canada',         preservationAge: 65 },
  { name: 'New Zealand',    preservationAge: 65 },
  { name: 'Germany',        preservationAge: 67 },
  { name: 'France',         preservationAge: 62 },
  { name: 'Singapore',      preservationAge: 63 },
  { name: 'Other',          preservationAge: 65 },
]

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i)

const inputStyle = {
  background: 'rgba(6,11,26,0.8)',
  border: '1px solid rgba(0,212,255,0.15)',
}
const focusGlow = e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'
const blurGlow  = e => e.target.style.boxShadow = 'none'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { saveProfile } = useProfile()

  const [form, setForm] = useState({
    full_name:    '',
    dob_day:      '',
    dob_month:    '',
    dob_year:     '',
    country:      'Australia',
    super_balance: '',
    mobile:       '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!form.full_name.trim())  { setError('Please enter your full name.'); return }
    if (!form.dob_day || !form.dob_month || !form.dob_year) {
      setError('Please enter your full date of birth.'); return
    }
    if (!form.country) { setError('Please select your country.'); return }

    // Build YYYY-MM-DD string
    const mm  = String(form.dob_month).padStart(2, '0')
    const dd  = String(form.dob_day).padStart(2, '0')
    const dob = `${form.dob_year}-${mm}-${dd}`

    // Basic date validity check
    const parsed = new Date(dob)
    if (isNaN(parsed.getTime())) { setError('Please enter a valid date of birth.'); return }

    setLoading(true)
    const result = await saveProfile({
      full_name:     form.full_name.trim(),
      date_of_birth: dob,
      country:       form.country,
      super_balance: form.super_balance ? parseFloat(form.super_balance) : 0,
      mobile:        form.mobile.trim() || null,
    })
    setLoading(false)

    if (!result) { setError('Something went wrong — please try again.'); return }
    if (result.error) { setError(result.error.message || JSON.stringify(result.error)); return }

    navigate('/dashboard')
  }

  const selectedCountry = COUNTRIES.find(c => c.name === form.country)

  return (
    <div className="min-h-screen bg-space-900 flex items-center justify-center px-4">
      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #00d4ff, transparent 70%)' }} />
        <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
        <div className="text-center">
          <span className="text-2xl font-bold text-gradient">Retirely</span>
          <h1 className="text-white text-2xl font-semibold mt-4">Welcome! Let's set up your profile</h1>
          <p className="text-slate-500 text-sm mt-1">This takes less than a minute.</p>
        </div>

        <div className="glass rounded-2xl p-7 flex flex-col gap-5">
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm text-red-300 border border-red-500/30"
              style={{ background: 'rgba(239,68,68,0.1)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-sm">
                Full name <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Jane Smith"
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                style={inputStyle}
                onFocus={focusGlow}
                onBlur={blurGlow}
              />
            </div>

            {/* Date of birth — DD / MM / YYYY */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-sm">
                Date of birth <span className="text-pink-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Day */}
                <input
                  type="number"
                  min="1" max="31"
                  placeholder="DD"
                  value={form.dob_day}
                  onChange={e => set('dob_day', e.target.value)}
                  className="rounded-lg px-3 py-2.5 text-white text-sm outline-none text-center"
                  style={inputStyle}
                  onFocus={focusGlow}
                  onBlur={blurGlow}
                />
                {/* Month */}
                <select
                  value={form.dob_month}
                  onChange={e => set('dob_month', e.target.value)}
                  className="rounded-lg px-2 py-2.5 text-sm outline-none"
                  style={{ ...inputStyle, colorScheme: 'dark', color: form.dob_month ? 'white' : '#64748b' }}
                  onFocus={focusGlow}
                  onBlur={blurGlow}
                >
                  <option value="" disabled>MM</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                  ))}
                </select>
                {/* Year */}
                <select
                  value={form.dob_year}
                  onChange={e => set('dob_year', e.target.value)}
                  className="rounded-lg px-2 py-2.5 text-sm outline-none"
                  style={{ ...inputStyle, colorScheme: 'dark', color: form.dob_year ? 'white' : '#64748b' }}
                  onFocus={focusGlow}
                  onBlur={blurGlow}
                >
                  <option value="" disabled>YYYY</option>
                  {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Country */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-sm">
                Country <span className="text-pink-400">*</span>
              </label>
              <select
                value={form.country}
                onChange={e => set('country', e.target.value)}
                className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                style={{ ...inputStyle, colorScheme: 'dark' }}
                onFocus={focusGlow}
                onBlur={blurGlow}
              >
                {COUNTRIES.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              {selectedCountry && (
                <p className="text-slate-600 text-xs">
                  Preservation / pension age in {selectedCountry.name}:{' '}
                  <span className="text-cyan-400">{selectedCountry.preservationAge}</span>
                </p>
              )}
            </div>

            {/* Super balance — optional */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-sm">
                Superannuation / pension balance
                <span className="text-slate-600 ml-2 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 85000"
                  value={form.super_balance}
                  onChange={e => set('super_balance', e.target.value)}
                  className="w-full rounded-lg pl-7 pr-4 py-2.5 text-white text-sm outline-none"
                  style={inputStyle}
                  onFocus={focusGlow}
                  onBlur={blurGlow}
                />
              </div>
              <p className="text-slate-600 text-xs">
                This is locked until your preservation age — we'll show you how to bridge the gap.
              </p>
            </div>

            {/* Mobile — optional, needed for Australian bank sync */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-sm">
                Mobile number
                <span className="text-slate-600 ml-2 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. +61 400 000 000"
                value={form.mobile}
                onChange={e => set('mobile', e.target.value)}
                className="rounded-lg px-4 py-2.5 text-white text-sm outline-none"
                style={inputStyle}
                onFocus={focusGlow}
                onBlur={blurGlow}
              />
              <p className="text-slate-600 text-xs">
                Required if you want to connect an Australian bank account.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-3 rounded-xl font-semibold text-white text-sm transition-all duration-300 hover:scale-[1.02] hover:glow-cyan disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
            >
              {loading ? 'Saving…' : 'Get started →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
