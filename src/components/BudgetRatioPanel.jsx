import { useState, useEffect } from 'react'

const DEFAULTS = { needs: 50, wants: 30, savings: 20 }

const BUCKETS = [
  { key: 'needs',   label: 'Needs',   color: '#00d4ff', desc: 'Rent, groceries, utilities, transport' },
  { key: 'wants',   label: 'Wants',   color: '#7c3aed', desc: 'Dining out, entertainment, shopping'   },
  { key: 'savings', label: 'Savings', color: '#e040fb', desc: 'Investments, super, emergency fund'    },
]

function load() {
  try { return JSON.parse(localStorage.getItem('budgetRatio')) || DEFAULTS }
  catch { return DEFAULTS }
}

export default function BudgetRatioPanel() {
  const [ratios, setRatios] = useState(load)

  useEffect(() => {
    localStorage.setItem('budgetRatio', JSON.stringify(ratios))
  }, [ratios])

  function handleChange(key, raw) {
    const val = Math.min(100, Math.max(0, Number(raw)))
    const other = BUCKETS.map(b => b.key).filter(k => k !== key)
    const remaining = 100 - val
    const otherTotal = ratios[other[0]] + ratios[other[1]]

    let updated
    if (otherTotal === 0) {
      updated = { ...ratios, [key]: val, [other[0]]: Math.round(remaining / 2), [other[1]]: remaining - Math.round(remaining / 2) }
    } else {
      const scale = remaining / otherTotal
      const a = Math.round(ratios[other[0]] * scale)
      const b = remaining - a
      updated = { ...ratios, [key]: val, [other[0]]: a, [other[1]]: b }
    }
    setRatios(updated)
  }

  return (
    <div className="glass rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white font-semibold text-lg">Budget targets</h2>
        <button
          onClick={() => setRatios(DEFAULTS)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Reset to 50/30/20
        </button>
      </div>
      <p className="text-slate-500 text-xs mb-6">Set your ideal split of income across each category.</p>

      {/* Ratio bar */}
      <div className="flex rounded-full overflow-hidden h-3 mb-6">
        {BUCKETS.map(b => (
          <div
            key={b.key}
            style={{ width: `${ratios[b.key]}%`, background: b.color, transition: 'width 0.2s' }}
          />
        ))}
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-5">
        {BUCKETS.map(b => (
          <div key={b.key}>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-sm font-semibold" style={{ color: b.color }}>{b.label}</span>
                <span className="text-slate-600 text-xs ml-2">{b.desc}</span>
              </div>
              <span className="text-white font-bold text-sm tabular-nums">{ratios[b.key]}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={ratios[b.key]}
              onChange={e => handleChange(b.key, e.target.value)}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${b.color} ${ratios[b.key]}%, rgba(255,255,255,0.08) ${ratios[b.key]}%)`,
                accentColor: b.color,
              }}
            />
          </div>
        ))}
      </div>

      <p className="text-center text-slate-600 text-xs mt-5">
        Total: <span className="text-white font-semibold">{ratios.needs + ratios.wants + ratios.savings}%</span>
      </p>
    </div>
  )
}
