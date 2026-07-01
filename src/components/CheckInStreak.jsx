const LEVELS = [
  { days: 365, emoji: '👑', label: 'Legendary',     sub: '1 year streak'   },
  { days: 180, emoji: '🚀', label: 'Unstoppable',   sub: '6 month streak'  },
  { days:  84, emoji: '💎', label: 'Diamond',        sub: '3 month streak'  },
  { days:  56, emoji: '💪', label: 'Committed',      sub: '2 month streak'  },
  { days:  35, emoji: '🔥🔥🔥', label: 'On Fire',   sub: '5 week streak'   },
  { days:  28, emoji: '🔥🔥', label: 'Blazing',      sub: '4 week streak'   },
  { days:  21, emoji: '🔥',  label: 'Heating Up',    sub: '3 week streak'   },
  { days:  14, emoji: '🌱',  label: 'Growing',        sub: '2 week streak'   },
  { days:   7, emoji: '⭐',  label: 'One Week',       sub: '7 day streak'    },
  { days:   1, emoji: '👍',  label: 'Getting Started',sub: 'first check-in'  },
]

function getLevel(days) {
  return LEVELS.find(l => days >= l.days) || null
}

function loadStreak() {
  try { return JSON.parse(localStorage.getItem('checkInStreak')) || {} } catch { return {} }
}

function updateStreak() {
  const today = new Date().toISOString().split('T')[0]
  const data  = loadStreak()

  if (data.lastVisit === today) return data  // already checked in today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const streak = data.lastVisit === yesterday ? (data.streak || 0) + 1 : 1
  const longest = Math.max(streak, data.longest || 0)

  const updated = { lastVisit: today, streak, longest }
  localStorage.setItem('checkInStreak', JSON.stringify(updated))
  return updated
}

export default function CheckInStreak() {
  const data  = updateStreak()
  const level = getLevel(data.streak || 0)
  if (!level) return null

  const next   = LEVELS.slice().reverse().find(l => l.days > (data.streak || 0))
  const daysTo = next ? next.days - (data.streak || 0) : null

  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-5">
      <div className="text-4xl leading-none select-none">{level.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-white font-semibold">{level.label}</span>
          <span className="text-slate-500 text-xs">{level.sub}</span>
        </div>
        <p className="text-slate-500 text-xs mt-0.5">
          {data.streak} day{data.streak !== 1 ? 's' : ''} in a row
          {data.longest > data.streak && (
            <span className="text-slate-600"> · best: {data.longest}</span>
          )}
        </p>
        {daysTo && (
          <p className="text-xs mt-1.5" style={{ color: '#7c3aed' }}>
            {daysTo} more day{daysTo !== 1 ? 's' : ''} to unlock{' '}
            <span>{LEVELS.find(l => l.days === next.days)?.emoji}</span>{' '}
            {next.label}
          </p>
        )}
      </div>
    </div>
  )
}
