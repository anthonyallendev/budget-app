import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'

const COUNTRIES = [
  { name: 'Australia',      preservationAge: 60 },
  { name: 'United States',  preservationAge: 65 },
  { name: 'United Kingdom', preservationAge: 57 },
  { name: 'Canada',         preservationAge: 65 },
  { name: 'New Zealand',    preservationAge: 65 },
  { name: 'Germany',        preservationAge: 67 },
  { name: 'France',         preservationAge: 62 },
  { name: 'Singapore',      preservationAge: 63 },
  { name: 'Other',          preservationAge: 65 },
]

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function getAge(dob) {
  if (!dob) return null
  const today = new Date()
  const birth  = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function projectSavings(currentSavings, monthlyContribution, annualRate, years) {
  const r = annualRate / 100
  const n = years * 12
  const monthlyRate = r / 12
  if (monthlyRate === 0) return currentSavings + monthlyContribution * n
  return currentSavings * Math.pow(1 + r, years) +
    monthlyContribution * (Math.pow(1 + monthlyRate, n) - 1) / monthlyRate
}

function calcEarlyRetirementAge(currentAge, preservationAge, currentSavings, monthlyContrib, annualRate, desiredAnnualIncome) {
  if (!desiredAnnualIncome) return null
  const r = annualRate / 100
  for (let age = currentAge; age <= preservationAge; age++) {
    const savingsAtAge = projectSavings(currentSavings, monthlyContrib, annualRate, age - currentAge)
    const gapYears = preservationAge - age
    if (gapYears === 0) return age
    const required = r === 0
      ? desiredAnnualIncome * gapYears
      : desiredAnnualIncome * (1 - Math.pow(1 + r, -gapYears)) / r
    if (savingsAtAge >= required) return age
  }
  return preservationAge
}

function useCountUp(target, duration = 1200) {
  const [display, setDisplay] = useState(null)
  const raf = useRef(null)
  const prev = useRef(null)

  useEffect(() => {
    if (target === null) { setDisplay(null); return }
    if (prev.current === null) { prev.current = target; setDisplay(target); return }

    const start     = prev.current
    const diff      = target - start
    const startTime = performance.now()

    function tick(now) {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease     = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * ease))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
      else prev.current = target
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return display
}

export default function RetirementHero({ compact = false }) {
  const { profile, loading } = useProfile()

  const currentAge      = getAge(profile?.date_of_birth)
  const country         = COUNTRIES.find(c => c.name === profile?.country) || COUNTRIES[0]
  const preservationAge = country.preservationAge

  const personalSavings    = Number(profile?.personal_savings      ?? 0)
  const monthlyContrib     = Number(profile?.monthly_contribution  ?? 0)
  const rate               = Number(profile?.interest_rate         ?? 7)
  const desiredIncome      = Number(profile?.desired_annual_income ?? 0)

  const earlyRetireAge     = currentAge && desiredIncome > 0
    ? calcEarlyRetirementAge(currentAge, preservationAge, personalSavings, monthlyContrib, rate, desiredIncome)
    : null
  const yearsEarly         = earlyRetireAge !== null ? preservationAge - earlyRetireAge : 0

  const displayAge = useCountUp(earlyRetireAge)

  const accentColor = yearsEarly > 0 ? '#00d4ff' : yearsEarly < 0 ? '#e040fb' : '#94a3b8'

  if (compact) {
    return (
      <div className="glass rounded-2xl p-6 flex flex-col justify-between" style={{ minHeight: '100%' }}>
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Projected retirement age</p>
        {loading ? (
          <div className="h-10 w-20 rounded-lg bg-white/5 animate-pulse" />
        ) : !profile || !desiredIncome ? (
          <>
            <p className="text-3xl font-bold text-slate-700">—</p>
            <Link to={!profile ? '/onboarding' : '/retirement'}
              className="text-xs text-cyan-400 hover:underline mt-2">
              {!profile ? 'Complete your profile →' : 'Set income target →'}
            </Link>
          </>
        ) : (
          <>
            <div className="age-glow rounded-xl inline-block" style={{ '--glow-rgb': hexToRgb(accentColor) }}>
              <p className="font-black leading-none"
                style={{
                  fontSize: '3rem',
                  lineHeight: 1,
                  background: `linear-gradient(135deg, ${accentColor}, #7c3aed)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                {displayAge ?? '—'}
              </p>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              <span className="text-xs font-semibold" style={{ color: accentColor }}>
                {yearsEarly > 0
                  ? `${yearsEarly} yr${yearsEarly !== 1 ? 's' : ''} early`
                  : yearsEarly === 0
                  ? 'At preservation age'
                  : `${Math.abs(yearsEarly)} yr${Math.abs(yearsEarly) !== 1 ? 's' : ''} late`}
              </span>
              <Link to="/retirement" className="text-xs text-slate-600 hover:text-cyan-400 transition-colors">
                Adjust calculator →
              </Link>
            </div>
          </>
        )}
        <style>{`
          @keyframes ageGlow {
            0%, 100% { box-shadow: 0 0 0px 0px transparent; }
            50%       { box-shadow: 0 0 18px 4px rgba(var(--glow-rgb), 0.2); }
          }
          .age-glow { animation: ageGlow 6s ease-in-out infinite; }
        `}</style>
      </div>
    )
  }

  return (
    <div
      className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden"
      style={{ borderColor: 'rgba(0,212,255,0.2)', minHeight: 220 }}
    >

      <p className="text-slate-500 text-xs uppercase tracking-widest mb-4 relative z-10">
        Projected retirement age
      </p>

      {loading ? (
        <div className="h-20 w-32 rounded-xl bg-white/5 animate-pulse mx-auto" />
      ) : !profile ? (
        <div className="flex flex-col items-center gap-3 relative z-10">
          <p className="text-5xl font-bold text-slate-700">—</p>
          <Link
            to="/onboarding"
            className="text-xs text-cyan-400 hover:underline"
          >
            Complete your profile to see this
          </Link>
        </div>
      ) : !desiredIncome ? (
        <div className="flex flex-col items-center gap-3 relative z-10">
          <p className="text-5xl font-bold text-slate-700">—</p>
          <Link
            to="/retirement"
            className="text-xs text-cyan-400 hover:underline"
          >
            Set your retirement income target →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center relative z-10">
          <div
            className="age-glow rounded-xl px-3"
            style={{ '--glow-rgb': hexToRgb(accentColor) }}
          >
            <p
              className="font-black leading-none"
              style={{
                fontSize: '7rem',
                lineHeight: 1,
                background: `linear-gradient(135deg, ${accentColor}, #7c3aed)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {displayAge ?? '—'}
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}40`,
                color: accentColor,
              }}
            >
              {yearsEarly > 0
                ? `${yearsEarly} year${yearsEarly !== 1 ? 's' : ''} early`
                : yearsEarly === 0
                ? 'At preservation age'
                : `${Math.abs(yearsEarly)} year${Math.abs(yearsEarly) !== 1 ? 's' : ''} after preservation age`}
            </div>
          </div>

          <p className="text-slate-600 text-xs mt-3">
            Preservation age: {preservationAge} · {country.name}
          </p>

          <Link to="/retirement" className="text-xs text-slate-600 hover:text-cyan-400 transition-colors mt-2">
            Adjust calculator →
          </Link>
        </div>
      )}

      <style>{`
        @keyframes ageGlow {
          0%, 100% { box-shadow: 0 0 0px 0px transparent; }
          50%       { box-shadow: 0 0 18px 4px rgba(var(--glow-rgb), 0.2); }
        }
        .age-glow { animation: ageGlow 6s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
