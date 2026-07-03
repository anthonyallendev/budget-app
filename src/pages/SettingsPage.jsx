import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'

const inputBase = {
  background: 'rgba(6,11,26,0.8)',
  border: '1px solid rgba(0,212,255,0.18)',
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-slate-400 text-xs uppercase tracking-wider font-medium">{label}</label>
      {children}
      {hint && <p className="text-slate-600 text-xs">{hint}</p>}
    </div>
  )
}

function SaveBar({ saving, saved, onSave }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
      {saved && <span className="text-xs text-cyan-400">✓ Saved</span>}
    </div>
  )
}

// ── Profile tab ──────────────────────────────────────────────────────────────

function ProfileTab({ profile, saveProfile }) {
  const [form, setForm] = useState({
    full_name:   profile?.full_name    || '',
    date_of_birth: profile?.date_of_birth || '',
    country:     profile?.country      || 'AU',
    mobile:      profile?.mobile       || '',
    username:    profile?.username     || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); setError('') }

  async function handleSave() {
    setSaving(true); setError('')
    const { error } = await saveProfile(form)
    setSaving(false)
    if (error) {
      setError(error.message.includes('unique') || error.message.includes('duplicate')
        ? 'That username is already taken. Please choose another.'
        : error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Field label="Full name">
        <input
          value={form.full_name}
          onChange={e => set('full_name', e.target.value)}
          placeholder="Your full name"
          className="rounded-xl px-4 py-3 text-white text-sm outline-none"
          style={inputBase}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Date of birth">
          <input
            type="date"
            value={form.date_of_birth}
            onChange={e => set('date_of_birth', e.target.value)}
            className="rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={{ ...inputBase, colorScheme: 'dark' }}
          />
        </Field>

        <Field label="Country">
          <select
            value={form.country}
            onChange={e => set('country', e.target.value)}
            className="rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={{ ...inputBase, colorScheme: 'dark' }}
          >
            <option value="AU">🇦🇺 Australia</option>
            <option value="US">🇺🇸 United States</option>
            <option value="UK">🇬🇧 United Kingdom</option>
            <option value="CA">🇨🇦 Canada</option>
          </select>
        </Field>
      </div>

      <Field label="Mobile" hint="Optional — not shared publicly">
        <input
          value={form.mobile}
          onChange={e => set('mobile', e.target.value)}
          placeholder="+61 400 000 000"
          className="rounded-xl px-4 py-3 text-white text-sm outline-none"
          style={inputBase}
        />
      </Field>

      <Field label="Leaderboard username" hint="Displayed publicly on the leaderboard. Must be unique.">
        <input
          value={form.username}
          onChange={e => set('username', e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
          placeholder="e.g. savingsking99"
          maxLength={30}
          className="rounded-xl px-4 py-3 text-white text-sm outline-none"
          style={inputBase}
        />
      </Field>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  )
}

// ── Financial tab ────────────────────────────────────────────────────────────

function FinancialTab({ profile, saveProfile }) {
  const [form, setForm] = useState({
    personal_savings:       profile?.personal_savings       ?? '',
    monthly_contribution:   profile?.monthly_contribution   ?? '',
    desired_annual_income:  profile?.desired_annual_income  ?? '',
    interest_rate:          profile?.interest_rate          ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }

  async function handleSave() {
    setSaving(true); setError('')
    const numeric = {
      personal_savings:      parseFloat(form.personal_savings)      || 0,
      monthly_contribution:  parseFloat(form.monthly_contribution)  || 0,
      desired_annual_income: parseFloat(form.desired_annual_income) || 0,
      interest_rate:         parseFloat(form.interest_rate)         || 0,
    }
    const { error } = await saveProfile(numeric)
    setSaving(false)
    if (error) setError(error.message)
    else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-slate-500 text-sm">These values power your retirement calculator and financial projections.</p>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Current savings & investments ($)" hint="Total of savings accounts, shares, super, etc.">
          <input
            type="number"
            min="0"
            value={form.personal_savings}
            onChange={e => set('personal_savings', e.target.value)}
            placeholder="e.g. 50000"
            className="rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={inputBase}
          />
        </Field>

        <Field label="Monthly savings contribution ($)" hint="How much you save/invest each month.">
          <input
            type="number"
            min="0"
            value={form.monthly_contribution}
            onChange={e => set('monthly_contribution', e.target.value)}
            placeholder="e.g. 500"
            className="rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={inputBase}
          />
        </Field>

        <Field label="Target retirement income ($/yr)" hint="Annual income you want in retirement.">
          <input
            type="number"
            min="0"
            value={form.desired_annual_income}
            onChange={e => set('desired_annual_income', e.target.value)}
            placeholder="e.g. 60000"
            className="rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={inputBase}
          />
        </Field>

        <Field label="Expected annual return (%)" hint="Assumed investment growth rate (e.g. 7% for moderate).">
          <input
            type="number"
            min="0"
            max="30"
            step="0.1"
            value={form.interest_rate}
            onChange={e => set('interest_rate', e.target.value)}
            placeholder="e.g. 7"
            className="rounded-xl px-4 py-3 text-white text-sm outline-none"
            style={inputBase}
          />
        </Field>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
    </div>
  )
}

// ── Account tab ──────────────────────────────────────────────────────────────

function AccountTab({ profile }) {
  const navigate = useNavigate()
  const [email, setEmail]                 = useState('')
  const [pwSending, setPwSending]         = useState(false)
  const [pwMsg, setPwMsg]                 = useState('')
  const [portalLoading, setPortalLoading] = useState(false)
  const [deleteStep, setDeleteStep]       = useState(0)
  const [deleteInput, setDeleteInput]     = useState('')
  const [deleting, setDeleting]           = useState(false)

  const isPremium = profile?.subscription_status === 'premium'

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setEmail(data.user.email)
    })
  }, [])

  async function handleResetPassword() {
    if (!email) return
    setPwSending(true); setPwMsg('')
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` })
    setPwSending(false)
    setPwMsg(`Password reset link sent to ${email}`)
    setTimeout(() => setPwMsg(''), 6000)
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setPortalLoading(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteInput !== 'DELETE') return
    setDeleting(true)

    // Delete user-owned data from all tables
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const id = user.id
      await Promise.allSettled([
        supabase.from('transactions').delete().eq('user_id', id),
        supabase.from('savings_goals').delete().eq('user_id', id),
        supabase.from('net_worth_entries').delete().eq('user_id', id),
        supabase.from('net_worth_snapshots').delete().eq('user_id', id),
        supabase.from('leaderboard_scores').delete().eq('user_id', id),
        supabase.from('referral_credits').delete().eq('user_id', id),
        supabase.from('referrals').delete().eq('referrer_id', id),
        supabase.from('referral_invites').delete().eq('referrer_id', id),
        supabase.from('referral_codes').delete().eq('user_id', id),
      ])
      await supabase.from('profiles').delete().eq('id', id)
    }
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Email */}
      <div className="glass rounded-2xl p-5 flex flex-col gap-4" style={{ borderColor: 'rgba(0,212,255,0.12)' }}>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Login email</p>
        <p className="text-white font-medium">{email || '—'}</p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleResetPassword}
            disabled={pwSending || !email}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white glass transition-colors disabled:opacity-50"
          >
            {pwSending ? 'Sending…' : 'Send password reset email'}
          </button>
          {pwMsg && <span className="text-cyan-400 text-xs">{pwMsg}</span>}
        </div>
      </div>

      {/* Subscription */}
      <div className="glass rounded-2xl p-5 flex flex-col gap-4" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Subscription</p>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            isPremium
              ? 'text-cyan-400'
              : 'text-slate-400'
          }`}
            style={isPremium
              ? { background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }
              : { background: 'rgba(255,255,255,0.05)' }
            }>
            {isPremium ? '⭐ Premium' : 'Free plan'}
          </span>
          {!isPremium && (
            <button
              onClick={() => navigate('/upgrade')}
              className="text-sm font-semibold px-4 py-1.5 rounded-lg text-white transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#e040fb)' }}
            >
              Upgrade →
            </button>
          )}
        </div>
        {isPremium && (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="w-fit px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white glass transition-colors disabled:opacity-50"
          >
            {portalLoading ? 'Opening…' : 'Manage subscription →'}
          </button>
        )}
      </div>

      {/* Danger zone */}
      <div className="glass rounded-2xl p-5 flex flex-col gap-4" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
        <p className="text-xs text-red-500 uppercase tracking-wider font-medium">Danger zone</p>
        {deleteStep === 0 ? (
          <>
            <p className="text-slate-400 text-sm">Permanently delete your account and all associated data. This cannot be undone.</p>
            <button
              onClick={() => setDeleteStep(1)}
              className="w-fit px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
            >
              Delete my account
            </button>
          </>
        ) : (
          <>
            <p className="text-white font-medium text-sm">Are you absolutely sure?</p>
            <p className="text-slate-400 text-sm">All your transactions, goals, and data will be permanently deleted. Type <strong className="text-white">DELETE</strong> to confirm.</p>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="rounded-xl px-4 py-3 text-white text-sm outline-none max-w-xs"
              style={{ ...inputBase, borderColor: 'rgba(239,68,68,0.3)' }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteStep(0); setDeleteInput('') }}
                className="px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-white glass transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || deleting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-40 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Yes, delete everything'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const TABS = ['Profile', 'Financial', 'Account']

export default function SettingsPage() {
  const { profile, loading, saveProfile } = useProfile()
  const [tab, setTab] = useState('Profile')

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-slate-400 text-sm">Manage your profile, financial inputs, and account.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 glass rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={tab === t
              ? { background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', color: '#fff' }
              : { color: '#64748b' }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-slate-600 text-sm">Loading…</div>
      ) : (
        <div className="glass rounded-2xl p-6 max-w-2xl" style={{ borderColor: 'rgba(0,212,255,0.12)' }}>
          {tab === 'Profile'   && <ProfileTab   profile={profile} saveProfile={saveProfile} />}
          {tab === 'Financial' && <FinancialTab  profile={profile} saveProfile={saveProfile} />}
          {tab === 'Account'   && <AccountTab    profile={profile} />}
        </div>
      )}
    </AppLayout>
  )
}
