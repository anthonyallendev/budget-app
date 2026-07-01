export function downloadTransactionsCSV(transactions) {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (AUD)', 'Source']
  const rows = transactions.map(t => [
    t.date,
    t.type,
    t.category || '',
    t.description || t.merchant_name || '',
    parseFloat(t.amount).toFixed(2),
    t.source || 'manual',
  ])

  const escape = val => `"${String(val).replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `retirely-transactions-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
