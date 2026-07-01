import { Link } from 'react-router-dom'
import { getBills, daysUntilBill, nextDueDate } from '../pages/BillsPage'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function UpcomingBillsWidget() {
  const bills = getBills()
  const upcoming = bills
    .map(b => ({ ...b, days: daysUntilBill(b), next: nextDueDate(b) }))
    .filter(b => b.days !== null && b.days <= 14)
    .sort((a, b) => a.days - b.days)

  if (bills.length === 0) return null

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Upcoming bills</h2>
        <Link to="/bills" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">
          View all →
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-slate-600 text-sm">No bills due in the next 14 days. 🎉</p>
      ) : (
        <div className="flex flex-col gap-2">
          {upcoming.map(bill => (
            <div key={bill.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0"
                  style={{ background: bill.days <= 3 ? 'rgba(224,64,251,0.12)' : 'rgba(255,255,255,0.04)' }}>
                  <span className="text-xs font-bold leading-none" style={{ color: bill.days <= 3 ? '#e040fb' : '#00d4ff' }}>
                    {bill.next?.getDate()}
                  </span>
                  <span className="text-xs text-slate-600 leading-none">{MONTHS[bill.next?.getMonth()]}</span>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{bill.name}</p>
                  <p className="text-xs text-slate-600">{bill.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">${parseFloat(bill.amount).toFixed(2)}</p>
                <p className="text-xs" style={{ color: bill.days === 0 ? '#e040fb' : bill.days <= 3 ? '#f59e0b' : '#475569' }}>
                  {bill.days === 0 ? 'Today!' : bill.days === 1 ? 'Tomorrow' : `${bill.days} days`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
