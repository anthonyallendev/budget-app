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

const tools = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5" strokeLinejoin="round" />
        <path d="M2 12l10 5 10-5" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Retirement calculator',
    desc: 'Year-by-year projection showing exactly when your personal savings can cover your living costs until super unlocks. Full AU superannuation support.',
    accent: '#00d4ff',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="16 7 22 7 22 13" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Investment strategies',
    desc: 'Compare conservative (4%), moderate (7%), and aggressive (10%) return rates side-by-side with real ETF examples.',
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
    desc: 'Log transactions by category and see exactly where your money goes, with month-over-month comparisons.',
    accent: '#e040fb',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" strokeLinecap="round" />
      </svg>
    ),
    title: 'Budget limits',
    desc: 'Set monthly spending caps by category. Progress bars turn amber before you overspend.',
    accent: '#00d4ff',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M20 12V22H4V12" strokeLinejoin="round" />
        <path d="M22 7H2v5h20V7z" strokeLinejoin="round" />
        <path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" strokeLinecap="round" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" strokeLinecap="round" />
      </svg>
    ),
    title: 'Savings goals',
    desc: 'Create goals with icons, targets, and deadlines. Quick-deposit buttons let you top them up in seconds.',
    accent: '#7c3aed',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
      </svg>
    ),
    title: 'Debt payoff calculator',
    desc: 'Add your debts, see avalanche vs snowball payoff timelines, and track interest savings with persistent history.',
    accent: '#e040fb',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="2" y="5" width="20" height="14" rx="2" strokeLinejoin="round" />
        <path d="M2 10h20" strokeLinecap="round" />
      </svg>
    ),
    title: 'Tax estimate',
    desc: 'Instant tax calculations for AU, US, UK, and CA. Know your effective rate and take-home pay at a glance.',
    accent: '#00d4ff',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeLinejoin="round" />
        <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
        <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
      </svg>
    ),
    title: 'Bills tracker',
    desc: "Log recurring bills (monthly, quarterly, yearly) and see what's due in the next 14 days right on your dashboard.",
    accent: '#7c3aed',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Net worth tracker',
    desc: 'Track assets vs liabilities with daily snapshots and a historical chart showing your wealth growing over time.',
    accent: '#e040fb',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 17c4 0 4-10 8-10s4 6 10 3" strokeLinecap="round" />
        <path d="M3 21c5 0 5-6 9-6s5 3 9 1" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
    title: 'Monte Carlo simulator ⚡',
    desc: 'Will my money last? 1,000 simulated market histories show the real odds your savings survive retirement — including bad-luck years.',
    accent: '#00d4ff',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 12h5M8 12c4 0 4-5 8-5h5M8 12c4 0 4 5 8 5h5" strokeLinecap="round" />
      </svg>
    ),
    title: 'Scenario planner ⚡',
    desc: 'Downsize the house, work two more years, spend a little less — compare unlimited what-if plans side by side.',
    accent: '#7c3aed',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 2l8 3.5v6c0 5-3.5 9-8 10.5C7.5 20.5 4 16.5 4 11.5v-6L12 2z" strokeLinejoin="round" />
        <path d="M12 7v9M15 9.5c0-1.2-1.3-2-3-2s-3 .8-3 2 1.5 1.7 3 2 3 .8 3 2-1.3 2-3 2-3-.8-3-2" strokeLinecap="round" strokeWidth="1.1" />
      </svg>
    ),
    title: 'Age Pension estimator ⚡',
    desc: 'The Centrelink assets test, income test and deeming rules worked out automatically — see what you could get (Australia).',
    accent: '#e040fb',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M12 3l1.8 4.2 4.2 1.8-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" strokeLinejoin="round" />
        <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z" strokeLinejoin="round" strokeWidth="1.1" />
      </svg>
    ),
    title: 'AI money reports ⚡',
    desc: 'Once a month, your finances explained in plain English — where the money went, what changed, and one practical suggestion.',
    accent: '#00d4ff',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M20 9.5A8 8 0 0 0 5.5 6M4 14.5A8 8 0 0 0 18.5 18" strokeLinecap="round" />
        <path d="M5.5 2.5V6H9M18.5 21.5V18H15" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Subscription audit ⚡',
    desc: 'Finds recurring charges hiding in your transactions, totals the real monthly cost, and flags sneaky price rises.',
    accent: '#7c3aed',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 11l9-8 9 8M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9.5" cy="13.5" r="1.5" /><circle cx="14.5" cy="13.5" r="1.5" />
        <path d="M7 19c.4-1.8 1.3-2.7 2.5-2.7s2.1.9 2.5 2.7M12 19c.4-1.8 1.3-2.7 2.5-2.7s2.1.9 2.5 2.7" strokeLinecap="round" strokeWidth="1.1" />
      </svg>
    ),
    title: 'Household mode ⚡',
    desc: 'Link with your partner and see your combined money picture. One Premium subscription covers the whole household.',
    accent: '#e040fb',
  },
]

const habits = [
  {
    emoji: '🔥',
    title: 'Daily check-in streak',
    desc: 'Show up every day and watch your streak grow from a humble 👍 all the way to 👑. Ten levels of progression to keep you coming back.',
    accent: '#e040fb',
  },
  {
    emoji: '💚',
    title: 'Financial health score',
    desc: 'A live 0–100 score calculated from your savings rate, spending trend, tracking activity, and monthly surplus. Updated every week.',
    accent: '#00d4ff',
  },
  {
    emoji: '📋',
    title: 'Weekly check-in',
    desc: "Three quick questions each week: How's your budget? Did you save? How are you feeling financially? Builds honest self-awareness over time.",
    accent: '#7c3aed',
  },
  {
    emoji: '📈',
    title: 'Spending pace',
    desc: "See how this week compares to last week in real time, with a projected monthly total so surprises don't catch you off guard.",
    accent: '#e040fb',
  },
  {
    emoji: '🏆',
    title: 'Milestone celebrations',
    desc: "Hit a savings goal? Reach a net worth milestone? Set a new streak record? Retirely notices and celebrates it with you.",
    accent: '#00d4ff',
  },
  {
    emoji: '📊',
    title: 'Interest rate watch',
    desc: 'Compare the RBA cash rate against your own mortgage, savings, and credit card rates so you always know when to make a move.',
    accent: '#7c3aed',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-space-900 text-white overflow-hidden">

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 glass border-b border-cyan-glow/10">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-gradient">Retirely</span>
          <img src="/favicon.svg" alt="" className="w-5 h-5" />
        </Link>
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
          Your money. Your habits. Your freedom.
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Retire early by{' '}
          <span className="text-gradient">saving smarter</span>,<br />
          not working longer
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
          Retirely is a personal finance app built around one idea: every dollar you save is a
          small piece of your time bought back. Track your spending, build better habits, compete
          on a leaderboard, and watch your retirement age count down in real time.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <Link to="/login"
            className="px-8 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:glow-cyan"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
            Start for free
          </Link>
          <a href="#features"
            className="px-8 py-3.5 rounded-xl font-semibold text-slate-300 hover:text-white transition-colors glass">
            See what's inside
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><span className="text-cyan-400">✓</span> No credit card required</span>
          <span className="flex items-center gap-1.5"><span className="text-cyan-400">✓</span> Free forever tier</span>
          <span className="flex items-center gap-1.5"><span className="text-cyan-400">✓</span> AU super & Age Pension support</span>
          <span className="flex items-center gap-1.5"><span className="text-cyan-400">✓</span> Bank sync & AI reports available</span>
        </div>
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
              desired lifestyle. Not a vague estimate. A real number. And every good habit you build
              makes that number drop.
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

      {/* ── Habit engine ── */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-pink-400 text-xs uppercase tracking-widest mb-3">Stay on track</p>
          <h2 className="text-3xl font-bold mb-4">Good money habits are built daily</h2>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Knowing your numbers is step one. Retirely keeps you coming back with a habit
            engine that rewards consistency and makes your progress impossible to ignore.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {habits.map(h => (
            <div key={h.title}
              className="glass rounded-2xl p-6 flex flex-col gap-3 hover:scale-[1.02] transition-transform duration-300"
              style={{ borderColor: `${h.accent}20` }}>
              <div className="text-3xl">{h.emoji}</div>
              <h3 className="font-semibold text-white">{h.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>

        {/* Streak progression preview */}
        <div className="mt-8 glass rounded-2xl p-6"
          style={{ borderColor: 'rgba(224,64,251,0.2)', background: 'rgba(224,64,251,0.03)' }}>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-4 text-center">Streak progression</p>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {[
              { emoji: '👍', label: 'Day 1' },
              { emoji: '⭐', label: 'Week 1' },
              { emoji: '🌟', label: 'Week 2' },
              { emoji: '🔥', label: 'Week 3' },
              { emoji: '💎', label: 'Month 1' },
              { emoji: '🚀', label: 'Month 2' },
              { emoji: '⚡', label: 'Month 3' },
              { emoji: '🏆', label: 'Month 6' },
              { emoji: '💫', label: 'Month 9' },
              { emoji: '👑', label: 'Year 1' },
            ].map(({ emoji, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 flex-1 min-w-[48px]">
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leaderboard ── */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <div className="glass rounded-3xl p-10 md:p-14 flex flex-col md:flex-row gap-12 items-center"
          style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.03)' }}>
          <div className="flex-1">
            <p className="text-purple-400 text-xs uppercase tracking-widest mb-3">Community</p>
            <h2 className="text-3xl font-bold mb-5 leading-snug">
              Compete on habits,<br />not on wealth
            </h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Retirely's anonymous leaderboard ranks users on their financial <em>behaviours</em> — not
              how much money they have. A teacher building a daily habit can outrank a high-earner
              who never checks in.
            </p>
            <p className="text-slate-400 leading-relaxed mb-6">
              Choose your own player name. No real names, no income disclosed — just healthy
              competition to build better habits.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '👑', label: 'Overall', desc: 'Composite score' },
                { icon: '🔥', label: 'Streak', desc: 'Most consistent' },
                { icon: '💚', label: 'Health', desc: 'Financial health' },
                { icon: '💰', label: 'Savings', desc: 'Highest savings %' },
              ].map(c => (
                <div key={c.label} className="glass rounded-xl p-3 flex items-center gap-3"
                  style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <p className="text-white text-sm font-semibold">{c.label}</p>
                    <p className="text-slate-500 text-xs">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0 w-full md:w-56">
            <div className="glass rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(124,58,237,0.25)' }}>
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-white text-sm font-semibold">👑 Overall</p>
              </div>
              {[
                { rank: 1, name: 'SavingsKing', score: 94, medal: '🥇' },
                { rank: 2, name: 'EarlyBird', score: 87, medal: '🥈' },
                { rank: 3, name: 'FIREchaser', score: 81, medal: '🥉' },
                { rank: 4, name: 'You?', score: '–', medal: '4' },
              ].map(u => (
                <div key={u.rank}
                  className={`flex items-center gap-3 px-4 py-3 ${u.name === 'You?' ? 'border-t border-cyan-glow/20' : ''}`}
                  style={u.name === 'You?' ? { background: 'rgba(0,212,255,0.04)' } : {}}>
                  <span className="text-sm w-5 text-center">{u.medal}</span>
                  <span className={`text-sm flex-1 ${u.name === 'You?' ? 'text-cyan-400' : 'text-slate-300'}`}>{u.name}</span>
                  <span className={`text-sm font-bold ${u.name === 'You?' ? 'text-slate-500' : 'text-white'}`}>{u.score}</span>
                </div>
              ))}
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
                "You can't touch it early, even in an emergency",
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
          {steps.map(step => (
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
            </div>
          ))}
        </div>
      </section>

      {/* ── Full tools grid ── */}
      <section id="features" className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-pink-400 text-xs uppercase tracking-widest mb-3">What's included</p>
          <h2 className="text-3xl font-bold">Everything you need, nothing you don't</h2>
          <p className="text-slate-400 max-w-xl mx-auto mt-4 leading-relaxed">
            Fifteen financial tools in one dashboard. Free to start — tools marked ⚡ are part of Premium.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {tools.map(f => (
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

      {/* ── Bank sync ── */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <div className="glass rounded-3xl p-10 flex flex-col md:flex-row gap-10 items-center"
          style={{ borderColor: 'rgba(0,212,255,0.15)', background: 'rgba(0,212,255,0.02)' }}>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: 'rgba(0,212,255,0.08)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
              ⚡ Premium feature
            </div>
            <h2 className="text-2xl font-bold mb-4">Connect your bank. Stop typing everything manually.</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Upgrade to Premium and connect your real bank account. Transactions import automatically
              — no spreadsheet, no manual entry, no forgetting to log that coffee.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-cyan-400">✓</span> Plaid — US, UK, Canada
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-cyan-400">✓</span> Basiq — Australia
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-cyan-400">✓</span> One subscription covers your household
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-3 text-sm">
            <div className="glass rounded-xl px-5 py-3 flex items-center gap-3"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-slate-500">Free</span>
              <span className="text-slate-400 flex-1">Manual entry — always available</span>
              <span className="text-cyan-400">✓</span>
            </div>
            <div className="glass rounded-xl px-5 py-3 flex items-center gap-3"
              style={{ borderColor: 'rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.05)' }}>
              <span className="text-cyan-400 font-semibold">Premium</span>
              <span className="text-slate-300 flex-1">Automatic bank sync</span>
              <span className="text-cyan-400">⚡</span>
            </div>
            <p className="text-slate-600 text-xs text-center">From $9/month · Cancel any time</p>
          </div>
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
          <p className="text-slate-400 mb-3 leading-relaxed">
            Set up your profile in under two minutes. No credit card, no commitment.
            Just a clear, honest picture of when you can stop trading time for money.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Then start your streak. Check in weekly. Climb the leaderboard.<br />
            Watch your retirement age count down.
          </p>
          <Link to="/login"
            className="inline-block px-10 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:glow-cyan"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
            Get started for free
          </Link>
          <p className="text-slate-600 text-xs mt-4">Free forever · Premium from $9/mo · Cancel any time</p>
        </div>
      </section>

      <footer className="relative z-10 text-center text-slate-600 text-sm py-8 border-t border-white/5">
        © {new Date().getFullYear()} Fermiware Pty Ltd, trading as Retirely — <Link to="/about" className="hover:text-slate-400 transition-colors">About</Link> · <Link to="/" className="hover:text-slate-400 transition-colors">Home</Link>
      </footer>
    </div>
  )
}
