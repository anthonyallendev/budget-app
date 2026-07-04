import { useMemo } from 'react'
import AppLayout from '../components/AppLayout'
import PremiumGate from '../components/PremiumGate'
import { useProfile } from '../hooks/useProfile'
import { useFeatureData } from '../hooks/useFeatureData'
import { projectSavings, depletionAge, fmtMoney } from '../lib/retirementMath'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const COLORS = ['#00d4ff', '#e040fb', '#f59e0b', '#00b894', '#a78bfa']
// Past the base palette, generate evenly-spread hues so any number of
// scenarios stays distinguishable
const colorFor = i => COLORS[i] ?? `hsl(${(i * 137.5) % 360}, 85%, 65%)`
const MAX_AGE = 100

function getAge(dob) {
  if (!dob) return null
  const today = new Date(), birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// Balance trajectory: accumulate to retirementAge, then draw down annualSpend.
function trajectory(currentAge, scenario) {
  const points = []
  const { savings, lumpSum, monthly, rate, retirementAge, annualSpend } = scenario
  for (let age = currentAge; age <= retirementAge; age++) {
    points.push({ age, bal: Math.round(projectSavings(savings + lumpSum, monthly, rate, age - currentAge)) })
  }
  let bal = projectSavings(savings + lumpSum, monthly, rate, retirementAge - currentAge)
  const r = rate / 100
  for (let age = retirementAge + 1; age <= MAX_AGE; age++) {
    bal = bal * (1 + r) - annualSpend
    points.push({ age, bal: Math.max(0, Math.round(bal)) })
    if (bal <= 0) break
  }
  return points
}

const inputStyle = { background: 'rgba(6,11,26,0.8)', border: '1px solid rgba(0,212,255,0.18)' }

function NumField({ label, value, onChange, prefix, step = 1 }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-slate-400 text-xs">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{prefix}</span>}
        <input type="number" step={step} value={value === 0 ? '' : value} placeholder="0"
          onChange={e => onChange(Number(e.target.value) || 0)}
          className={`w-full rounded-lg ${prefix ? 'pl-7' : 'pl-3'} pr-3 py-2 text-white text-sm outline-none`}
          style={inputStyle} />
      </div>
    </div>
  )
}

function ScenarioCard({ scenario, color, isBaseline, currentAge, onChange, onDelete }) {
  const balAtRetire = projectSavings(
    scenario.savings + scenario.lumpSum, scenario.monthly, scenario.rate,
    Math.max(0, scenario.retirementAge - currentAge))
  const lastsUntil = depletionAge(balAtRetire, scenario.rate, scenario.annualSpend, scenario.retirementAge, MAX_AGE)

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4" style={{ borderColor: `${color}30` }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
          {isBaseline ? (
            <p className="text-white font-semibold text-sm">Current plan (baseline)</p>
          ) : (
            <input value={scenario.name}
              onChange={e => onChange({ ...scenario, name: e.target.value })}
              className="bg-transparent text-white font-semibold text-sm outline-none flex-1 min-w-0 border-b border-transparent focus:border-cyan-400/40" />
          )}
        </div>
        {!isBaseline && (
          <button onClick={onDelete} className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none shrink-0">×</button>
        )}
      </div>

      {!isBaseline && (
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Retire at age" value={scenario.retirementAge}
            onChange={v => onChange({ ...scenario, retirementAge: v })} />
          <NumField label="Monthly saving ($)" value={scenario.monthly} prefix="$"
            onChange={v => onChange({ ...scenario, monthly: v })} />
          <NumField label="One-off boost ($)" value={scenario.lumpSum} prefix="$"
            onChange={v => onChange({ ...scenario, lumpSum: v })} />
          <NumField label="Spend in retirement ($/yr)" value={scenario.annualSpend} prefix="$"
            onChange={v => onChange({ ...scenario, annualSpend: v })} />
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-slate-400 text-xs">Return rate</label>
            <div className="flex gap-1">
              {[4, 7, 10].map(r => (
                <button key={r} onClick={() => onChange({ ...scenario, rate: r })}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={scenario.rate === r
                    ? { background: `${color}20`, border: `1px solid ${color}60`, color }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}>
                  {r}%
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-auto">
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-slate-500 text-xs mb-1">At retirement ({scenario.retirementAge})</p>
          <p className="font-bold text-lg leading-none" style={{ color }}>{fmtMoney(balAtRetire)}</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-slate-500 text-xs mb-1">Money lasts until</p>
          <p className="font-bold text-lg leading-none"
            style={{ color: lastsUntil ? '#f43f5e' : '#00d4ff' }}>
            {lastsUntil ? `Age ${lastsUntil}` : `${MAX_AGE}+`}
          </p>
        </div>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 text-sm">
      <p className="text-slate-400 mb-2 text-xs">Age {label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold text-xs" style={{ color: p.color }}>{p.name}: {fmtMoney(p.value)}</p>
      ))}
    </div>
  )
}

function PlannerBody({ profile }) {
  const currentAge = getAge(profile?.date_of_birth) ?? 55
  const baseline = useMemo(() => ({
    id: 'baseline',
    name: 'Current plan',
    savings: Number(profile?.personal_savings ?? 0),
    lumpSum: 0,
    monthly: Number(profile?.monthly_contribution ?? 0),
    rate: Number(profile?.interest_rate ?? 7),
    retirementAge: Math.max(currentAge + 1, 65),
    annualSpend: Number(profile?.desired_annual_income ?? 50000) || 50000,
  }), [profile, currentAge])

  const { data: saved, save } = useFeatureData('scenarios', [])
  const scenarios = Array.isArray(saved) ? saved : []

  function addScenario(preset) {
    const base = { ...baseline, id: String(Date.now()) }
    const presets = {
      blank:     { ...base, name: `Scenario ${scenarios.length + 1}` },
      downsize:  { ...base, name: 'Downsize the house', lumpSum: 200000 },
      parttime:  { ...base, name: 'Work 2 more years', retirementAge: baseline.retirementAge + 2 },
      frugal:    { ...base, name: 'Spend $10k less/yr', annualSpend: Math.max(10000, baseline.annualSpend - 10000) },
    }
    save([...scenarios, presets[preset] || presets.blank])
  }

  const all = [baseline, ...scenarios]

  const chartData = useMemo(() => {
    const byAge = {}
    all.forEach((s, i) => {
      trajectory(currentAge, s).forEach(({ age, bal }) => {
        byAge[age] = byAge[age] || { age }
        byAge[age][`s${i}`] = bal
      })
    })
    return Object.values(byAge).sort((a, b) => a.age - b.age)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(all), currentAge])

  return (
    <div className="flex flex-col gap-6">
      {/* Chart */}
      <div className="glass rounded-2xl p-6" style={{ borderColor: 'rgba(0,212,255,0.12)' }}>
        <h2 className="text-white font-semibold mb-1">Side-by-side projection</h2>
        <p className="text-slate-500 text-xs mb-6">Each line shows total savings over time — growing while you save, shrinking as you spend in retirement.</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="age" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => fmtMoney(v)} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={62} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {all.map((s, i) => (
              <Line key={s.id} type="monotone" dataKey={`s${i}`} name={i === 0 ? 'Current plan' : s.name}
                stroke={colorFor(i)} strokeWidth={i === 0 ? 2.5 : 2}
                strokeDasharray={i === 0 ? undefined : '6 3'} dot={false} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Add buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'downsize', label: '🏡 Downsize the house' },
          { key: 'parttime', label: '💼 Work 2 more years' },
          { key: 'frugal',   label: '✂️ Spend less' },
          { key: 'blank',    label: '＋ Blank scenario' },
        ].map(b => (
          <button key={b.key} onClick={() => addScenario(b.key)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
            {b.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {all.map((s, i) => (
          <ScenarioCard key={s.id} scenario={s} color={colorFor(i)}
            isBaseline={i === 0} currentAge={currentAge}
            onChange={next => save(scenarios.map(x => x.id === next.id ? next : x))}
            onDelete={() => save(scenarios.filter(x => x.id !== s.id))} />
        ))}
      </div>

      <p className="text-slate-600 text-xs">
        Baseline comes from your Retirement Calculator inputs. Scenarios are saved to your account.
        Projections are illustrations only, not financial advice.
      </p>
    </div>
  )
}

export default function ScenarioPlannerPage() {
  const { profile, loading } = useProfile()
  const isPremium = profile?.subscription_status === 'premium'

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-1">Scenario Planner</h1>
      <p className="text-slate-400 text-sm mb-8">What if you downsized, worked longer, or spent less? Compare retirement plans side by side.</p>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-500">Loading…</div>
      ) : isPremium ? (
        <PlannerBody profile={profile} />
      ) : (
        <PremiumGate
          feature="the scenario planner"
          description="Compare up to 4 what-if retirement plans side by side — downsizing, working longer, spending less — and see exactly how long your money lasts in each.">
          <PlannerBody profile={profile} />
        </PremiumGate>
      )}
    </AppLayout>
  )
}
