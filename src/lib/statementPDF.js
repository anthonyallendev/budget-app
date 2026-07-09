import { readMigratedFeatureData, writeMigratedFeatureData } from '../hooks/useMigratedFeatureData'

async function logStatementDownload(key) {
  const log = await readMigratedFeatureData('statementDownloads', 'statementDownloads', {})
  log[key] = new Date().toISOString()
  await writeMigratedFeatureData('statementDownloads', 'statementDownloads', log)
}

function fmt(n, always = false) {
  if (n == null && !always) return '—'
  const abs = Math.abs(n || 0)
  const neg = n < 0
  let s
  if (abs >= 1_000_000) s = `$${(abs / 1_000_000).toFixed(2)}M`
  else if (abs >= 1_000) s = `$${(abs / 1_000).toFixed(2)}k`
  else s = `$${abs.toFixed(2)}`
  return neg ? `-${s}` : s
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11.5px; color: #1e293b; background: #fff; }
  .page { padding: 36px 44px; max-width: 900px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid #0ea5e9; margin-bottom: 22px; }
  .brand { font-size: 22px; font-weight: 900; color: #0ea5e9; letter-spacing: -0.5px; }
  .brand span { color: #7c3aed; }
  .header-right { text-align: right; color: #64748b; font-size: 11px; line-height: 1.7; }
  .statement-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
  .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 22px; }
  .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 11px 14px; }
  .kpi-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; margin-bottom: 3px; }
  .kpi-value { font-size: 17px; font-weight: 800; }
  .kpi-value.green { color: #059669; }
  .kpi-value.red   { color: #dc2626; }
  .kpi-value.blue  { color: #0ea5e9; }
  .kpi-value.purple { color: #7c3aed; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; margin-top: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f1f5f9; color: #475569; font-weight: 600; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
  td { padding: 6px 8px; border-bottom: 1px solid #f8fafc; color: #334155; vertical-align: top; }
  tr:nth-child(even) td { background: #fafbff; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .income-amt { color: #059669; font-weight: 600; }
  .expense-amt { color: #dc2626; }
  .savings-amt { color: #7c3aed; font-weight: 600; }
  .bar-wrap { background: #e2e8f0; border-radius: 3px; height: 5px; overflow: hidden; margin-top: 3px; }
  .bar-fill { height: 5px; border-radius: 3px; background: linear-gradient(90deg, #7c3aed, #e040fb); }
  .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 9.5px; display: flex; justify-content: space-between; }
  .badge { display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 2px 6px; border-radius: 4px; }
  .badge-income  { background: #dcfce7; color: #15803d; }
  .badge-expense { background: #fee2e2; color: #b91c1c; }
  .badge-savings { background: #ede9fe; color: #6d28d9; }
  @media print {
    .page { padding: 20px 28px; }
    table { break-inside: auto; }
    tr { break-inside: avoid; }
    .kpi-row { break-inside: avoid; }
  }
`

function openPrintWindow(html) {
  const win = window.open('', '_blank')
  if (!win) { alert('Please allow pop-ups to download statements.'); return }
  win.document.write(html)
  win.document.close()
  win.addEventListener('load', () => setTimeout(() => win.print(), 300))
}

// ── Monthly statement ─────────────────────────────────────────────────────────

export function generateMonthlyStatement(transactions, year, month, profile) {
  const startDate = new Date(year, month, 1)
  const endDate   = new Date(year, month + 1, 0, 23, 59, 59)
  const monthLabel = startDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
  const name = profile?.full_name || 'Member'
  const generatedAt = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  const monthTx = transactions
    .filter(t => { const d = new Date(t.date); return d >= startDate && d <= endDate })
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const income   = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
  const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  const savings  = income - expenses
  const savRate  = income > 0 ? ((savings / income) * 100).toFixed(1) : '0.0'

  // Category breakdown
  const catMap = {}
  monthTx.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + parseFloat(t.amount)
  })
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1])

  const txRows = monthTx.map(t => {
    const isIncome = t.type === 'income'
    const isSavings = t.type === 'savings'
    const amtClass = isIncome ? 'income-amt' : isSavings ? 'savings-amt' : 'expense-amt'
    const sign = isIncome ? '+' : isSavings ? '' : '-'
    const badge = isIncome ? 'badge-income' : isSavings ? 'badge-savings' : 'badge-expense'
    return `<tr>
      <td>${fmtDate(t.date)}</td>
      <td>${t.description || t.merchant_name || '—'}</td>
      <td>${t.category || '—'}</td>
      <td class="num"><span class="badge ${badge}">${t.type}</span></td>
      <td class="num ${amtClass}">${sign}${fmt(parseFloat(t.amount))}</td>
    </tr>`
  }).join('')

  const catRows = cats.map(([cat, total]) => {
    const pct = expenses > 0 ? (total / expenses) * 100 : 0
    return `<tr>
      <td>${cat}</td>
      <td class="num expense-amt">${fmt(total)}</td>
      <td class="num">${pct.toFixed(1)}%</td>
      <td style="width:120px"><div class="bar-wrap"><div class="bar-fill" style="width:${pct}%"></div></div></td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
  <title>Retirely — ${monthLabel} Statement</title>
  <style>${STYLES}</style></head><body><div class="page">

  <div class="header">
    <div>
      <div class="brand">Retir<span>ely</span></div>
      <div class="statement-title">${monthLabel} Statement</div>
    </div>
    <div class="header-right">
      <div><strong>${name}</strong></div>
      <div>Generated: ${generatedAt}</div>
      <div>Period: ${fmtDate(startDate)} – ${fmtDate(endDate)}</div>
      <div style="margin-top:4px;font-size:10px;color:#0ea5e9">retirely.money</div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi"><div class="kpi-label">Total income</div><div class="kpi-value green">${fmt(income)}</div></div>
    <div class="kpi"><div class="kpi-label">Total expenses</div><div class="kpi-value red">${fmt(expenses)}</div></div>
    <div class="kpi"><div class="kpi-label">Net savings</div><div class="kpi-value ${savings >= 0 ? 'purple' : 'red'}">${fmt(savings)}</div></div>
    <div class="kpi"><div class="kpi-label">Savings rate</div><div class="kpi-value blue">${savRate}%</div></div>
  </div>

  ${monthTx.length > 0 ? `
  <div class="section-title">Transactions (${monthTx.length})</div>
  <table>
    <thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="num">Type</th><th class="num">Amount</th></tr></thead>
    <tbody>${txRows}</tbody>
  </table>` : '<p style="color:#94a3b8;margin:20px 0">No transactions recorded for this period.</p>'}

  ${cats.length > 0 ? `
  <div class="section-title">Spending by category</div>
  <table>
    <thead><tr><th>Category</th><th class="num">Amount</th><th class="num">% of spending</th><th></th></tr></thead>
    <tbody>${catRows}</tbody>
  </table>` : ''}

  <div class="footer">
    <span>Retirely · retirely.money · ${monthLabel} Statement for ${name}</span>
    <span>For personal use only. Not financial advice.</span>
  </div>
  </div></body></html>`

  openPrintWindow(html)

  logStatementDownload(`${year}-${String(month + 1).padStart(2, '0')}`)
}

// ── Annual (Financial Year) statement ────────────────────────────────────────

export function generateAnnualStatement(transactions, fyKey, fyLabel, startDate, endDate, profile) {
  const name = profile?.full_name || 'Member'
  const generatedAt = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  const fyTx = transactions.filter(t => {
    const d = new Date(t.date)
    return d >= startDate && d <= endDate
  })

  const income   = fyTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
  const expenses = fyTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  const savings  = income - expenses
  const savRate  = income > 0 ? ((savings / income) * 100).toFixed(1) : '0.0'

  // Month-by-month breakdown
  const months = []
  let d = new Date(startDate)
  while (d <= endDate) {
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const mEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const label  = d.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
    const mTx    = fyTx.filter(t => { const td = new Date(t.date); return td >= mStart && td <= mEnd })
    const mInc   = mTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const mExp   = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    const mSav   = mInc - mExp
    months.push({ label, income: mInc, expenses: mExp, savings: mSav, count: mTx.length })
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  }

  // Category breakdown
  const catMap = {}
  fyTx.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + parseFloat(t.amount)
  })
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 10)

  const monthRows = months.map(m => `
    <tr>
      <td>${m.label}</td>
      <td class="num income-amt">${m.income > 0 ? fmt(m.income) : '—'}</td>
      <td class="num expense-amt">${m.expenses > 0 ? fmt(m.expenses) : '—'}</td>
      <td class="num ${m.savings >= 0 ? 'savings-amt' : 'expense-amt'}">${fmt(m.savings)}</td>
      <td class="num">${m.income > 0 ? ((m.savings / m.income) * 100).toFixed(1) + '%' : '—'}</td>
      <td class="num" style="color:#94a3b8">${m.count}</td>
    </tr>`).join('')

  const catRows = cats.map(([cat, total]) => {
    const pct = expenses > 0 ? (total / expenses) * 100 : 0
    return `<tr>
      <td>${cat}</td>
      <td class="num expense-amt">${fmt(total)}</td>
      <td class="num">${pct.toFixed(1)}%</td>
      <td style="width:140px"><div class="bar-wrap"><div class="bar-fill" style="width:${pct}%"></div></div></td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
  <title>Retirely — ${fyLabel} Annual Statement</title>
  <style>${STYLES}</style></head><body><div class="page">

  <div class="header">
    <div>
      <div class="brand">Retir<span>ely</span></div>
      <div class="statement-title">Annual Financial Statement — ${fyLabel}</div>
    </div>
    <div class="header-right">
      <div><strong>${name}</strong></div>
      <div>Generated: ${generatedAt}</div>
      <div>Period: ${fmtDate(startDate)} – ${fmtDate(endDate)}</div>
      <div style="margin-top:4px;font-size:10px;color:#0ea5e9">retirely.money</div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi"><div class="kpi-label">Annual income</div><div class="kpi-value green">${fmt(income)}</div></div>
    <div class="kpi"><div class="kpi-label">Annual expenses</div><div class="kpi-value red">${fmt(expenses)}</div></div>
    <div class="kpi"><div class="kpi-label">Annual savings</div><div class="kpi-value ${savings >= 0 ? 'purple' : 'red'}">${fmt(savings)}</div></div>
    <div class="kpi"><div class="kpi-label">Avg savings rate</div><div class="kpi-value blue">${savRate}%</div></div>
  </div>

  <div class="section-title">Month-by-month breakdown</div>
  <table>
    <thead><tr><th>Month</th><th class="num">Income</th><th class="num">Expenses</th><th class="num">Net</th><th class="num">Savings rate</th><th class="num">Transactions</th></tr></thead>
    <tbody>
      ${monthRows}
      <tr style="font-weight:700;border-top:2px solid #e2e8f0">
        <td><strong>Total</strong></td>
        <td class="num income-amt">${fmt(income)}</td>
        <td class="num expense-amt">${fmt(expenses)}</td>
        <td class="num ${savings >= 0 ? 'savings-amt' : 'expense-amt'}">${fmt(savings)}</td>
        <td class="num">${savRate}%</td>
        <td class="num" style="color:#94a3b8">${fyTx.length}</td>
      </tr>
    </tbody>
  </table>

  ${cats.length > 0 ? `
  <div class="section-title">Top spending categories</div>
  <table>
    <thead><tr><th>Category</th><th class="num">Annual total</th><th class="num">% of spending</th><th></th></tr></thead>
    <tbody>${catRows}</tbody>
  </table>` : ''}

  <div class="footer">
    <span>Retirely · retirely.money · ${fyLabel} Annual Statement for ${name}</span>
    <span>For personal use only. Not financial advice.</span>
  </div>
  </div></body></html>`

  openPrintWindow(html)

  logStatementDownload(fyKey)
}

// ── Period helpers ────────────────────────────────────────────────────────────

export function getAvailableMonths(earliestTxDate) {
  const now = new Date()
  const earliest = earliestTxDate
    ? new Date(Math.min(new Date(earliestTxDate), new Date(now.getFullYear() - 2, now.getMonth(), 1)))
    : new Date(now.getFullYear() - 2, now.getMonth(), 1)

  const months = []
  // Start from the last completed month (not current)
  let d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  while (d >= new Date(earliest.getFullYear(), earliest.getMonth(), 1)) {
    months.push({
      year:  d.getFullYear(),
      month: d.getMonth(),
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }),
      shortLabel: d.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
    })
    d = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  }
  return months
}

export function getAvailableFinancialYears() {
  const now = new Date()
  // AU financial year: Jul 1 – Jun 30
  // Current FY is not complete unless today is after Jun 30
  // If month >= 6 (July+), current FY started this year. Prior FY is complete.
  // If month < 6 (Jan-Jun), FY started last year. The FY that ended Jun 30 last year is complete.
  const completedFyEndYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1

  const years = []
  for (let i = 0; i < 3; i++) {
    const endYear   = completedFyEndYear - i
    const startYear = endYear - 1
    if (startYear < 2020) break
    years.push({
      key:       `FY${startYear}-${endYear}`,
      label:     `FY ${startYear}–${endYear}`,
      startDate: new Date(startYear, 6, 1),
      endDate:   new Date(endYear, 5, 30, 23, 59, 59),
    })
  }
  return years
}
