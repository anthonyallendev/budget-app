import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin, getUser } from '../_lib/supabase.js'

// Consolidated AI endpoints (Vercel Hobby 12-function limit):
//   POST /api/ai/monthly-report  { regenerate?: boolean }

const REPORT_SYSTEM = `You are the friendly financial insights writer for Retirely, a budgeting app for retirees and people approaching retirement in Australia.

Write a short "monthly money report" from the JSON summary of the user's last 30 days of transactions (with the prior 30 days for comparison).

Rules:
- Plain, warm English a 70-year-old non-expert enjoys reading. No jargon.
- Use markdown: "## " section headings, short paragraphs, "- " bullets, **bold** for key numbers.
- Sections: "## Your month at a glance" (2-3 sentence story), "## Where the money went" (top categories, notable changes vs prior period), "## Things worth a look" (unusual charges, recurring cost creep, anything encouraging), "## One suggestion" (exactly one practical, gentle suggestion).
- All amounts are AUD. Round to whole dollars.
- Never invent numbers not derivable from the data. If data is thin, say so honestly.
- No investment or product recommendations. This is general information, not financial advice — do not add your own disclaimer (the app shows one).
- 250-400 words total.`

function summarise(transactions) {
  const now = Date.now()
  const DAY = 86_400_000
  const inWindow = (t, from, to) => {
    const d = new Date(t.date).getTime()
    return d >= now - from * DAY && d < now - to * DAY
  }
  const window = (from, to) => {
    const txs = transactions.filter(t => inWindow(t, from, to))
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const expenses = txs.filter(t => t.type === 'expense')
    const byCategory = {}
    for (const t of expenses) {
      const c = t.category || 'Other'
      byCategory[c] = (byCategory[c] || 0) + parseFloat(t.amount)
    }
    const totalExpenses = expenses.reduce((s, t) => s + parseFloat(t.amount), 0)
    return {
      income: Math.round(income),
      expenses: Math.round(totalExpenses),
      transactionCount: txs.length,
      byCategory: Object.fromEntries(
        Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 12)
          .map(([c, v]) => [c, Math.round(v)])),
    }
  }

  const recent = transactions.filter(t => inWindow(t, 30, 0) && t.type === 'expense')
  const largest = [...recent]
    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    .slice(0, 5)
    .map(t => ({
      date: t.date,
      amount: Math.round(parseFloat(t.amount)),
      merchant: (t.merchant_name || t.description || 'Unknown').slice(0, 40),
      category: t.category,
    }))

  return { last30Days: window(30, 0), prior30Days: window(60, 30), largestExpenses: largest }
}

async function monthlyReport(req, res, user) {
  const month = new Date().toISOString().slice(0, 7) // 'YYYY-MM'
  const regenerate = req.body?.regenerate === true

  // Server-side premium gate — free accounts can't reach this feature at all
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('subscription_status, full_name')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.subscription_status !== 'premium') {
    return res.status(403).json({ error: 'Premium subscription required' })
  }

  if (!regenerate) {
    const { data: existing } = await supabaseAdmin
      .from('ai_reports')
      .select('content, created_at')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle()
    if (existing) {
      return res.json({ month, content: existing.content, created_at: existing.created_at, cached: true })
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI reports are not configured yet (missing ANTHROPIC_API_KEY).' })
  }

  const sinceDate = new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10)
  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('date, amount, type, category, description, merchant_name')
    .eq('user_id', user.id)
    .gte('date', sinceDate)
    .order('date', { ascending: true })
    .limit(3000)

  const recentCount = (transactions || []).filter(
    t => new Date(t.date).getTime() >= Date.now() - 30 * 86_400_000).length
  if (recentCount < 5) {
    return res.status(422).json({
      error: 'Not enough recent transactions to write a meaningful report yet. Add or sync at least a couple of weeks of activity first.',
    })
  }

  const summary = summarise(transactions)
  const model = 'claude-opus-4-8'
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 2000,
    thinking: { type: 'adaptive' },
    system: REPORT_SYSTEM,
    messages: [{
      role: 'user',
      content: `First name (for a friendly opening, optional): ${profile?.full_name?.split(' ')[0] || 'there'}\n\nTransaction summary JSON:\n${JSON.stringify(summary, null, 2)}`,
    }],
  })

  const content = msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim()
  if (!content) return res.status(502).json({ error: 'The AI did not return a report. Please try again.' })

  await supabaseAdmin.from('ai_reports').upsert(
    { user_id: user.id, month, content, model, created_at: new Date().toISOString() },
    { onConflict: 'user_id,month' },
  )

  res.json({ month, content, created_at: new Date().toISOString(), cached: false })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const user = await getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { action } = req.query
  try {
    if (action === 'monthly-report') return await monthlyReport(req, res, user)
    return res.status(404).json({ error: 'Unknown action' })
  } catch (err) {
    console.error('ai api:', err.message)
    return res.status(500).json({ error: 'Something went wrong generating the report.' })
  }
}
