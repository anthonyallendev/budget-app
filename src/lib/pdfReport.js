function fmt(n) {
  if (n == null) return '—'
  const abs = Math.abs(n)
  const neg = n < 0
  let s
  if (abs >= 1_000_000) s = `$${(abs / 1_000_000).toFixed(2)}M`
  else if (abs >= 1_000) s = `$${(abs / 1_000).toFixed(1)}k`
  else s = `$${abs.toFixed(2)}`
  return neg ? `-${s}` : s
}

function pct(n) {
  if (n == null) return '—'
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

export function openFinancialSummaryPDF({ monthlyData, categoryData, profile, netWorth, healthScore, goals }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const name = profile?.full_name || 'User'
  const retirementAge = profile?.retirement_age ?? '—'

  const totalIncome  = monthlyData.reduce((s, m) => s + m.income,   0)
  const totalExpense = monthlyData.reduce((s, m) => s + m.expenses, 0)
  const totalSavings = totalIncome - totalExpense
  const avgSavingsRate = totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : '0.0'

  const monthRows = monthlyData.map(m => `
    <tr>
      <td>${m.label}</td>
      <td class="num green">${fmt(m.income)}</td>
      <td class="num red">${fmt(m.expenses)}</td>
      <td class="num ${m.savings >= 0 ? 'green' : 'red'}">${fmt(m.savings)}</td>
      <td class="num">${m.income > 0 ? pct((m.savings / m.income) * 100) : '—'}</td>
    </tr>`).join('')

  const catRows = (categoryData || []).slice(0, 8).map(c => `
    <tr>
      <td>${c.category}</td>
      <td class="num red">${fmt(c.total)}</td>
      <td class="num">${c.pct.toFixed(1)}%</td>
    </tr>`).join('')

  const goalRows = (goals || []).map(g => {
    const progress = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100).toFixed(0) : 0
    return `<tr>
      <td>${g.icon || ''} ${g.name}</td>
      <td class="num green">${fmt(g.saved)}</td>
      <td class="num">${fmt(g.target)}</td>
      <td class="num">${progress}%</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Retirely — Financial Summary</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1e293b; background: #fff; padding: 40px; }
  h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 13px; margin-bottom: 32px; }
  .accent { color: #0ea5e9; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
  .kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 4px; }
  .kpi-value { font-size: 20px; font-weight: 800; color: #0f172a; }
  .kpi-value.green { color: #059669; }
  .kpi-value.blue  { color: #0ea5e9; }
  .kpi-value.red   { color: #dc2626; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  th { background: #f1f5f9; color: #475569; font-weight: 600; text-align: left; padding: 7px 10px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) { background: #fafafa; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .green { color: #059669; }
  .red   { color: #dc2626; }
  .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 10px; display: flex; justify-content: space-between; }
  @media print {
    body { padding: 24px; }
    .kpi-grid { break-inside: avoid; }
    table { break-inside: auto; }
    tr { break-inside: avoid; }
  }
</style>
</head>
<body>

<h1><span class="accent">Retirely</span> Financial Summary</h1>
<p class="subtitle">Prepared for ${name} &nbsp;·&nbsp; ${dateStr}</p>

<div class="kpi-grid">
  <div class="kpi">
    <div class="kpi-label">12-month income</div>
    <div class="kpi-value green">${fmt(totalIncome)}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">12-month expenses</div>
    <div class="kpi-value red">${fmt(totalExpense)}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">12-month savings</div>
    <div class="kpi-value ${totalSavings >= 0 ? 'green' : 'red'}">${fmt(totalSavings)}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Avg savings rate</div>
    <div class="kpi-value blue">${avgSavingsRate}%</div>
  </div>
</div>

<div class="kpi-grid">
  <div class="kpi">
    <div class="kpi-label">Net worth</div>
    <div class="kpi-value ${netWorth >= 0 ? 'blue' : 'red'}">${fmt(netWorth)}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Financial health</div>
    <div class="kpi-value blue">${healthScore ?? '—'}/100</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Projected retirement</div>
    <div class="kpi-value blue">Age ${retirementAge}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Savings goals</div>
    <div class="kpi-value blue">${(goals || []).length} active</div>
  </div>
</div>

<div class="section">
  <div class="section-title">12-Month Income vs Expenses</div>
  <table>
    <thead><tr><th>Month</th><th class="num">Income</th><th class="num">Expenses</th><th class="num">Net</th><th class="num">Savings rate</th></tr></thead>
    <tbody>${monthRows || '<tr><td colspan="5" style="color:#94a3b8;text-align:center;padding:20px">No transaction data</td></tr>'}</tbody>
  </table>
</div>

${catRows ? `
<div class="section">
  <div class="section-title">Top Spending Categories (12 months)</div>
  <table>
    <thead><tr><th>Category</th><th class="num">Total</th><th class="num">% of spending</th></tr></thead>
    <tbody>${catRows}</tbody>
  </table>
</div>` : ''}

${goalRows ? `
<div class="section">
  <div class="section-title">Savings Goals</div>
  <table>
    <thead><tr><th>Goal</th><th class="num">Saved</th><th class="num">Target</th><th class="num">Progress</th></tr></thead>
    <tbody>${goalRows}</tbody>
  </table>
</div>` : ''}

<div class="footer">
  <span>Generated by Retirely · retirely.money</span>
  <span>This report is for personal use only and does not constitute financial advice.</span>
</div>

</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.addEventListener('load', () => {
    setTimeout(() => win.print(), 300)
  })
}
