import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { supabase } from '../lib/supabase'

const APP_URL = 'https://retirely.money'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
}

function Stat({ label, value, sub, color }) {
  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <p className="text-slate-500 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold" style={{ color: color || '#fff' }}>{value}</p>
      {sub && <p className="text-slate-600 text-xs">{sub}</p>}
    </div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={copied
        ? { background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }
        : { background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }
      }
    >
      {copied ? (
        <><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#00d4ff" strokeWidth="1.5"><path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>Copied!</>
      ) : (
        <><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="7" height="7" rx="1" /><path d="M1 8V2a1 1 0 011-1h6" strokeLinecap="round" /></svg>Copy</>
      )}
    </button>
  )
}

function StatusBadge({ status }) {
  const map = {
    signed_up:  { label: 'Signed up',  color: '#64748b' },
    subscribed: { label: 'Subscribed', color: '#00d4ff' },
    credited:   { label: '$1 earned',  color: '#10b981' },
  }
  const s = map[status] || { label: status, color: '#64748b' }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: `${s.color}18`, color: s.color }}>
      {s.label}
    </span>
  )
}

const MSG = `I've been using Retirely to track my savings & retirement goals — it's free! Sign up here:`

function ShareButtons({ link }) {
  const [igCopied, setIgCopied] = useState(false)
  const encoded = encodeURIComponent(link)
  const msgEncoded = encodeURIComponent(`${MSG} ${link}`)

  function copyForInstagram() {
    navigator.clipboard.writeText(link)
    setIgCopied(true)
    setTimeout(() => setIgCopied(false), 2500)
  }

  const platforms = [
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${msgEncoded}`,
      bg: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: 'rgba(255,255,255,0.12)',
      icon: <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path d="M16.99 0H20L13.02 8.18 21.22 20h-6.33l-4.99-6.54L3.72 20H.71l7.47-8.54L0 0h6.49l4.51 5.9L16.99 0zM15.92 18h1.76L5.18 1.8H3.3L15.92 18z"/></svg>,
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      bg: 'rgba(24,119,242,0.1)', color: '#1877f2', border: 'rgba(24,119,242,0.25)',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.028 4.388 11.026 10.125 11.927v-8.434H7.078v-3.493h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.493h-2.796v8.434C19.612 23.099 24 18.1 24 12.073z"/></svg>,
    },
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${msgEncoded}`,
      bg: 'rgba(37,211,102,0.1)', color: '#25d366', border: 'rgba(37,211,102,0.25)',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      bg: 'rgba(0,119,181,0.1)', color: '#0077b5', border: 'rgba(0,119,181,0.25)',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    },
    {
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encoded}&text=${encodeURIComponent(MSG)}`,
      bg: 'rgba(0,136,204,0.1)', color: '#0088cc', border: 'rgba(0,136,204,0.25)',
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      <p className="text-slate-600 text-xs">Share on:</p>
      <div className="flex flex-wrap gap-2">
        {platforms.map(p => (
          <a key={p.label} href={p.href} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}` }}
          >
            {p.icon}{p.label}
          </a>
        ))}
        {/* Instagram — copy to clipboard since no web share URL exists */}
        <button
          onClick={copyForInstagram}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{ background: 'rgba(225,48,108,0.1)', color: igCopied ? '#10b981' : '#e1306c', border: `1px solid ${igCopied ? 'rgba(16,185,129,0.3)' : 'rgba(225,48,108,0.25)'}` }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
          {igCopied ? 'Link copied!' : 'Instagram'}
        </button>
      </div>
      {igCopied && (
        <p className="text-xs text-slate-500">Link copied — paste it in your Instagram bio or story.</p>
      )}
    </div>
  )
}

export default function ReferralPage() {
  const [searchParams] = useSearchParams()

  const [code, setCode]             = useState(null)
  const [editCode, setEditCode]     = useState('')
  const [editMode, setEditMode]     = useState(false)
  const [codeError, setCodeError]   = useState(null)
  const [stats, setStats]           = useState(null)
  const [invites, setInvites]       = useState([])
  const [emailRows, setEmailRows] = useState([{ id: 1, value: '', status: null, msg: null }])
  const [sendingAll, setSendingAll] = useState(false)
  const nextId = useRef(2)
  const [connectLoading, setConnectLoading] = useState(false)
  const [payoutLoading, setPayoutLoading]   = useState(false)
  const [payoutMsg, setPayoutMsg]   = useState(null)
  const [loading, setLoading]       = useState(true)

  const referralLink = code ? `${APP_URL}/?ref=${code}` : ''

  const load = useCallback(async () => {
    const headers = await authHeaders()
    const [codeRes, statsRes, invitesRes] = await Promise.all([
      fetch('/api/referral/my-code', { headers }),
      fetch('/api/referral/stats',   { headers }),
      fetch('/api/referral/invites', { headers }),
    ])
    const [codeData, statsData, invitesData] = await Promise.all([
      codeRes.json(), statsRes.json(), invitesRes.json(),
    ])
    setCode(codeData.code)
    setStats(statsData)
    setInvites(invitesData.invites || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Handle ?connect=complete redirect from Stripe onboarding
  useEffect(() => {
    if (searchParams.get('connect') === 'complete') {
      load()
    }
  }, [searchParams, load])

  async function saveCustomCode() {
    if (!editCode.trim()) return
    setCodeError(null)
    const headers = await authHeaders()
    const res = await fetch('/api/referral/my-code', {
      method: 'POST',
      headers,
      body: JSON.stringify({ code: editCode }),
    })
    const data = await res.json()
    if (!res.ok) { setCodeError(data.error); return }
    setCode(data.code)
    setEditMode(false)
    setEditCode('')
  }

  function updateRow(id, value) {
    setEmailRows(rows => {
      const updated = rows.map(r => r.id === id ? { ...r, value, status: null, msg: null } : r)
      // Auto-add a new row when the last one has a valid email
      const last = updated[updated.length - 1]
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(last.value)
      if (isValid) {
        updated.push({ id: nextId.current++, value: '', status: null, msg: null })
      }
      return updated
    })
  }

  async function sendAllInvites(e) {
    e.preventDefault()
    const valid = emailRows.filter(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.value))
    if (!valid.length) return
    setSendingAll(true)
    const headers = await authHeaders()

    for (const row of valid) {
      setEmailRows(rows => rows.map(r => r.id === row.id ? { ...r, status: 'sending' } : r))
      try {
        const res = await fetch('/api/referral/invite-email', {
          method: 'POST', headers,
          body: JSON.stringify({ email: row.value }),
        })
        const data = await res.json()
        const msg = !res.ok ? data.error : data.alreadyConverted ? 'Already joined' : 'Sent!'
        const status = !res.ok ? 'error' : 'sent'
        setEmailRows(rows => rows.map(r => r.id === row.id ? { ...r, status, msg } : r))
      } catch {
        setEmailRows(rows => rows.map(r => r.id === row.id ? { ...r, status: 'error', msg: 'Failed' } : r))
      }
    }

    setSendingAll(false)
    load()
    // Reset to a fresh empty row after a short delay
    setTimeout(() => {
      setEmailRows([{ id: nextId.current++, value: '', status: null, msg: null }])
    }, 2500)
  }

  async function handleConnectStripe() {
    setConnectLoading(true)
    const headers = await authHeaders()

    // Create account if needed
    const createRes = await fetch('/api/stripe/connect/create-account', { method: 'POST', headers })
    if (!createRes.ok) { setConnectLoading(false); return }

    // Get onboarding link
    const linkRes = await fetch('/api/stripe/connect/onboarding-link', { method: 'POST', headers })
    const linkData = await linkRes.json()
    if (linkData.alreadyComplete) { await load(); setConnectLoading(false); return }
    if (linkData.url) window.location.href = linkData.url
    setConnectLoading(false)
  }

  async function handlePayout() {
    setPayoutLoading(true)
    setPayoutMsg(null)
    const headers = await authHeaders()
    const res = await fetch('/api/stripe/connect/payout-request', { method: 'POST', headers })
    const data = await res.json()
    if (!res.ok) {
      setPayoutMsg({ ok: false, text: data.error })
    } else {
      setPayoutMsg({ ok: true, text: `$${data.payoutDollars} AUD transfer initiated! It will arrive in 2–5 business days.` })
      load()
    }
    setPayoutLoading(false)
  }

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-40">
        <div className="w-7 h-7 rounded-full animate-spin"
          style={{ border: '2px solid rgba(0,212,255,0.2)', borderTopColor: '#00d4ff' }} />
      </div>
    </AppLayout>
  )

  const totalReferrals   = stats?.referrals?.length || 0
  const subscribed       = (stats?.referrals || []).filter(r => r.status === 'subscribed' || r.status === 'credited').length
  const totalEarnedDollars = ((stats?.totalCredits || 0) / 100).toFixed(0)
  const payoutEligible   = (stats?.payoutEligibleCents || 0) / 100
  const connectComplete  = stats?.connectAccount?.onboarding_complete
  const hasConnectAccount = !!stats?.connectAccount

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{
            background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Refer & Earn
          </h1>
          <p className="text-slate-400">Earn $1 for every person who subscribes to Premium with your link. At 9 referrals your subscription is free — beyond that, we pay you.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total referrals" value={totalReferrals} color="#fff" />
          <Stat label="Subscribed" value={subscribed} sub="converted to Premium" color="#00d4ff" />
          <Stat label="Credits earned" value={`$${totalEarnedDollars}`} sub="$1 per subscriber" color="#10b981" />
          <Stat label="Payout available"
            value={payoutEligible > 0 ? `$${payoutEligible.toFixed(2)}` : '—'}
            sub="above your sub cost"
            color={payoutEligible > 0 ? '#a78bfa' : '#64748b'}
          />
        </div>

        {/* Referral link card */}
        <div className="glass rounded-2xl p-6 flex flex-col gap-4" style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">Your referral link</h2>
            <button
              onClick={() => { setEditMode(!editMode); setEditCode(code || ''); setCodeError(null) }}
              className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
            >
              {editMode ? 'Cancel' : 'Customise code'}
            </button>
          </div>

          {editMode ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <span className="text-slate-500 text-sm py-2">{APP_URL}/?ref=</span>
                <input
                  value={editCode}
                  onChange={e => setEditCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={12}
                  placeholder="YOURCODE"
                  className="flex-1 rounded-lg px-3 py-2 text-white text-sm outline-none"
                  style={{ background: 'rgba(6,11,26,0.8)', border: '1px solid rgba(0,212,255,0.3)' }}
                />
                <button
                  onClick={saveCustomCode}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}
                >
                  Save
                </button>
              </div>
              {codeError && <p className="text-red-400 text-xs">{codeError}</p>}
              <p className="text-slate-600 text-xs">3–12 characters, letters and numbers only. Great for influencers (e.g. FINANCEGUY).</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)' }}>
              <span className="text-cyan-400 font-mono text-sm flex-1 truncate">{referralLink}</span>
              <CopyButton text={referralLink} />
            </div>
          )}

          <ShareButtons link={referralLink} />
        </div>

        {/* Invite by email */}
        <div className="glass rounded-2xl p-6 flex flex-col gap-5" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
          <h2 className="text-white font-semibold">Invite someone by email</h2>
          <p className="text-slate-400 text-sm">We'll send them a branded invitation with your referral link, and remind them once a month for up to 3 months (with a one-click unsubscribe).</p>

          <form onSubmit={sendAllInvites} className="flex flex-col gap-2">
            {emailRows.map((row, i) => (
              <div key={row.id} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={row.value}
                    onChange={e => updateRow(row.id, e.target.value)}
                    placeholder={i === 0 ? 'friend@example.com' : 'Add another email…'}
                    autoFocus={i > 0 && row.value === ''}
                    className="w-full rounded-xl px-4 py-2.5 text-white text-sm outline-none pr-10"
                    style={{
                      background: 'rgba(6,11,26,0.8)',
                      border: `1px solid ${row.status === 'error' ? 'rgba(239,68,68,0.4)' : row.status === 'sent' ? 'rgba(16,185,129,0.4)' : 'rgba(124,58,237,0.25)'}`,
                    }}
                  />
                  {row.status === 'sending' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full animate-spin"
                      style={{ border: '2px solid rgba(0,212,255,0.2)', borderTopColor: '#00d4ff' }} />
                  )}
                  {row.status === 'sent' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs">✓</span>
                  )}
                  {row.status === 'error' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-xs">✕</span>
                  )}
                </div>
                {row.msg && (
                  <span className={`text-xs shrink-0 ${row.status === 'sent' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {row.msg}
                  </span>
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={sendingAll || !emailRows.some(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.value))}
              className="self-start px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 mt-1"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#00d4ff)' }}
            >
              {sendingAll ? 'Sending…' : `Send ${emailRows.filter(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.value)).length || ''} invite${emailRows.filter(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.value)).length !== 1 ? 's' : ''}`}
            </button>
          </form>

          {invites.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-slate-600 text-xs uppercase tracking-wide mb-1">Sent invites</p>
              {invites.map(inv => (
                <div key={inv.email} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
                  <span className="text-slate-400 truncate flex-1">{inv.email}</span>
                  <span className="text-slate-600 text-xs mx-4 shrink-0">{inv.reminder_count} reminder{inv.reminder_count !== 1 ? 's' : ''}</span>
                  {inv.converted
                    ? <span className="text-xs text-emerald-400 font-medium">Joined ✓</span>
                    : <span className="text-xs text-slate-600">Pending</span>
                  }
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout section */}
        {stats?.totalCredits > 0 && (
          <div className="glass rounded-2xl p-6 flex flex-col gap-4"
            style={{ borderColor: payoutEligible > 0 ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-white font-semibold mb-1">Cash payouts</h2>
                <p className="text-slate-400 text-sm">
                  When your referral credits exceed your subscription cost, we'll pay you the difference directly.
                  Identity verification (KYC) is required — handled securely by Stripe.
                </p>
              </div>
              {payoutEligible > 0 && (
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-purple-400">${payoutEligible.toFixed(2)}</p>
                  <p className="text-slate-600 text-xs">available</p>
                </div>
              )}
            </div>

            {payoutMsg && (
              <p className={`text-sm ${payoutMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{payoutMsg.text}</p>
            )}

            {!hasConnectAccount && (
              <button
                onClick={handleConnectStripe}
                disabled={connectLoading}
                className="flex items-center gap-2 self-start px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}
              >
                {connectLoading ? 'Opening…' : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="5" width="16" height="12" rx="2" />
                      <path d="M2 9h16" />
                    </svg>
                    Connect Stripe for payouts
                  </>
                )}
              </button>
            )}

            {hasConnectAccount && !connectComplete && (
              <button
                onClick={handleConnectStripe}
                disabled={connectLoading}
                className="flex items-center gap-2 self-start px-5 py-2.5 rounded-xl text-sm font-semibold text-amber-400 disabled:opacity-50"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                {connectLoading ? 'Opening…' : '⚠ Complete identity verification →'}
              </button>
            )}

            {hasConnectAccount && connectComplete && payoutEligible >= 5 && (
              <button
                onClick={handlePayout}
                disabled={payoutLoading}
                className="flex items-center gap-2 self-start px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#00d4ff)' }}
              >
                {payoutLoading ? 'Processing…' : `Request $${payoutEligible.toFixed(2)} payout`}
              </button>
            )}

            {hasConnectAccount && connectComplete && payoutEligible < 5 && (
              <p className="text-slate-600 text-sm">
                Minimum payout is $5. Keep referring — you're {(5 - payoutEligible).toFixed(0)} referral{(5 - payoutEligible).toFixed(0) !== '1' ? 's' : ''} away!
              </p>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="glass rounded-2xl p-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-white font-semibold mb-4">How it works</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              { n: '1', title: 'Share your link', desc: 'Copy your unique link or send a direct email invite to a friend.' },
              { n: '2', title: 'They subscribe', desc: 'When they sign up and upgrade to Premium, you automatically earn $1.' },
              { n: '3', title: 'Credits reduce your bill', desc: 'Credits offset your own subscription. At $9 in credits, your plan is free.' },
              { n: '4', title: 'Earn beyond $9', desc: 'Once your credits exceed your subscription cost, request a cash payout.' },
            ].map(s => (
              <div key={s.n} className="flex-1 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}>
                  {s.n}
                </div>
                <p className="text-white text-sm font-medium">{s.title}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral history */}
        {stats?.referrals?.length > 0 && (
          <div className="glass rounded-2xl p-6 flex flex-col gap-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-white font-semibold">Referral history</h2>
            <div className="flex flex-col divide-y divide-white/5">
              {stats.referrals.map(r => (
                <div key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-slate-400">
                    {new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <StatusBadge status={r.status} />
                  <span className="text-slate-500 text-xs">
                    {r.status === 'credited' ? '+$1.00' : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legal note */}
        <p className="text-slate-700 text-xs text-center pb-4">
          Referral credits are earned when a referred user subscribes to Premium and their payment is confirmed by Stripe. Credits are non-transferable and have no cash value except through the payout programme above. Retirely reserves the right to modify or discontinue the referral programme at any time.
        </p>

      </div>
    </AppLayout>
  )
}
