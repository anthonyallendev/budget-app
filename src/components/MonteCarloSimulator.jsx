import { useState, useMemo } from 'react'
import PremiumGate from './PremiumGate'
import { runMonteCarlo, RISK_PROFILES, fmtMoney } from '../lib/retirementMath'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

function BandTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm" style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
      <p className="text-slate-400 mb-1 text-xs">Age {label}</p>
      <p className="font-bold text-cyan-400">Median {fmtMoney(row.median)}</p>
      <p className="text-slate-400 text-xs mt-1">Likely range {fmtMoney(row.band50[0])} – {fmtMoney(row.band50[1])}</p>
      <p className="text-slate-500 text-xs">Wide range {fmtMoney(row.band90[0])} – {fmtMoney(row.band90[1])}</p>
    </div>
  )
}

function successColor(rate) {
  if (rate >= 0.85) return '#00d4ff'
  if (rate >= 0.65) return '#a78bfa'
  return '#f43f5e'
}

function successVerdict(rate) {
  if (rate >= 0.9)  return 'Very strong — your plan holds up in almost every market history we simulated.'
  if (rate >= 0.75) return 'Solid — your plan works in most simulated markets, with some risk in poor sequences.'
  if (rate >= 0.5)  return 'Borderline — a bad run of market years early in retirement could deplete your savings.'
  return 'At risk — in most simulated markets this plan runs out of money. Consider spending less, saving more, or retiring later.'
}

function SimulatorBody({ inputs }) {
  const [seed, setSeed] = useState(0) // bump to re-run

  const result = useMemo(
    () => runMonteCarlo(inputs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(inputs), seed],
  )

  const { rows, successRate, medianEndBalance, runs } = result
  const risk = RISK_PROFILES[inputs.riskRate] || RISK_PROFILES[7]
  const pctText = `${Math.round(successRate * 100)}%`

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-600 text-sm p-6">
        Enter your age, savings and desired retirement income above to run the simulation.
      </div>
    )
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-white font-semibold mb-1">Will my money last? — Monte Carlo simulation</h2>
          <p className="text-slate-500 text-xs max-w-lg leading-relaxed">
            Instead of assuming one steady return, this runs {runs.toLocaleString()} simulated market
            histories ({risk.label.toLowerCase()}: ~{Math.round(risk.mean * 100)}% avg return,
            ±{Math.round(risk.vol * 100)}% volatility) to test your plan against good and bad luck —
            including retiring right before a downturn.
          </p>
        </div>
        <button
          onClick={() => setSeed(s => s + 1)}
          className="px-4 py-2 rounded-lg text-sm font-medium shrink-0 transition-all hover:scale-105"
          style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff' }}>
          ↻ Re-run simulation
        </button>
      </div>

      {/* Headline metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${successColor(successRate)}40` }}>
          <p className="text-slate-500 text-xs mb-1.5">Chance money lasts to {inputs.lifeExpectancy}</p>
          <p className="font-bold text-4xl leading-none" style={{ color: successColor(successRate), textShadow: `0 0 20px ${successColor(successRate)}50` }}>
            {pctText}
          </p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-slate-500 text-xs mb-1.5">Median balance at {inputs.lifeExpectancy}</p>
          <p className="font-bold text-3xl leading-none text-white">{fmtMoney(medianEndBalance)}</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-slate-500 text-xs mb-1.5">Drawing down from age</p>
          <p className="font-bold text-3xl leading-none" style={{ color: '#e040fb' }}>{inputs.retirementAge}</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed rounded-xl px-4 py-3"
        style={{ background: `${successColor(successRate)}0d`, border: `1px solid ${successColor(successRate)}30`, color: '#cbd5e1' }}>
        {successVerdict(successRate)}
      </p>

      {/* Fan chart */}
      <div>
        <div className="flex gap-4 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm inline-block" style={{ background: 'rgba(0,212,255,0.15)' }} />
            10th–90th percentile
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm inline-block" style={{ background: 'rgba(0,212,255,0.35)' }} />
            25th–75th percentile
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded inline-block bg-cyan-400" />
            Median
          </span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="age" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false}
              label={{ value: 'Age', position: 'insideBottom', offset: -8, fill: '#00d4ff', fontSize: 13 }} />
            <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={62} />
            <Tooltip content={<BandTooltip />} />
            <ReferenceLine x={inputs.retirementAge} stroke="#e040fb" strokeDasharray="4 4"
              label={{ value: 'Retire', position: 'top', fill: '#e040fb', fontSize: 10 }} />
            <Area type="monotone" dataKey="band90" stroke="none" fill="#00d4ff" fillOpacity={0.12} activeDot={false} />
            <Area type="monotone" dataKey="band50" stroke="none" fill="#00d4ff" fillOpacity={0.22} activeDot={false} />
            <Line type="monotone" dataKey="median" stroke="#00d4ff" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-slate-600 text-xs leading-relaxed">
        Simulation of personal savings only (excludes super) using randomised annual returns.
        This is a statistical illustration, not a prediction or financial advice.
      </p>
    </div>
  )
}

const DEMO_INPUTS = {
  currentAge: 58, retirementAge: 64, lifeExpectancy: 90,
  startingBalance: 350000, monthlyContribution: 1500, riskRate: 7, annualSpend: 45000,
  runs: 300,
}

export default function MonteCarloSimulator({ isPremium, inputs }) {
  if (!isPremium) {
    return (
      <PremiumGate
        feature="the Monte Carlo simulator"
        description="Run 1,000 simulated market histories to see the real odds your money lasts through retirement — not just one best-case line.">
        <SimulatorBody inputs={DEMO_INPUTS} />
      </PremiumGate>
    )
  }
  return (
    <div className="glass rounded-2xl" style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
      <SimulatorBody inputs={inputs} />
    </div>
  )
}
