import { Link } from 'react-router-dom'

const steps = [
  {
    number: '01',
    title: 'Tell us about yourself',
    desc: 'Enter your age, country, and current super balance. Takes less than a minute.',
    accent: '#00d4ff',
  },
  {
    number: '02',
    title: 'Set your savings target',
    desc: 'Use the budget slider to decide what percentage of your income goes toward personal savings each month.',
    accent: '#7c3aed',
  },
  {
    number: '03',
    title: 'Set your retirement income goal',
    desc: 'Tell us how much you want to live on each year before super kicks in. Retirely calculates the rest.',
    accent: '#e040fb',
  },
  {
    number: '04',
    title: 'See exactly when you can retire',
    desc: 'Your dashboard shows a live retirement age — and how many years early you can stop working.',
    accent: '#00d4ff',
  },
]

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5" strokeLinejoin="round" />
        <path d="M2 12l10 5 10-5" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Retirement calculator',
    desc: 'Year-by-year projection showing exactly when your personal savings can cover your living costs until super unlocks.',
    accent: '#00d4ff',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" strokeLinecap="round" />
      </svg>
    ),
    title: 'Budget targets',
    desc: 'Set a savings percentage and watch your retirement date move forward in real time.',
    accent: '#7c3aed',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 3h18v18H3z" strokeLinejoin="round" />
        <path d="M3 9h18M9 21V9" strokeLinecap="round" />
      </svg>
    ),
    title: 'Spending tracker',
    desc: 'Log transactions by category so you always know where your money is going.',
    accent: '#e040fb',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="16 7 22 7 22 13" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Growth projections',
    desc: 'Choose conservative (4%), moderate (7%), or aggressive (10%) return rates and see how each changes your future.',
    accent: '#00d4ff',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="2" y="5" width="20" height="14" rx="2" strokeLinejoin="round" />
        <path d="M2 10h20" strokeLinecap="round" />
      </svg>
    ),
    title: 'Budget limits',
    desc: 'Set monthly spending caps by category so you stay on track with your savings goals.',
    accent: '#7c3aed',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Super overview',
    desc: 'Track your superannuation separately and see how it combines with personal savings for your full retirement picture.',
    accent: '#e040fb',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-space-900 text-white overflow-hidden">

      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
        <div className="absolute top-[30%] right-[-150px] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #00d4ff, transparent 70%)' }} />
        <div className="absolute bottom-[-100px] left-[20%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #e040fb, transparent 70%)' }} />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 glass border-b border-cyan-glow/10">
        <Link to="/" className="text-xl font-bold text-gradient">Retirely</Link>
        <nav className="hidden md:flex items-center gap-8 text-slate-400 text-sm">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/about" className="text-white">About</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login"
            className="px-5 py-2 rounded-lg font-semibold text-sm text-slate-300 hover:text-white transition-colors glass">
            Log in
          </Link>
          <Link to="/login"
            className="px-5 py-2 rounded-lg font-semibold text-white text-sm transition-all duration-300 hover:glow-cyan"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
            Get started
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-28 pb-20 gap-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-cyan-glow border border-cyan-glow/30"
          style={{ background: 'rgba(0,212,255,0.05)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow animate-pulse" />
          Your money. Your time. Your freedom.
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Retire early by{' '}
          <span className="text-gradient">saving smarter</span>,<br />
          not working longer
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
          Retirely is a personal savings and budgeting app built around one idea: every dollar you
          save is a small piece of your time bought back. The more you save, the sooner you can
          choose how you spend your days — not your employer.
        </p>

        <Link to="/login"
          className="mt-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:glow-cyan"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
          Start for free
        </Link>
      </section>

      {/* ── The big idea ── */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <div className="glass rounded-3xl p-10 md:p-14 flex flex-col md:flex-row gap-12 items-center"
          style={{ borderColor: 'rgba(0,212,255,0.12)' }}>
          <div className="flex-1">
            <p className="text-cyan-400 text-xs uppercase tracking-widest mb-3">The core idea</p>
            <h2 className="text-3xl font-bold mb-5 leading-snug">
              Time is the only thing<br />money can truly buy back
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Most budgeting apps help you spend less. Retirely helps you think bigger — every dollar
              you redirect into savings is buying you freedom. Freedom to leave a job you don't love.
              Freedom to travel. To spend time with family. To pursue what actually matters to you.
            </p>
            <p className="text-slate-400 leading-relaxed">
              The retirement calculator at the heart of Retirely shows you, in real time, what age you
              can genuinely stop working — based on your actual income, your savings rate, and your
              desired lifestyle. Not a vague estimate. A real number.
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2">
            <div className="text-8xl font-black text-gradient leading-none">57</div>
            <p className="text-slate-500 text-sm">instead of 65</p>
            <div className="px-4 py-1.5 rounded-full text-sm font-semibold mt-1"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff' }}>
              8 years early
            </div>
          </div>
        </div>
      </section>

      {/* ── Personal savings vs super ── */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-purple-400 text-xs uppercase tracking-widest mb-3">Why personal savings matter</p>
          <h2 className="text-3xl font-bold mb-4">Your savings. No lock-up. No waiting.</h2>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Superannuation is great — but it's not yours until preservation age. Personal savings are
            different. They're completely yours, accessible any time you want.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Super card */}
          <div className="glass rounded-2xl p-8 flex flex-col gap-4"
            style={{ borderColor: 'rgba(148,163,184,0.15)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(148,163,184,0.1)' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.3">
                  <rect x="3" y="8" width="14" height="10" rx="1.5" />
                  <path d="M7 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-300">Superannuation</h3>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-slate-400">
              {[
                'Locked until preservation age (57–67 depending on country)',
                'You can\'t touch it early, even in an emergency',
                'Employer contributions help it grow, but slowly',
                'Useful from preservation age — but not before',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-slate-600 mt-0.5">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Personal savings card */}
          <div className="glass rounded-2xl p-8 flex flex-col gap-4"
            style={{ borderColor: 'rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.03)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(0,212,255,0.1)' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#00d4ff" strokeWidth="1.3">
                  <circle cx="10" cy="10" r="8" />
                  <path d="M10 6v4l3 2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="font-semibold text-white">Personal savings</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.25)' }}>
                The Retirely way
              </span>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-slate-300">
              {[
                'Accessible any time — no age restrictions, no penalties',
                'Invested in index funds, ETFs, or a high-interest account',
                'Grows through compound interest at your chosen rate',
                'Can be used to bridge the gap before super unlocks',
                'Gives you the option to retire years or even decades early',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 glass rounded-2xl p-6 text-center"
          style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.04)' }}>
          <p className="text-slate-300 leading-relaxed">
            Retirely focuses on <span className="text-white font-semibold">personal savings and investments</span> — the money that's
            truly yours, that you can use the moment your savings are large enough to fund your
            lifestyle. Super is tracked too, but as a bonus that unlocks later — not the foundation.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-cyan-400 text-xs uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl font-bold">Four steps to your number</h2>
        </div>

        <div className="flex flex-col gap-6">
          {steps.map((step, i) => (
            <div key={step.number} className="glass rounded-2xl p-7 flex items-start gap-6"
              style={{ borderColor: `${step.accent}18` }}>
              <div className="flex-shrink-0 text-4xl font-black leading-none"
                style={{ color: `${step.accent}30` }}>
                {step.number}
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="absolute left-[3.25rem] mt-20 w-px h-6 bg-white/5" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-pink-400 text-xs uppercase tracking-widest mb-3">What's included</p>
          <h2 className="text-3xl font-bold">Everything you need, nothing you don't</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title}
              className="glass rounded-2xl p-6 flex flex-col gap-3 hover:scale-[1.02] transition-transform duration-300"
              style={{ borderColor: `${f.accent}20` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${f.accent}12`, color: f.accent }}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Philosophy quote ── */}
      <section className="relative z-10 px-6 py-16 max-w-3xl mx-auto text-center">
        <div className="glass rounded-3xl p-12" style={{ borderColor: 'rgba(224,64,251,0.15)' }}>
          <p className="text-2xl md:text-3xl font-semibold leading-relaxed text-white mb-6">
            "The goal isn't to be the richest person in the cemetery.
            It's to have enough — early enough — to actually live."
          </p>
          <p className="text-slate-500 text-sm">The idea behind Retirely</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 px-6 py-20 text-center">
        <div className="glass rounded-3xl max-w-2xl mx-auto px-8 py-14"
          style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
          <h2 className="text-4xl font-bold mb-4">
            Find out your{' '}
            <span className="text-gradient">number</span>
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            It takes less than two minutes to set up. No credit card, no commitment.
            Just a clear, honest picture of when you can stop trading time for money.
          </p>
          <Link to="/login"
            className="inline-block px-10 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:glow-cyan"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
            Get started for free
          </Link>
        </div>
      </section>

      <footer className="relative z-10 text-center text-slate-600 text-sm py-8 border-t border-white/5">
        © {new Date().getFullYear()} Retirely — <Link to="/about" className="hover:text-slate-400 transition-colors">About</Link> · <Link to="/" className="hover:text-slate-400 transition-colors">Home</Link>
      </footer>
    </div>
  )
}
