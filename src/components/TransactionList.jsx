export default function TransactionList({ transactions, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
        <div className="text-3xl mb-3">📋</div>
        <p className="text-slate-400 text-sm">No transactions yet. Add one above.</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-white font-semibold">Transactions</h2>
        <span className="text-slate-500 text-sm">{transactions.length} total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {['Date', 'Type', 'Category', 'Description', 'Amount', ''].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs text-slate-500 uppercase tracking-wider font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => (
              <tr
                key={tx.id}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                  {new Date(tx.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-4">
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                    style={tx.type === 'income'
                      ? { background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }
                      : { background: 'rgba(224,64,251,0.1)', color: '#e040fb' }
                    }
                  >
                    {tx.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-300">{tx.category}</td>
                <td className="px-6 py-4 text-slate-500">{tx.description || '—'}</td>
                <td className="px-6 py-4 font-semibold whitespace-nowrap"
                  style={{ color: tx.type === 'income' ? '#00d4ff' : '#e040fb' }}>
                  {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onDelete(tx.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none"
                    title="Delete"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
