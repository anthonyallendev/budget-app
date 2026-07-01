function calcScore({ annualSalary, personalSavings, monthlyContrib, desiredIncome, currentAge, preservationAge, earlyRetireAge }) {
  if (!annualSalary || !currentAge) return null

  const monthlyIncome   = annualSalary / 12
  const savingsRate     = monthlyIncome > 0 ? monthlyContrib / monthlyIncome : 0
  const targetNestEgg   = desiredIncome > 0 ? desiredIncome * 25 : annualSalary * 15
  const nestEggProgress = personalSavings / targetNestEgg

  // 1. Savings rate (0–35 pts): 20%+ of income = full marks
  const savingsScore = Math.min(35, Math.round((savingsRate / 0.20) * 35))

  // 2. Nest egg progress (0–40 pts): how far toward 25× desired income
  const nestEggScore = Math.min(40, Math.round(nestEggProgress * 40))

  // 3. Early retirement bonus (0–25 pts): retiring before preservation age
  const yearsEarly = earlyRetireAge !== null ? Math.max(0, preservationAge - earlyRetireAge) : 0
  const maxEarly   = Math.max(preservationAge - currentAge, 1)
  const earlyScore = Math.min(25, Math.round((yearsEarly / maxEarly) * 25))

  const total = savingsScore + nestEggScore + earlyScore

  return {
    total,
    savingsScore, savingsRate,
    nestEggScore, nestEggProgress,
    earlyScore,   yearsEarly,
  }
}

function ScoreArc({ score }) {
  const pct    = score / 100
  const r      = 52
  const circ   = 2 * Math.PI * r
  const dash   = pct * circ * 0.75       // 75% of circle used for the arc
  const offset = circ * 0.125            // start at 225° (bottom-left)

  const color = score >= 80 ? '#00d4ff'
              : score >= 60 ? '#7c3aed'
              : score >= 40 ? '#f59e0b'
              :               '#f43f5e'

  const label = score >= 80 ? 'Excellent'
              : score >= 60 ? 'On track'
              : score >= 40 ? 'Needs attention'
              :               'At risk'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-[135deg]">
          {/* Track */}
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)"
            strokeWidth="10" strokeDasharray={`${circ * 0.75} ${circ}`}
            strokeDashoffset={-offset} strokeLinecap="round" />
          {/* Progress */}
          <circle cx="60" cy="60" r={r} fill="none" stroke={color}
            strokeWidth="10" strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={-offset} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: 'stroke-dasharray 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-xs text-slate-500">/100</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

function Bar({ label, value, max, color, fmt }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span style={{ color }}>{fmt(value, max)}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}60` }} />
      </div>
    </div>
  )
}

export default function RetirementReadinessScore({ annualSalary, personalSavings, monthlyContrib, desiredIncome, currentAge, preservationAge, earlyRetireAge }) {
  const result = calcScore({ annualSalary, personalSavings, monthlyContrib, desiredIncome, currentAge, preservationAge, earlyRetireAge })
  if (!result) return null

  return (
    <div className="glass rounded-2xl p-6 mb-6">
      <h2 className="text-white font-semibold mb-1">Retirement readiness</h2>
      <p className="text-slate-500 text-xs mb-6">Based on your savings rate, nest egg progress, and projected retirement age.</p>
      <div className="flex flex-col sm:flex-row items-center gap-8">
        <ScoreArc score={result.total} />
        <div className="flex-1 w-full flex flex-col gap-4">
          <Bar
            label="Savings rate"
            value={result.savingsScore} max={35}
            color="#00d4ff"
            fmt={(v) => `${Math.round(result.savingsRate * 100)}% of income (target 20%)`}
          />
          <Bar
            label="Nest egg progress"
            value={result.nestEggScore} max={40}
            color="#7c3aed"
            fmt={() => `${Math.round(result.nestEggProgress * 100)}% toward target`}
          />
          <Bar
            label="Early retirement"
            value={result.earlyScore} max={25}
            color="#e040fb"
            fmt={() => result.yearsEarly > 0 ? `${result.yearsEarly} yr${result.yearsEarly !== 1 ? 's' : ''} early` : 'At preservation age'}
          />
        </div>
      </div>
    </div>
  )
}
