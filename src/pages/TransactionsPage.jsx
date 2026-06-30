import AppLayout from '../components/AppLayout'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'
import { useTransactions } from '../hooks/useTransactions'

export default function TransactionsPage() {
  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions()

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-1">Transactions</h1>
      <p className="text-slate-400 text-sm mb-8">Add and manage your income, expenses and savings.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        <TransactionForm onAdd={addTransaction} />
        {loading
          ? <div className="glass rounded-2xl p-10 text-center text-slate-600 text-sm">Loading…</div>
          : <TransactionList transactions={transactions} onDelete={deleteTransaction} />
        }
      </div>
    </AppLayout>
  )
}
