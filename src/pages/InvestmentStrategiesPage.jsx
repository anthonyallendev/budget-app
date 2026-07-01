import { useState, useMemo } from 'react'
import AppLayout from '../components/AppLayout'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// ── Strategy definitions ─────────────────────────────────────────────────────

const STRATEGIES = [
  {
    id:          'conservative',
    label:       'Conservative',
    rate:        0.04,
    color:       '#22d3ee',
    risk:        'Low',
    horizon:     '1–5 years',
    tagline:     'Steady & predictable',
    description: 'Prioritises protecting your capital with low-volatility assets. Suitable if you need your money within a few years or want to sleep at night.',
    examples: [
      { name: 'Government Bond ETF',   ticker: 'VAF (AU) · BND (US)',  note: 'Diversified fixed-income exposure' },
      { name: 'High-Yield Savings',    ticker: 'HISA',                 note: 'Currently returning 4–5% p.a. in AU' },
      { name: 'Term Deposit',          ticker: '3–12 month',           note: 'Locked-in rate, capital guaranteed' },
      { name: 'Investment Grade Bonds',ticker: 'IAF (AU) · AGG (US)',  note: 'Corporate + government bonds' },
    ],
    allocation: [
      { label: 'Bonds & Fixed Income', pct: 70, color: '#22d3ee' },
      { label: 'Cash',                 pct: 20, color: '#67e8f9' },
      { label: 'Equities',             pct: 10, color: '#a5f3fc' },
    ],
  },
  {
    id:          'moderate',
    label:       'Moderate',
    rate:        0.07,
    color:       '#a855f7',
    risk:        'Medium',
    horizon:     '5–15 years',
    tagline:     'Balanced growth',
    description: 'A classic 60/40 portfolio mix. Enough equity exposure for meaningful growth, with bonds providing a cushion during market downturns.',
    examples: [
      { name: 'Diversified Growth ETF', ticker: 'VDHG (AU)',          note: '90% growth assets — one-fund solution' },
      { name: 'ASX 200 Index',          ticker: 'VAS (AU)',            note: 'Top 300 Australian companies' },
      { name: 'US Total Market',        ticker: 'VTI (US)',            note: 'Broad US equity market' },
      { name: 'International Equities', ticker: 'VGS (AU) · VEU (US)',note: 'Global diversification ex-AU' },
    ],
    allocation: [
      { label: 'Equities',    pct: 60, color: '#a855f7' },
      { label: 'Bonds',       pct: 30, color: '#c084fc' },
      { label: 'Cash',        pct: 10, color: '#e9d5ff' },
    ],
  },
  {
    id:          'aggressive',
    label:       'Aggressive',
    rate:        0.10,
    color:       '#ec4899',
    risk:        'High',
    horizon:     '10+ years',
    tagline:     'Maximum long-term growth',
    description: 'Full equity exposure targeting the highest long-term returns. Expect significant short-term volatility — this strategy can drop 30–40% in a bad year.',
    examples: [
      { name: 'S&P 500 Index',    ticker: 'IVV (AU) · VOO (US)', note: 'Top 500 US companies by market cap' },
      { name: 'Nasdaq 100',       ticker: 'NDQ (AU) · QQQ (US)', note: 'Tech-heavy growth index' },
      { name: 'Global Equities',  ticker: 'VGS (AU)',             note: 'MSCI World index (developed markets)' },
      { name: 'Small Cap Growth', ticker: 'IJR (AU) · VB (US)',   note: 'Higher growth potential, higher risk' },
    ],
    allocation: [
      { label: 'Australian Equities',     pct: 35, color: '#ec4899' },
      { label: 'International Equities',  pct: 55, color: '#f472b6' },
      { label: 'Alternatives',            pct: 10, color: '#fbcfe8' },
    ],
  },
]

// ── Chart helpers ─────────────────────────────────────────────────────────────

function buildChartData(initial, years) {
  return Array.from({ length: years + 1 }, (_, yr) => ({
    year:         yr,
    conservative: Math.round(initial * Math.pow(1.04, yr)),
    moderate:     Math.round(initial * Math.pow(1.07, yr)),
    aggressive:   Math.round(initial * Math.pow(1.10, yr)),
  }))
}

function fmtCurrency(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`
  return `$${n}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 text-xs flex flex-col gap-1.5"
      style={{ border: '1px solid rgba(255,255,255,0.08)', minWidth: 160 }}>
      <p className="text-slate-400 mb-1">Year {label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-white font-semibold">{fmtCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Strategy card ─────────────────────────────────────────────────────────────

function StrategyCard({ s, initial, years }) {
  const finalValue = Math.round(initial * Math.pow(1 + s.rate, years))
  const gain       = finalValue - initial

  return (
    <div className="glass rounded-2xl p-7 flex flex-col gap-6"
      style={{ borderColor: `${s.color}25` }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold" style={{ color: s.color }}>{s.label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${s.color}18`, color: s.color }}>
              ~{(s.rate * 100).toFixed(0)}% p.a.
            </span>
          </div>
          <p className="text-slate-500 text-xs">{s.tagline}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-500 mb-0.5">Risk</p>
          <p className="text-sm font-semibold" style={{ color: s.color }}>{s.risk}</p>
        </div>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed">{s.description}</p>

      {/* Projected value */}
      <div className="rounded-xl px-4 py-3"
        style={{ background: `${s.color}0d`, border: `1px solid ${s.color}25` }}>
        <p className="text-xs text-slate-500 mb-1">
          ${initial.toLocaleString()} grown over {years} years
        </p>
        <p className="text-2xl font-black" style={{ color: s.color }}>
          {fmtCurrency(finalValue)}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          +{fmtCurrency(gain)} gain
        </p>
      </div>

      {/* Allocation bars */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Example allocation</p>
        {s.allocation.map(a => (
          <div key={a.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">{a.label}</span>
              <span style={{ color: s.color }}>{a.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${a.pct}%`, background: a.color, opacity: 0.8 }} />
            </div>
          </div>
        ))}
      </div>

      {/* ETF examples */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Example investments</p>
        {s.examples.map(ex => (
          <div key={ex.name} className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0">
            <div>
              <p className="text-sm text-white font-medium">{ex.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{ex.note}</p>
            </div>
            <span className="text-xs font-mono shrink-0 mt-0.5"
              style={{ color: s.color }}>{ex.ticker}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-600 flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <circle cx="8" cy="8" r="7" />
          <path d="M8 7v4" strokeLinecap="round" />
          <circle cx="8" cy="5.5" r="0.6" fill="currentColor" strokeWidth="0" />
        </svg>
        Suggested time horizon: {s.horizon}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InvestmentStrategiesPage() {
  const [initial, setInitial] = useState(10000)
  const [years,   setYears]   = useState(20)

  const chartData = useMemo(() => buildChartData(initial, years), [initial, years])

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Investment Strategies</h1>
          <p className="text-slate-400 text-sm">
            See how your savings could grow across three risk profiles.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl px-5 py-4 mb-8 flex gap-3"
          style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)' }}>
          <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#fbbf24" strokeWidth="1.5">
            <path d="M10 2L2 17h16L10 2z" strokeLinejoin="round" />
            <path d="M10 8v4" strokeLinecap="round" />
            <circle cx="10" cy="14.5" r="0.6" fill="#fbbf24" strokeWidth="0" />
          </svg>
          <p className="text-xs leading-relaxed" style={{ color: '#fbbf24cc' }}>
            <strong className="text-amber-400">Not financial advice.</strong> The strategies, returns, and investments shown below are educational examples only.
            Past performance does not guarantee future results. Expected returns are illustrative averages — actual returns will vary and can be negative.
            Always consult a licensed financial adviser before making investment decisions.
          </p>
        </div>

        {/* Chart controls */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap gap-6 mb-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                Starting amount
              </label>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={initial}
                  onChange={e => setInitial(Math.max(0, parseInt(e.target.value) || 0))}
                  className="rounded-lg px-3 py-2 text-white text-sm outline-none w-36"
                  style={{ background: 'linear-gradient(rgba(6,11,26,0.8),rgba(6,11,26,0.8)) padding-box,linear-gradient(135deg,#00d4ff,#7c3aed,#e040fb) border-box', border: '1px solid transparent' }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                Time horizon: <span className="text-cyan-400">{years} years</span>
              </label>
              <input
                type="range"
                min="5" max="40" step="5"
                value={years}
                onChange={e => setYears(parseInt(e.target.value))}
                className="w-48 accent-cyan-400"
              />
              <div className="flex justify-between text-xs text-slate-600 w-48">
                <span>5yr</span><span>20yr</span><span>40yr</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                {STRATEGIES.map(s => (
                  <linearGradient key={s.id} id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={s.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="year"
                tickFormatter={v => `Yr ${v}`}
                tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tickFormatter={fmtCurrency}
                tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={false} tickLine={false} width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={val => <span style={{ color: '#94a3b8', fontSize: 12 }}>{val}</span>}
              />
              {STRATEGIES.map(s => (
                <Area
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#grad-${s.id})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Strategy cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {STRATEGIES.map(s => (
            <StrategyCard key={s.id} s={s} initial={initial} years={years} />
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-600 text-xs pb-4">
          Ticker codes shown are examples only. AU = ASX-listed. US = US-listed.
          Returns assume annual compounding with no additional contributions or withdrawals.
          Fees, tax, and inflation are not factored in.
        </p>

      </div>
    </AppLayout>
  )
}
