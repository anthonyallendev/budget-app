import AppLayout from '../components/AppLayout'
import BudgetLimitsPanel from '../components/BudgetLimitsPanel'
import { useTransactions } from '../hooks/useTransactions'

export default function BudgetLimitsPage() {
  const { transactions } = useTransactions()

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-1">Budget Limits</h1>
      <p className="text-slate-400 text-sm mb-8">Set monthly spending caps per category and track your progress.</p>
      <div className="max-w-2xl">
        <BudgetLimitsPanel transactions={transactions} />
      </div>
    </AppLayout>
  )
}
