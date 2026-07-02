import { useState, useEffect, useCallback } from 'react'
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

export default function ReferralPage() {
  const [searchParams] = useSearchParams()

  const [code, setCode]             = useState(null)
  const [editCode, setEditCode]     = useState('')
  const [editMode, setEditMode]     = useState(false)
  const [codeError, setCodeError]   = useState(null)
  const [stats, setStats]           = useState(null)
  const [invites, setInvites]       = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg]   = useState(null)
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

  async function sendInvite(e) {
    e.preventDefault()
    setInviteLoading(true)
    setInviteMsg(null)
    const headers = await authHeaders()
    const res = await fetch('/api/referral/invite-email', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: inviteEmail }),
    })
    const data = await res.json()
    if (!res.ok) {
      setInviteMsg({ ok: false, text: data.error })
    } else {
      setInviteMsg({ ok: true, text: data.alreadyConverted ? 'That person already joined!' : 'Invite sent!' })
      setInviteEmail('')
      load()
    }
    setInviteLoading(false)
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

          <div className="flex items-center gap-3">
            <p className="text-slate-600 text-xs">Share as:</p>
            <CopyButton text={referralLink} />
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I've been using Retirely to track my savings and retirement goals — it's free! Sign up here: ${referralLink}`)}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{ background: 'rgba(29,161,242,0.1)', color: '#1da1f2', border: '1px solid rgba(29,161,242,0.2)' }}
            >
              Share on X
            </a>
          </div>
        </div>

        {/* Invite by email */}
        <div className="glass rounded-2xl p-6 flex flex-col gap-5" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
          <h2 className="text-white font-semibold">Invite someone by email</h2>
          <p className="text-slate-400 text-sm">We'll send them a branded invitation with your referral link, and remind them once a month for up to 3 months (with a one-click unsubscribe).</p>

          <form onSubmit={sendInvite} className="flex gap-2">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="friend@example.com"
              className="flex-1 rounded-xl px-4 py-2.5 text-white text-sm outline-none"
              style={{ background: 'rgba(6,11,26,0.8)', border: '1px solid rgba(124,58,237,0.25)' }}
            />
            <button
              type="submit"
              disabled={inviteLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#00d4ff)' }}
            >
              {inviteLoading ? '…' : 'Send invite'}
            </button>
          </form>

          {inviteMsg && (
            <p className={`text-sm ${inviteMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{inviteMsg.text}</p>
          )}

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
