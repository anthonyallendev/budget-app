// Shared retirement projection maths used by the Monte Carlo simulator and
// the scenario planner. Deterministic helpers mirror RetirementPage's model.

export function projectSavings(currentSavings, monthlyContribution, annualRate, years) {
  const r = annualRate / 100
  const n = years * 12
  const monthlyRate = r / 12
  if (monthlyRate === 0) return currentSavings + monthlyContribution * n
  const fv = currentSavings * Math.pow(1 + r, years) +
    monthlyContribution * (Math.pow(1 + monthlyRate, n) - 1) / monthlyRate
  return Math.max(0, fv)
}

// How long a balance lasts drawing `annualSpend` per year at `annualRate` %.
// Returns the age money runs out, or null if it survives to maxAge.
export function depletionAge(balance, annualRate, annualSpend, fromAge, maxAge) {
  if (!annualSpend || annualSpend <= 0) return null
  const r = annualRate / 100
  let bal = balance
  for (let age = fromAge + 1; age <= maxAge; age++) {
    bal = bal * (1 + r) - annualSpend
    if (bal <= 0) return age
  }
  return null
}

// Expected return / volatility assumptions per risk setting (annual, nominal).
export const RISK_PROFILES = {
  4:  { label: 'Conservative', mean: 0.04, vol: 0.07 },
  7:  { label: 'Moderate',     mean: 0.07, vol: 0.12 },
  10: { label: 'Aggressive',   mean: 0.10, vol: 0.17 },
}

// Box-Muller standard normal
function randNormal() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

/**
 * Monte Carlo retirement simulation.
 * Accumulates monthly contributions until retirementAge, then draws down
 * annualSpend until lifeExpectancy, with randomised annual returns.
 *
 * Returns { rows, successRate, medianEndBalance, runs } where rows are
 * per-age percentile bands: { age, band90: [p10, p90], band50: [p25, p75], median }.
 */
export function runMonteCarlo({
  currentAge,
  retirementAge,
  lifeExpectancy,
  startingBalance,
  monthlyContribution,
  riskRate,          // 4 | 7 | 10 (matches the calculator's slider)
  annualSpend,
  runs = 1000,
}) {
  const profile = RISK_PROFILES[riskRate] || RISK_PROFILES[7]
  const years = lifeExpectancy - currentAge
  if (years <= 0) return { rows: [], successRate: 0, medianEndBalance: 0, runs }

  // perYear[yearIndex] collects every run's balance at that year
  const perYear = Array.from({ length: years + 1 }, () => [])
  let successes = 0

  for (let run = 0; run < runs; run++) {
    let bal = startingBalance
    perYear[0].push(bal)
    let failed = false
    for (let y = 1; y <= years; y++) {
      const age = currentAge + y
      const ret = profile.mean + profile.vol * randNormal()
      bal = bal * (1 + ret)
      if (age <= retirementAge) bal += monthlyContribution * 12
      else bal -= annualSpend
      if (bal < 0) { bal = 0; failed = true }
      perYear[y].push(bal)
    }
    if (!failed) successes++
  }

  const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
  const rows = perYear.map((balances, y) => {
    const sorted = [...balances].sort((a, b) => a - b)
    return {
      age: currentAge + y,
      band90: [Math.round(pct(sorted, 0.10)), Math.round(pct(sorted, 0.90))],
      band50: [Math.round(pct(sorted, 0.25)), Math.round(pct(sorted, 0.75))],
      median: Math.round(pct(sorted, 0.50)),
    }
  })

  const endSorted = [...perYear[years]].sort((a, b) => a - b)
  return {
    rows,
    successRate: successes / runs,
    medianEndBalance: Math.round(pct(endSorted, 0.5)),
    runs,
  }
}

export function fmtMoney(n) {
  if (n == null) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${Math.round(n).toLocaleString()}`
}
