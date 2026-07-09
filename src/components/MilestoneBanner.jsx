import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { readMigratedFeatureData, writeMigratedFeatureData } from '../hooks/useMigratedFeatureData'

function detectMilestones({ goals = [], netWorth = null, netWorthHistory = [], debts = [], dismissed = [] }) {
  const milestones = []

  for (const g of goals) {
    const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0
    if (pct >= 100) {
      const key = `goal-complete-${g.id}`
      if (!dismissed.includes(key)) milestones.push({ key, emoji: '🏆', title: `Goal complete!`, sub: `You hit your ${g.icon} ${g.name} goal of $${g.target.toLocaleString()}`, color: '#00d4ff' })
    } else if (pct >= 50 && pct < 60) {
      const key = `goal-halfway-${g.id}`
      if (!dismissed.includes(key)) milestones.push({ key, emoji: '🎯', title: `Halfway there!`, sub: `${g.icon} ${g.name} is 50% funded — $${g.saved.toLocaleString()} of $${g.target.toLocaleString()}`, color: '#7c3aed' })
    }
  }

  if (netWorth !== null && netWorthHistory.length >= 2) {
    const prev = netWorthHistory[netWorthHistory.length - 2]?.net ?? 0
    const thresholds = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000]
    for (const t of thresholds) {
      if (prev < t && netWorth >= t) {
        const key = `nw-${t}`
        if (!dismissed.includes(key)) milestones.push({ key, emoji: '💰', title: `Net worth milestone!`, sub: `You've crossed $${t.toLocaleString()} net worth`, color: '#e040fb' })
      }
    }
    const allTimeHigh = Math.max(...netWorthHistory.map(h => h.net ?? 0))
    if (netWorth > allTimeHigh && netWorthHistory.length >= 3) {
      const key = `nw-ath-${Math.round(netWorth / 1000)}k`
      if (!dismissed.includes(key)) milestones.push({ key, emoji: '🚀', title: `New all-time high!`, sub: `Your net worth of $${Math.round(netWorth).toLocaleString()} is your highest ever`, color: '#00d4ff' })
    }
  }

  for (const d of debts) {
    const bal = parseFloat(d.balance) || 0
    const thresholds = [50000, 25000, 10000, 5000, 1000, 500]
    for (const t of thresholds) {
      if (bal <= t && bal > 0) {
        const key = `debt-under-${d.id}-${t}`
        if (!dismissed.includes(key)) milestones.push({ key, emoji: '💪', title: `Debt milestone!`, sub: `${d.name} is now under $${t.toLocaleString()} — keep going!`, color: '#7c3aed' })
        break
      }
    }
  }

  return milestones
}

export default function MilestoneBanner({ transactions = [] }) {
  const [milestones, setMilestones] = useState([])

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [goalsRes, nwRes, snapRes] = await Promise.all([
        supabase.from('savings_goals').select('id,name,icon,target,saved').eq('user_id', user.id),
        supabase.from('net_worth_entries').select('id,type,value').eq('user_id', user.id),
        supabase.from('net_worth_snapshots').select('net,created_at').eq('user_id', user.id).order('created_at'),
      ])

      const entries = nwRes.data || []
      const assets  = entries.filter(e => e.type === 'asset').reduce((s, e) => s + (parseFloat(e.value) || 0), 0)
      const liabs   = entries.filter(e => e.type === 'liability').reduce((s, e) => s + (parseFloat(e.value) || 0), 0)
      const netWorth = assets - liabs

      const [debts, dismissed] = await Promise.all([
        readMigratedFeatureData('savedDebts', 'savedDebts', []),
        readMigratedFeatureData('dismissedMilestones', 'dismissedMilestones', []),
      ])

      const found = detectMilestones({
        goals:          goalsRes.data || [],
        netWorth,
        netWorthHistory: snapRes.data || [],
        debts,
        dismissed,
      })
      setMilestones(found.slice(0, 2))
    }
    check()
  }, [])

  async function dismiss(key) {
    const d = await readMigratedFeatureData('dismissedMilestones', 'dismissedMilestones', [])
    writeMigratedFeatureData('dismissedMilestones', 'dismissedMilestones', [...d, key].slice(-50))
    setMilestones(m => m.filter(x => x.key !== key))
  }

  if (milestones.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {milestones.map(m => (
        <div key={m.key} className="rounded-2xl px-5 py-4 flex items-center gap-4 justify-between"
          style={{ background: `linear-gradient(135deg, ${m.color}18, ${m.color}08)`, border: `1px solid ${m.color}30` }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{m.emoji}</span>
            <div>
              <p className="text-white font-semibold text-sm">{m.title}</p>
              <p className="text-slate-400 text-xs">{m.sub}</p>
            </div>
          </div>
          <button onClick={() => dismiss(m.key)}
            className="text-slate-600 hover:text-slate-400 transition-colors text-xl leading-none shrink-0">×</button>
        </div>
      ))}
    </div>
  )
}
