import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'
import PlaidLinkButton from '../components/PlaidLinkButton'
import { useTransactions } from '../hooks/useTransactions'
import { supabase } from '../lib/supabase'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

export default function TransactionsPage() {
  const { transactions, loading, addTransaction, deleteTransaction, refresh } = useTransactions()
  const [syncing,  setSyncing]  = useState(false)
  const [syncMsg,  setSyncMsg]  = useState(null)
  const [showForm, setShowForm] = useState(false)

  const plaidCount = transactions.filter(t => t.source === 'plaid').length

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res  = await fetch('/api/plaid/sync', { method: 'POST', headers: await authHeaders() })
      const data = await res.json()
      setSyncMsg(data.synced > 0 ? `${data.synced} new transactions imported` : 'Already up to date')
      await refresh()
    } catch {
      setSyncMsg('Sync failed — please try again')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 4000)
    }
  }

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">Transactions</h1>
          <p className="text-slate-400 text-sm">Add manually or import directly from your bank.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sync button — shown once at least one Plaid connection exists */}
          {plaidCount > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-400 glass transition-colors disabled:opacity-50"
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
                className={syncing ? 'animate-spin' : ''}>
                <path d="M4 4a8 8 0 0 1 12 0" strokeLinecap="round" />
                <path d="M16 16a8 8 0 0 1-12 0" strokeLinecap="round" />
                <path d="M4 4l-2 2 2 2M16 16l2-2-2-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {syncing ? 'Syncing…' : 'Sync bank'}
            </button>
          )}
          <button
            onClick={() => setShowForm(f => !f)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white glass transition-colors"
          >
            {showForm ? 'Hide form' : '+ Add manual'}
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="mb-6 glass rounded-xl px-5 py-3 text-sm"
          style={{ borderColor: 'rgba(0,212,255,0.2)', color: '#00d4ff' }}>
          {syncMsg}
        </div>
      )}

      <div className="flex flex-col gap-6">

        {/* Connect bank card — always visible at the top */}
        <div className="glass rounded-2xl p-7 flex flex-col sm:flex-row items-center gap-6"
          style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
          <div className="flex-1">
            <p className="text-white font-semibold mb-1">
              {plaidCount > 0 ? 'Add another bank account' : 'Connect your bank'}
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              {plaidCount > 0
                ? `${plaidCount} transactions imported so far. Connect another account or hit Sync to pull in the latest.`
                : 'Import transactions automatically from your bank. Works with thousands of banks in the US, UK and Canada.'}
            </p>
          </div>
          <PlaidLinkButton onSuccess={async () => { await refresh() }} />
        </div>

        {/* Manual entry form — toggled */}
        {showForm && (
          <TransactionForm onAdd={async (tx) => { await addTransaction(tx); setShowForm(false) }} />
        )}

        {/* Transaction list */}
        {loading
          ? <div className="glass rounded-2xl p-10 text-center text-slate-600 text-sm">Loading…</div>
          : <TransactionList transactions={transactions} onDelete={deleteTransaction} />
        }
      </div>
    </AppLayout>
  )
}
