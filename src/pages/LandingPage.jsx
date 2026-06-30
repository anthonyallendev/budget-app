import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const portfolioData = [
  { year: '2025', conservative: 12000, moderate: 12000, aggressive: 12000 },
  { year: '2027', conservative: 18500, moderate: 21000, aggressive: 24000 },
  { year: '2029', conservative: 26000, moderate: 32000, aggressive: 40000 },
  { year: '2031', conservative: 34000, moderate: 46000, aggressive: 63000 },
  { year: '2033', conservative: 43000, moderate: 63000, aggressive: 96000 },
  { year: '2035', conservative: 53000, moderate: 84000, aggressive: 142000 },
  { year: '2037', conservative: 64000, moderate: 109000, aggressive: 205000 },
  { year: '2039', conservative: 77000, moderate: 139000, aggressive: 291000 },
  { year: '2041', conservative: 91000, moderate: 175000, aggressive: 408000 },
  { year: '2043', conservative: 107000, moderate: 218000, aggressive: 567000 },
  { year: '2045', conservative: 124000, moderate: 270000, aggressive: 780000 },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm" style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: ${p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-space-900 text-white overflow-hidden">
      {/* Background glow blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
        <div className="absolute top-[10%] right-[-150px] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #00d4ff, transparent 70%)' }} />
        <div className="absolute bottom-[-100px] left-[30%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #e040fb, transparent 70%)' }} />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 glass border-b border-cyan-glow/10">
        <span className="text-xl font-bold text-gradient">Retirely.money</span>
        <nav className="hidden md:flex items-center gap-8 text-slate-400 text-sm">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>
        <Link
          to="/login"
          className="relative px-5 py-2 rounded-lg font-semibold text-white text-sm transition-all duration-300 hover:glow-cyan"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
        >
          Get started
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 gap-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-cyan-glow border border-cyan-glow/30"
          style={{ background: 'rgba(0,212,255,0.05)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow animate-pulse" />
          Now with AI-powered retirement projections
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-3xl leading-tight">
          Your finances,{' '}
          <span className="text-gradient">finally in control</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
          Connect your bank, track every dollar, set smart budgets, and see exactly
          when you can retire — all in one futuristic dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/login"
            className="px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:glow-cyan"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}
          >
            Start for free
          </Link>
          <a
            href="#features"
            className="px-8 py-3.5 rounded-xl font-semibold text-slate-300 hover:text-white transition-colors glass"
          >
            See how it works
          </a>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {[
            { label: 'Users', value: '10,000+' },
            { label: 'Avg. savings found', value: '$4,200/yr' },
            { label: 'Banks supported', value: '12,000+' },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-xl px-6 py-3 text-center">
              <div className="text-xl font-bold text-gradient">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Demo Chart */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto w-full">
        <div className="glass rounded-3xl p-8" style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-1">Watch your wealth grow</h2>
              <p className="text-slate-400 text-sm">$500/mo invested · 20 year projection</p>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ background: '#00d4ff' }} />Conservative</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ background: '#7c3aed' }} />Moderate</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ background: '#e040fb' }} />Aggressive</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={portfolioData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPink" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e040fb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e040fb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="conservative" name="Conservative" stroke="#00d4ff" strokeWidth={2} fill="url(#gradCyan)" dot={false} />
              <Area type="monotone" dataKey="moderate" name="Moderate" stroke="#7c3aed" strokeWidth={2} fill="url(#gradPurple)" dot={false} />
              <Area type="monotone" dataKey="aggressive" name="Aggressive" stroke="#e040fb" strokeWidth={2} fill="url(#gradPink)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">
          Everything you need
        </h2>
        <p className="text-slate-400 text-center mb-14">Built for people who take their future seriously.</p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🏦',
              title: 'Bank sync',
              desc: 'Connect your accounts and import transactions automatically.',
              accent: '#00d4ff',
            },
            {
              icon: '📊',
              title: 'Smart budgets',
              desc: 'Set limits by category and get alerts before you overspend.',
              accent: '#7c3aed',
            },
            {
              icon: '📈',
              title: 'Retirement calculator',
              desc: 'See exactly when you can retire based on your S&P 500 growth rate.',
              accent: '#e040fb',
            },
            {
              icon: '💳',
              title: 'Spending tracker',
              desc: 'Categorise every purchase and understand where your money goes.',
              accent: '#00d4ff',
            },
            {
              icon: '🔒',
              title: 'Bank-grade security',
              desc: 'Your data is encrypted end-to-end. We never store your credentials.',
              accent: '#7c3aed',
            },
            {
              icon: '📉',
              title: 'Charts & reports',
              desc: 'Beautiful dashboards that make your finances easy to understand.',
              accent: '#e040fb',
            },
          ].map(f => (
            <div
              key={f.title}
              className="glass rounded-2xl p-6 flex flex-col gap-3 hover:scale-[1.02] transition-transform duration-300"
              style={{ borderColor: `${f.accent}20` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `${f.accent}15`, boxShadow: `0 0 12px ${f.accent}30` }}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-20 text-center">
        <div className="glass rounded-3xl max-w-2xl mx-auto px-8 py-14" style={{ borderColor: 'rgba(124,58,237,0.3)' }}>
          <h2 className="text-4xl font-bold mb-4">
            Ready to take{' '}
            <span className="text-gradient">control?</span>
          </h2>
          <p className="text-slate-400 mb-8">
            Join thousands already using Retirely.money to reach financial freedom.
          </p>
          <Link
            to="/login"
            className="inline-block px-10 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:glow-purple"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #e040fb)' }}
          >
            Get started for free
          </Link>
        </div>
      </section>

      <footer className="relative z-10 text-center text-slate-600 text-sm py-8 border-t border-white/5">
        © {new Date().getFullYear()} Retirely.money — All rights reserved
      </footer>
    </div>
  )
}
