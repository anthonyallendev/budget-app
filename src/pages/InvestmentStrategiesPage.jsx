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

// ── Contribution frequency options ───────────────────────────────────────────

const FREQUENCIES = [
  { key: 'none',        label: 'None',        periods: 0  },
  { key: 'weekly',      label: 'Weekly',      periods: 52 },
  { key: 'fortnightly', label: 'Fortnightly', periods: 26 },
  { key: 'monthly',     label: 'Monthly',     periods: 12 },
  { key: 'quarterly',   label: 'Quarterly',   periods: 4  },
]

// ── Chart helpers ─────────────────────────────────────────────────────────────

function futureValue(initial, annualRate, years, contribution, periods) {
  if (periods === 0 || contribution === 0) {
    return Math.round(initial * Math.pow(1 + annualRate, years))
  }
  const r = annualRate / periods
  const n = years * periods
  return Math.round(
    initial * Math.pow(1 + r, n) +
    contribution * ((Math.pow(1 + r, n) - 1) / r)
  )
}

function buildChartData(initial, years, contribution, periods) {
  return Array.from({ length: years + 1 }, (_, yr) => ({
    year:         yr,
    contributed:  initial + contribution * periods * yr,
    conservative: futureValue(initial, 0.04, yr, contribution, periods),
    moderate:     futureValue(initial, 0.07, yr, contribution, periods),
    aggressive:   futureValue(initial, 0.10, yr, contribution, periods),
  }))
}

function fmtCurrency(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`
  return `$${n}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const contributed = payload.find(p => p.dataKey === 'contributed')
  const strategies  = payload.filter(p => p.dataKey !== 'contributed')
  return (
    <div className="glass rounded-xl px-4 py-3 text-xs flex flex-col gap-1.5"
      style={{ border: '1px solid rgba(255,255,255,0.08)', minWidth: 180 }}>
      <p className="text-slate-400 mb-1">Year {label}</p>
      {contributed && contributed.value > 0 && (
        <div className="flex justify-between gap-4 pb-1.5 mb-0.5 border-b border-white/5">
          <span className="text-slate-500">Total invested</span>
          <span className="text-slate-400 font-semibold">{fmtCurrency(contributed.value)}</span>
        </div>
      )}
      {strategies.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-white font-semibold">{fmtCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Strategy card ─────────────────────────────────────────────────────────────

function StrategyCard({ s, initial, years, contribution, periods, freqLabel }) {
  const finalValue     = futureValue(initial, s.rate, years, contribution, periods)
  const totalInvested  = initial + contribution * periods * years
  const gain           = finalValue - totalInvested
  const hasContrib     = contribution > 0 && periods > 0

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
          {hasContrib
            ? `$${initial.toLocaleString()} + ${freqLabel} contributions over ${years} yrs`
            : `$${initial.toLocaleString()} grown over ${years} years`}
        </p>
        <p className="text-2xl font-black" style={{ color: s.color }}>
          {fmtCurrency(finalValue)}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
          {hasContrib && (
            <p className="text-xs text-slate-500">
              {fmtCurrency(totalInvested)} invested
            </p>
          )}
          <p className="text-xs text-slate-500">
            +{fmtCurrency(gain)} from growth
          </p>
        </div>
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
  const [initial,      setInitial]      = useState(10000)
  const [years,        setYears]        = useState(20)
  const [frequency,    setFrequency]    = useState('none')
  const [contribution, setContribution] = useState(500)

  const freqObj   = FREQUENCIES.find(f => f.key === frequency)
  const periods   = freqObj?.periods ?? 0
  const freqLabel = freqObj?.key === 'none' ? '' : `${freqObj?.label} $${contribution.toLocaleString()}`

  const chartData = useMemo(
    () => buildChartData(initial, years, frequency === 'none' ? 0 : contribution, periods),
    [initial, years, contribution, frequency, periods]
  )

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
          <div className="flex flex-wrap gap-6 mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                Starting amount
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={initial}
                  onChange={e => setInitial(Math.max(0, parseInt(e.target.value) || 0))}
                  className="rounded-lg px-3 py-2 text-white text-sm outline-none w-36"
                  style={{ background: 'rgba(6,11,26,0.8)', border: '1px solid rgba(0,212,255,0.18)' }}
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

          {/* Contribution controls */}
          <div className="border-t border-white/5 pt-5 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                  Regular contributions
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FREQUENCIES.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setFrequency(f.key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                      style={frequency === f.key
                        ? { background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', color: '#fff' }
                        : { background: 'rgba(255,255,255,0.05)', color: '#64748b' }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {frequency !== 'none' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                    Amount per {freqObj?.label.toLowerCase().replace('ly', '')}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={contribution}
                      onChange={e => setContribution(Math.max(0, parseInt(e.target.value) || 0))}
                      className="rounded-lg px-3 py-2 text-white text-sm outline-none w-32"
                      style={{ background: 'rgba(6,11,26,0.8)', border: '1px solid rgba(124,58,237,0.3)' }}
                    />
                  </div>
                  <p className="text-slate-600 text-xs">
                    = {fmtCurrency(contribution * periods)}/yr · {fmtCurrency(contribution * periods * years)} over {years} yrs
                  </p>
                </div>
              )}
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
            <StrategyCard
              key={s.id} s={s} initial={initial} years={years}
              contribution={frequency === 'none' ? 0 : contribution}
              periods={periods}
              freqLabel={freqLabel}
            />
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-600 text-xs pb-4">
          Ticker codes shown are examples only. AU = ASX-listed. US = US-listed.
          Returns assume annual compounding. Fees, tax, and inflation are not factored in.
        </p>

        {/* ── How to start investing ── */}
        <div className="mt-12">
          <div className="text-center mb-10">
            <p className="text-cyan-400 text-xs uppercase tracking-widest mb-3">Getting started</p>
            <h2 className="text-3xl font-bold mb-3">How to put your savings to work</h2>
            <p className="text-slate-400 max-w-xl mx-auto leading-relaxed text-sm">
              Two paths — pick the one that matches where you're at. You can always graduate from one to the next.
            </p>
          </div>

          {/* Path 1 — Beginner */}
          <div className="glass rounded-3xl p-8 mb-6" style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                🌱
              </div>
              <div>
                <p className="text-white font-bold">Path 1 — Start simple</p>
                <p className="text-slate-500 text-xs">Best for: complete beginners, or anyone not yet ready for investing</p>
              </div>
              <span className="ml-auto text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
                Beginner
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-stretch gap-0">
              {[
                {
                  step: '1',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#00d4ff" strokeWidth="1.4">
                      <rect x="4" y="8" width="20" height="14" rx="2" />
                      <path d="M4 12h20" strokeLinecap="round" />
                      <path d="M9 17h4" strokeLinecap="round" />
                    </svg>
                  ),
                  title: 'Open a high-interest savings account',
                  desc: 'Look for an account with a bonus interest rate. Popular options in AU: ING Savings Maximiser, UBank, Macquarie Savings, or your own bank\'s online saver.',
                  tip: 'Aim for 4%+ p.a. — compare at finder.com.au',
                  color: '#00d4ff',
                },
                {
                  step: '2',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#00d4ff" strokeWidth="1.4">
                      <circle cx="14" cy="14" r="9" />
                      <path d="M14 9v5l3 3" strokeLinecap="round" />
                      <path d="M5 14H3M25 14h-2M14 3V1M14 27v-2" strokeLinecap="round" strokeWidth="1" />
                    </svg>
                  ),
                  title: 'Set up an automatic weekly transfer',
                  desc: 'Decide on a fixed amount — even $25/week matters. Set a recurring transfer in your banking app so it happens automatically, every week, without thinking.',
                  tip: 'Pay yourself first — transfer on payday before spending',
                  color: '#00d4ff',
                },
                {
                  step: '3',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#00d4ff" strokeWidth="1.4">
                      <polyline points="4,20 10,13 15,16 24,7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                  title: 'Let compound interest do the work',
                  desc: 'Every month your interest earns more interest. Check in on Retirely to see how your growing balance is moving your retirement age forward.',
                  tip: 'Don\'t touch it — time is your biggest advantage',
                  color: '#00d4ff',
                },
              ].map((s, i, arr) => (
                <div key={i} className="flex md:flex-col items-stretch md:items-center flex-1">
                  <div className="flex-1 rounded-2xl p-5 flex flex-col gap-3"
                    style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.12)' }}>
                    <div className="flex items-center gap-3 md:flex-col md:text-center md:items-center">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(0,212,255,0.08)' }}>
                        {s.icon}
                      </div>
                      <div className="text-xs font-bold uppercase tracking-widest text-cyan-600">Step {s.step}</div>
                    </div>
                    <h3 className="text-white font-semibold text-sm leading-snug md:text-center">{s.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
                    <div className="mt-auto pt-2 flex items-start gap-1.5">
                      <span className="text-cyan-500 text-xs shrink-0 mt-0.5">💡</span>
                      <p className="text-cyan-600 text-xs italic">{s.tip}</p>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex md:hidden items-center justify-center w-6 shrink-0 text-slate-700">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 2v12M4 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {i < arr.length - 1 && (
                    <div className="hidden md:flex items-center justify-center h-8 shrink-0 text-slate-700">
                      <svg width="28" height="16" viewBox="0 0 28 16" fill="none" stroke="#00d4ff" strokeWidth="1.3" opacity="0.4">
                        <path d="M2 8h20M18 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Path 2 — Intermediate */}
          <div className="glass rounded-3xl p-8 mb-6" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
                style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                🚀
              </div>
              <div>
                <p className="text-white font-bold">Path 2 — Open a trading account</p>
                <p className="text-slate-500 text-xs">Best for: people ready to invest in ETFs, shares, or bonds</p>
              </div>
              <span className="ml-auto text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                Intermediate
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-start">
              {[
                {
                  step: '1',
                  icon: '🔍',
                  title: 'Choose a broker',
                  desc: 'Pick a brokerage that suits you. Popular AU options: CommSec (beginner-friendly), Pearler (long-term ETF focus), Stake (low fees), SelfWealth.',
                  color: '#a855f7',
                },
                {
                  step: '2',
                  icon: '🪪',
                  title: 'Verify your identity',
                  desc: 'You\'ll need a driver\'s licence or passport and your Tax File Number (TFN). Takes 5–10 minutes online.',
                  color: '#a855f7',
                },
                {
                  step: '3',
                  icon: '💸',
                  title: 'Deposit funds',
                  desc: 'Transfer money from your bank to your brokerage account via BPAY or bank transfer. Most brokers require $500–$2,000 minimum.',
                  color: '#a855f7',
                },
                {
                  step: '4',
                  icon: '🔎',
                  title: 'Search for an investment',
                  desc: 'Use the broker\'s search tool. Search the ticker code (e.g., VAS, VGS, NDQ) or the fund name. Read the Product Disclosure Statement (PDS).',
                  color: '#a855f7',
                },
                {
                  step: '5',
                  icon: '✅',
                  title: 'Place your order',
                  desc: 'Choose a "market order" (buys at current price) or "limit order" (only buys at your target price). Review, confirm, and done.',
                  color: '#a855f7',
                },
              ].map((s, i, arr) => (
                <div key={i} className="flex sm:flex-col items-stretch sm:items-center">
                  <div className="flex-1 rounded-2xl p-4 flex flex-col gap-2 text-center"
                    style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
                    <div className="text-2xl mx-auto">{s.icon}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-purple-600">Step {s.step}</div>
                    <h3 className="text-white font-semibold text-sm leading-snug">{s.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex sm:hidden items-center justify-center w-6 shrink-0 text-slate-700">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#a855f7" strokeWidth="1.5" opacity="0.5">
                        <path d="M8 2v12M4 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {i < arr.length - 1 && (
                    <div className="hidden sm:flex items-center justify-center h-8 text-slate-700">
                      <svg width="24" height="14" viewBox="0 0 24 14" fill="none" stroke="#a855f7" strokeWidth="1.3" opacity="0.4">
                        <path d="M2 7h16M14 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl px-5 py-4 flex gap-3"
              style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <span className="text-amber-400 text-sm shrink-0">⚠️</span>
              <p className="text-xs leading-relaxed text-amber-500/80">
                Before placing your first order, read the fund's Product Disclosure Statement (PDS). Understand what you're buying, the fees involved, and that investment values can go down as well as up.
              </p>
            </div>
          </div>

          {/* Other options */}
          <div className="glass rounded-3xl p-8" style={{ borderColor: 'rgba(224,64,251,0.15)' }}>
            <div className="flex items-center gap-3 mb-7">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
                style={{ background: 'rgba(224,64,251,0.1)', border: '1px solid rgba(224,64,251,0.2)' }}>
                🌐
              </div>
              <div>
                <p className="text-white font-bold">Other ways to invest</p>
                <p className="text-slate-500 text-xs">Beyond savings accounts and share trading</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  emoji: '🏠',
                  title: 'Property',
                  desc: 'Buy residential or commercial real estate. High entry cost but historically strong returns. Consider REITs (property ETFs) for lower-cost exposure.',
                  level: 'Advanced',
                  color: '#e040fb',
                },
                {
                  emoji: '📜',
                  title: 'Bonds & term deposits',
                  desc: 'Lend money to governments or corporations for a fixed return. Lower risk, lower reward. Good for capital preservation and income.',
                  level: 'Beginner',
                  color: '#00d4ff',
                },
                {
                  emoji: '💼',
                  title: 'Managed funds',
                  desc: 'A professional fund manager invests on your behalf. Higher fees than ETFs but hands-off. Look for index-based options to keep costs down.',
                  level: 'Intermediate',
                  color: '#a855f7',
                },
                {
                  emoji: '💰',
                  title: 'Superannuation (AU)',
                  desc: 'Voluntary super contributions can be tax-effective for long-term retirement savings. Talk to your super fund about contribution strategies.',
                  level: 'Intermediate',
                  color: '#a855f7',
                },
              ].map(o => (
                <div key={o.title} className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: `${o.color}08`, border: `1px solid ${o.color}18` }}>
                  <div className="text-2xl">{o.emoji}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold text-sm">{o.title}</h3>
                      <span className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: `${o.color}15`, color: o.color, fontSize: '10px' }}>
                        {o.level}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{o.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-slate-600 text-xs mt-8 pb-4">
            This section is for educational purposes only and is not financial advice.
            Product and platform names are mentioned as examples — always do your own research.
          </p>
        </div>

      </div>
    </AppLayout>
  )
}
