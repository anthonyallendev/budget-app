import { useMigratedFeatureData } from '../hooks/useMigratedFeatureData'

const COUNTRIES = [
  { name: 'Australia',     preservationAge: 60  },
  { name: 'United States', preservationAge: 65  },
  { name: 'United Kingdom',preservationAge: 57  },
  { name: 'Canada',        preservationAge: 65  },
  { name: 'New Zealand',   preservationAge: 65  },
  { name: 'Germany',       preservationAge: 67  },
  { name: 'France',        preservationAge: 62  },
  { name: 'Singapore',     preservationAge: 63  },
  { name: 'Other',         preservationAge: 65  },
]

const DEFAULTS = { currentAge: '', annualSalary: '', country: 'Australia' }

function calcRetirementAge(currentAge, annualSalary, preservationAge, totalSavings) {
  const age = Number(currentAge)
  const salary = Number(annualSalary)
  if (!age || !salary || salary === 0) return null
  // Placeholder formula — will be refined later
  const yearsEquivalent = totalSavings / salary
  const estimatedAge = Math.max(age, preservationAge - yearsEquivalent)
  return Math.round(estimatedAge)
}

export default function RetirementPanel({ transactions }) {
  const { data: profile, save } = useMigratedFeatureData('retirementProfile', 'retirementProfile', DEFAULTS)

  function set(key, val) {
    save({ ...profile, [key]: val })
  }

  const country = COUNTRIES.find(c => c.name === profile.country) || COUNTRIES[0]

  const totalSavings = transactions
    .filter(t => t.type === 'expense' && (t.category === 'Stocks / ETFs' || t.category === 'Superannuation' || t.category === 'Crypto' || t.category === 'Property' || t.category === 'Bonds' || t.category === 'Other' && t.tab === 'Savings'))
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  const retirementAge = calcRetirementAge(profile.currentAge, profile.annualSalary, country.preservationAge, totalSavings)
  const yearsAway = retirementAge && profile.currentAge ? retirementAge - Number(profile.currentAge) : null

  const inputStyle = {
    background: 'rgba(6,11,26,0.8)',
    border: '1px solid rgba(0,212,255,0.18)',
  }
  const focusGlow = e => e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)'
  const blurGlow  = e => e.target.style.boxShadow = 'none'

  return (
    <div className="glass rounded-2xl p-6 mb-6">
      <h2 className="text-white font-semibold text-lg mb-1">Retirement estimate</h2>
      <p className="text-slate-500 text-xs mb-6">Fill in your details to see your estimated retirement age.</p>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Estimated age display */}
        <div className="flex flex-col items-center justify-center glass rounded-2xl px-10 py-8 min-w-[200px] text-center"
          style={{ borderColor: 'rgba(224,64,251,0.2)' }}>
          {retirementAge ? (
            <>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Estimated age</p>
              <p className="text-6xl font-bold text-gradient leading-none">{retirementAge}</p>
              <p className="text-slate-400 text-sm mt-3">
                {yearsAway > 0 ? `${yearsAway} years away` : yearsAway === 0 ? "You're there!" : 'Already reached!'}
              </p>
              <p className="text-slate-600 text-xs mt-1">Preservation age: {country.preservationAge}</p>
            </>
          ) : (
            <>
              <p className="text-5xl font-bold text-slate-700">—</p>
              <p className="text-slate-600 text-xs mt-3">Enter your details</p>
            </>
          )}
        </div>

        {/* Inputs */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs">Your current age</label>
            <input
              type="number"
              min="18"
              max="100"
              placeholder="e.g. 32"
              value={profile.currentAge}
              onChange={e => set('currentAge', e.target.value)}
              className="rounded-lg px-3 py-2.5 text-white text-sm outline-none"
              style={inputStyle}
              onFocus={focusGlow}
              onBlur={blurGlow}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs">Annual salary ($)</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 80000"
              value={profile.annualSalary}
              onChange={e => set('annualSalary', e.target.value)}
              className="rounded-lg px-3 py-2.5 text-white text-sm outline-none"
              style={inputStyle}
              onFocus={focusGlow}
              onBlur={blurGlow}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-slate-400 text-xs">Country / region</label>
            <select
              value={profile.country}
              onChange={e => set('country', e.target.value)}
              className="rounded-lg px-3 py-2.5 text-white text-sm outline-none"
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={focusGlow}
              onBlur={blurGlow}
            >
              {COUNTRIES.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} — preservation age {c.preservationAge}
                </option>
              ))}
            </select>
          </div>

          <p className="text-slate-600 text-xs sm:col-span-2">
            * Formula will be refined. Currently uses total savings ÷ annual salary subtracted from preservation age.
          </p>
        </div>
      </div>
    </div>
  )
}
