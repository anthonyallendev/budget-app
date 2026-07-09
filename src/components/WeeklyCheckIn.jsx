import { useState } from 'react'
import { useMigratedFeatureData } from '../hooks/useMigratedFeatureData'

const QUESTIONS = [
  { key: 'budget',  label: 'Did you stick to your budget this week?',       options: ['Yes ✅', 'Mostly 😅', 'Not really 😬'] },
  { key: 'savings', label: 'Did you put anything toward savings or goals?',  options: ['Yes 🎯', 'A little 🌱', 'Not this week'] },
  { key: 'feeling', label: 'How do you feel about your finances right now?', options: ['Great 😊', 'Okay 😐', 'Stressed 😰'] },
]

const MOOD_COLORS = { 'Great 😊': '#00d4ff', 'Okay 😐': '#f59e0b', 'Stressed 😰': '#e040fb', default: '#7c3aed' }

function weekKey() {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

export default function WeeklyCheckIn() {
  const [open,      setOpen]      = useState(false)
  const [answers,   setAnswers]   = useState({})
  const [step,      setStep]      = useState(0)
  const [done,      setDone]      = useState(false)
  const [showChart, setShowChart] = useState(false)
  const { data: history, save: saveHistory } = useMigratedFeatureData('checkInHistory', 'checkInHistory', [])

  const thisWeek   = weekKey()
  const alreadyDone = history.some(h => h.week === thisWeek)

  function handleAnswer(key, val) {
    const next = { ...answers, [key]: val }
    setAnswers(next)
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1)
    } else {
      const entry = { week: thisWeek, date: new Date().toLocaleDateString('en-AU', { day:'numeric', month:'short' }), ...next }
      const updated = [...history.filter(h => h.week !== thisWeek), entry].slice(-26)
      saveHistory(updated)
      setDone(true)
    }
  }

  function reset() {
    setOpen(false)
    setStep(0)
    setAnswers({})
    setDone(false)
  }

  const recentHistory = history.slice(-8).reverse()

  return (
    <>
      {/* Trigger card */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-white font-semibold mb-0.5">Weekly check-in</h2>
            <p className="text-slate-500 text-xs">
              {alreadyDone ? 'Done for this week ✓' : 'Takes 30 seconds · builds your money habits'}
            </p>
          </div>
          <div className="flex gap-2">
            {history.length > 0 && (
              <button onClick={() => setShowChart(s => !s)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                {showChart ? 'Hide history' : 'View history'}
              </button>
            )}
            <button
              onClick={() => { setOpen(true); setStep(0); setAnswers({}); setDone(false) }}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02]"
              style={{ background: alreadyDone ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}
            >
              {alreadyDone ? 'Redo check-in' : 'Start check-in →'}
            </button>
          </div>
        </div>

        {/* History dots */}
        {showChart && history.length > 0 && (
          <div className="mt-5 border-t border-white/5 pt-4">
            <p className="text-slate-500 text-xs mb-3">Recent check-ins</p>
            <div className="flex flex-col gap-2">
              {recentHistory.map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600 w-16 shrink-0">{h.date}</span>
                  {QUESTIONS.map(q => (
                    <span key={q.key} className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        background: `${MOOD_COLORS[h[q.key]] || MOOD_COLORS.default}18`,
                        color: MOOD_COLORS[h[q.key]] || MOOD_COLORS.default,
                      }}>
                      {h[q.key]?.split(' ')[1] || '—'}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(6,11,26,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="glass rounded-2xl p-8 w-full max-w-md">
            {!done ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-slate-500 text-xs uppercase tracking-widest">
                    Question {step + 1} of {QUESTIONS.length}
                  </p>
                  <button onClick={reset} className="text-slate-600 hover:text-white transition-colors text-lg">×</button>
                </div>
                <div className="flex gap-1 mb-6">
                  {QUESTIONS.map((_, i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all"
                      style={{ background: i <= step ? '#7c3aed' : 'rgba(255,255,255,0.06)' }} />
                  ))}
                </div>
                <h3 className="text-white font-semibold text-lg mb-6">{QUESTIONS[step].label}</h3>
                <div className="flex flex-col gap-3">
                  {QUESTIONS[step].options.map(opt => (
                    <button key={opt}
                      onClick={() => handleAnswer(QUESTIONS[step].key, opt)}
                      className="py-3 px-5 rounded-xl text-left text-sm font-medium text-white transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-5xl mb-4">🎉</p>
                <h3 className="text-white font-bold text-xl mb-2">Check-in complete!</h3>
                <p className="text-slate-400 text-sm mb-6">Your weekly snapshot has been saved.</p>
                <div className="flex flex-col gap-2 mb-6">
                  {QUESTIONS.map(q => (
                    <div key={q.key} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                      <span className="text-slate-500 text-xs">{q.label.split('?')[0]}?</span>
                      <span className="text-sm font-medium" style={{ color: MOOD_COLORS[answers[q.key]] || '#7c3aed' }}>
                        {answers[q.key]}
                      </span>
                    </div>
                  ))}
                </div>
                <button onClick={reset}
                  className="py-2.5 px-8 rounded-xl font-semibold text-white text-sm transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
