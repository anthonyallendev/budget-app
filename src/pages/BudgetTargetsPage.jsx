import AppLayout from '../components/AppLayout'
import BudgetRatioPanel from '../components/BudgetRatioPanel'

export default function BudgetTargetsPage() {
  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-1">Budget Targets</h1>
      <p className="text-slate-400 text-sm mb-8">Set your ideal split of income across Needs, Wants and Savings.</p>
      <div className="max-w-2xl">
        <BudgetRatioPanel />
      </div>
    </AppLayout>
  )
}
