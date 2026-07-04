import { useMemo } from 'react'
import AppLayout from '../components/AppLayout'
import PremiumGate from '../components/PremiumGate'
import { useProfile } from '../hooks/useProfile'
import { useTransactions } from '../hooks/useTransactions'

// ── Recurring-charge detection ───────────────────────────────────────────────

function normaliseName(t) {
  const raw = (t.merchant_name || t.description || '').toLowerCase()
  return raw
    .replace(/\d{4,}/g, '')          // long digit runs (references, card numbers)
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
}

const FREQUENCIES = [
  { key: 'weekly',     label: 'Weekly',      days: 7,   tolerance: 2,  perMonth: 4.33 },
  { key: 'fortnightly', label: 'Fortnightly', days: 14,  tolerance: 3,  perMonth: 2.17 },
  { key: 'monthly',    label: 'Monthly',     days: 30.4, tolerance: 6,  perMonth: 1 },
  { key: 'quarterly',  label: 'Quarterly',   days: 91,  tolerance: 12, perMonth: 1 / 3 },
  { key: 'yearly',     label: 'Yearly',      days: 365, tolerance: 20, perMonth: 1 / 12 },
]

function detectSubscriptions(transactions) {
  const expenses = transactions.filter(t => t.type === 'expense' && parseFloat(t.amount) > 0)
  const groups = {}
  for (const t of expenses) {
    const key = normaliseName(t)
    if (key.length < 3) continue
    groups[key] = groups[key] || []
    groups[key].push(t)
  }

  const subs = []
  for (const [key, txs] of Object.entries(groups)) {
    if (txs.length < 3) continue
    const sorted = [...txs].sort((a, b) => new Date(a.date) - new Date(b.date))

    // similar amounts (median ±25%)
    const amounts = sorted.map(t => parseFloat(t.amount)).sort((a, b) => a - b)
    const median = amounts[Math.floor(amounts.length / 2)]
    const similar = sorted.filter(t => Math.abs(parseFloat(t.amount) - median) <= median * 0.25)
    if (similar.length < 3) continue

    // regular intervals
    const gaps = []
    for (let i = 1; i < similar.length; i++) {
      gaps.push((new Date(similar[i].date) - new Date(similar[i - 1].date)) / 86_400_000)
    }
    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length
    const freq = FREQUENCIES.find(f => Math.abs(avgGap - f.days) <= f.tolerance)
    if (!freq) continue
    const regular = gaps.filter(g => Math.abs(g - freq.days) <= freq.tolerance * 1.5).length / gaps.length
    if (regular < 0.6) continue

    const last = similar[similar.length - 1]
    const first = similar[0]
    const lastAmount = parseFloat(last.amount)
    const firstAmount = parseFloat(first.amount)
    const daysSinceLast = (Date.now() - new Date(last.date)) / 86_400_000

    subs.push({
      key,
      name: (last.merchant_name || last.description || key).slice(0, 48),
      category: last.category,
      frequency: freq,
      charges: similar.length,
      lastDate: last.date,
      lastAmount,
      monthlyCost: lastAmount * freq.perMonth,
      priceIncrease: lastAmount > firstAmount * 1.05
        ? { from: firstAmount, to: lastAmount, pct: ((lastAmount - firstAmount) / firstAmount) * 100 }
        : null,
      possiblyCancelled: daysSinceLast > freq.days * 1.8,
    })
  }

  return subs.sort((a, b) => b.monthlyCost - a.monthlyCost)
}

// ── UI ───────────────────────────────────────────────────────────────────────

const fmt = n => `$${n.toFixed(2)}`

function SubRow({ sub }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-white/5 last:border-0">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
        style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
        🔄
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-medium text-sm capitalize truncate">{sub.name}</p>
          {sub.priceIncrease && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)' }}>
              ↑ price +{sub.priceIncrease.pct.toFixed(0)}%
            </span>
          )}
          {sub.possiblyCancelled && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' }}>
              possibly cancelled
            </span>
          )}
        </div>
        <p className="text-slate-500 text-xs mt-0.5">
          {sub.frequency.label} · {sub.charges} charges · last {new Date(sub.lastDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
          {sub.category ? ` · ${sub.category}` : ''}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-white font-bold text-sm">{fmt(sub.lastAmount)}</p>
        <p className="text-slate-500 text-xs">≈ {fmt(sub.monthlyCost)}/mo</p>
      </div>
    </div>
  )
}

function AuditBody({ transactions, loading }) {
  const subs = useMemo(() => detectSubscriptions(transactions), [transactions])
  const active = subs.filter(s => !s.possiblyCancelled)
  const monthlyTotal = active.reduce((s, x) => s + x.monthlyCost, 0)
  const increases = subs.filter(s => s.priceIncrease)

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading…</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Recurring charges found', value: String(subs.length), color: '#00d4ff' },
          { label: 'Estimated monthly cost', value: fmt(monthlyTotal), color: '#e040fb' },
          { label: 'Estimated yearly cost', value: fmt(monthlyTotal * 12), color: '#a78bfa' },
        ].map(k => (
          <div key={k.label} className="glass rounded-2xl p-5 text-center">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {increases.length > 0 && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-3"
          style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <span className="shrink-0">📈</span>
          <p className="text-slate-300 text-xs leading-relaxed">
            <span className="text-red-300 font-medium">{increases.length} subscription{increases.length !== 1 ? 's have' : ' has'} gone up in price</span> since
            your earliest charge — a common way costs creep. Worth a call to ask for the old rate, or cancelling.
          </p>
        </div>
      )}

      <div className="glass rounded-2xl px-5" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
        {subs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-slate-400 text-sm">No recurring charges detected yet.</p>
            <p className="text-slate-600 text-xs mt-1">
              Detection needs at least 3 similar charges from the same merchant — connect your bank or keep adding transactions.
            </p>
          </div>
        ) : (
          subs.map(s => <SubRow key={s.key} sub={s} />)
        )}
      </div>

      <p className="text-slate-600 text-xs">
        Detected automatically from your transaction history (3+ similar charges at regular intervals).
        Some detections may be regular shopping rather than true subscriptions.
      </p>
    </div>
  )
}

const DEMO_SUBS = (() => {
  const today = new Date()
  const d = (offset) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset).toISOString().slice(0, 10)
  const mk = (name, amount, gap, n, category) =>
    Array.from({ length: n }, (_, i) => ({
      type: 'expense', amount, merchant_name: name, description: name, category, date: d(gap * (n - 1 - i)),
    }))
  return [
    ...mk('Streamflix', 22.99, 30, 5, 'Entertainment'),
    ...mk('Gym Plus', 34.90, 14, 6, 'Health'),
    ...mk('Cloud Storage Co', 4.49, 30, 6, 'Software'),
  ]
})()

export default function SubscriptionAuditPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { transactions, loading } = useTransactions()
  const isPremium = profile?.subscription_status === 'premium'

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-1">Subscription Audit</h1>
      <p className="text-slate-400 text-sm mb-8">Recurring charges hiding in your transactions — what they cost, and which ones went up.</p>
      {profileLoading ? (
        <div className="flex items-center justify-center h-64 text-slate-500">Loading…</div>
      ) : isPremium ? (
        <AuditBody transactions={transactions} loading={loading} />
      ) : (
        <PremiumGate
          feature="the subscription audit"
          description="Automatically find every recurring charge in your transactions, see the true monthly cost, and get flagged when a subscription quietly raises its price.">
          <AuditBody transactions={DEMO_SUBS} loading={false} />
        </PremiumGate>
      )}
    </AppLayout>
  )
}
