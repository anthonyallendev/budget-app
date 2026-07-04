import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import PremiumGate from './PremiumGate'

// Minimal markdown renderer (## headings, - bullets, **bold**) — no HTML injection.
function Bold({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((p, i) => i % 2 === 1
    ? <strong key={i} className="text-white font-semibold">{p}</strong>
    : <span key={i}>{p}</span>)
}

function Markdown({ content }) {
  const lines = content.split('\n')
  const blocks = []
  let bullets = []
  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={blocks.length} className="flex flex-col gap-1.5 my-2 pl-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-slate-300 text-sm leading-relaxed">
              <span className="text-cyan-400 shrink-0">•</span><span><Bold text={b} /></span>
            </li>
          ))}
        </ul>)
      bullets = []
    }
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.startsWith('- ')) { bullets.push(line.slice(2)); continue }
    flush()
    if (!line.trim()) continue
    if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={blocks.length} className="text-gradient font-bold text-base mt-5 mb-1 first:mt-0">
          {line.slice(3)}
        </h3>)
    } else if (line.startsWith('# ')) {
      blocks.push(<h3 key={blocks.length} className="text-gradient font-bold text-lg mt-5 mb-1 first:mt-0">{line.slice(2)}</h3>)
    } else {
      blocks.push(<p key={blocks.length} className="text-slate-300 text-sm leading-relaxed my-1.5"><Bold text={line} /></p>)
    }
  }
  flush()
  return <div>{blocks}</div>
}

function ReportBody() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  const fetchReport = useCallback(async (regenerate) => {
    if (regenerate) setGenerating(true)
    else setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')
      const res = await fetch('/api/ai/monthly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ regenerate: !!regenerate }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to generate report')
      setReport(body)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setGenerating(false)
    }
  }, [])

  useEffect(() => { fetchReport(false) }, [fetchReport])

  const monthLabel = report?.month
    ? new Date(`${report.month}-01`).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
    : ''

  if (loading) {
    return (
      <div className="glass rounded-2xl p-10 text-center" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
        <p className="text-3xl mb-3 animate-pulse">✨</p>
        <p className="text-slate-400 text-sm">Writing your money story… this takes a few seconds.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
        <p className="text-3xl mb-3">✨</p>
        <p className="text-slate-300 text-sm mb-2">Couldn't generate your report</p>
        <p className="text-slate-500 text-xs mb-5 max-w-md mx-auto leading-relaxed">{error}</p>
        <button onClick={() => fetchReport(false)}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6 sm:p-8" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">✨ AI money report</p>
          <h2 className="text-white font-bold text-xl">{monthLabel}</h2>
        </div>
        <button onClick={() => fetchReport(true)} disabled={generating}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
          style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
          {generating ? 'Rewriting…' : '↻ Regenerate'}
        </button>
      </div>
      <Markdown content={report.content} />
      <p className="text-slate-600 text-xs mt-6 pt-4 border-t border-white/5">
        Written by AI from your last 30 days of transactions (vs the 30 before). General information only — not financial advice.
      </p>
    </div>
  )
}

const DEMO = (
  <div className="p-8">
    <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">✨ AI money report</p>
    <h2 className="text-white font-bold text-xl mb-3">Your month at a glance</h2>
    <p className="text-slate-300 text-sm leading-relaxed">
      A solid month, Anthony. Your income of <strong className="text-white">$6,240</strong> comfortably covered
      spending of <strong className="text-white">$4,180</strong>, leaving about <strong className="text-white">$2,060</strong> aside.
      Groceries crept up 12% on last month, mostly from…
    </p>
  </div>
)

export default function AIMoneyReport({ isPremium }) {
  if (!isPremium) {
    return (
      <PremiumGate
        feature="AI money reports"
        description="Once a month, get your finances explained in plain English — where the money went, what changed, and one practical suggestion.">
        {DEMO}
      </PremiumGate>
    )
  }
  return <ReportBody />
}
