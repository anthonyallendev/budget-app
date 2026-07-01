import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'
import PlaidLinkButton from '../components/PlaidLinkButton'
import BasiqLinkButton from '../components/BasiqLinkButton'
import { useTransactions } from '../hooks/useTransactions'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import RecurringTransactions from '../components/RecurringTransactions'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

const inputBase = {
  background: 'rgba(6,11,26,0.8)',
  border: '1px solid rgba(0,212,255,0.18)',
}

export default function TransactionsPage() {
  const { transactions, loading, addTransaction, deleteTransaction, refresh } = useTransactions()
  const { profile } = useProfile()
  const isPremium = profile?.subscription_status === 'premium'
  const [syncing,    setSyncing]    = useState(false)
  const [syncMsg,    setSyncMsg]    = useState(null)
  const [showForm,   setShowForm]   = useState(false)
  const [search,     setSearch]     = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterCat,  setFilterCat]  = useState('all')

  const categories = ['all', ...Array.from(new Set(transactions.map(t => t.category))).sort()]

  const filtered = transactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false
    if (filterCat  !== 'all' && tx.category !== filterCat) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (tx.description || '').toLowerCase().includes(q) ||
             (tx.category    || '').toLowerCase().includes(q)
    }
    return true
  })

  const plaidCount = transactions.filter(t => t.source === 'plaid').length
  const basiqCount = transactions.filter(t => t.source === 'basiq').length

  async function handleSync(source = 'plaid') {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const endpoint = source === 'basiq' ? '/api/basiq/sync' : '/api/plaid/sync'
      const res  = await fetch(endpoint, { method: 'POST', headers: await authHeaders() })
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

  // Auto-sync after returning from Basiq Connect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('basiq') === 'connected') {
      window.history.replaceState({}, '', '/transactions')
      handleSync('basiq')
    }
  }, [])

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-1">Transactions</h1>
          <p className="text-slate-400 text-sm">Add manually or import directly from your bank.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sync button — shown once at least one bank connection exists */}
          {(plaidCount > 0 || basiqCount > 0) && (
            <button
              onClick={() => handleSync(basiqCount > 0 ? 'basiq' : 'plaid')}
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

        {/* Connect bank cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Plaid — US / UK / CA */}
          <div className="glass rounded-2xl p-6 flex flex-col gap-4"
            style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
            <div>
              <p className="text-white font-semibold mb-1">
                {plaidCount > 0 ? 'Add another US/UK/CA account' : 'Connect your bank'}
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                {plaidCount > 0
                  ? `${plaidCount} transactions imported. Connect another or hit Sync.`
                  : 'Works with thousands of banks in the US, UK, and Canada.'}
              </p>
            </div>
            <PlaidLinkButton isPremium={isPremium} onSuccess={async () => { await refresh() }} />
          </div>

          {/* Basiq — Australia */}
          <div className="glass rounded-2xl p-6 flex flex-col gap-4"
            style={{ borderColor: 'rgba(168,85,247,0.15)' }}>
            <div>
              <p className="text-white font-semibold mb-1">
                {basiqCount > 0 ? 'Add another Australian account' : 'Connect Australian bank'}
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                {basiqCount > 0
                  ? `${basiqCount} transactions imported. Connect another or hit Sync.`
                  : 'Works with 100+ Australian banks via open banking.'}
              </p>
            </div>
            <BasiqLinkButton isPremium={isPremium} />
          </div>
        </div>

        {/* Manual entry form — toggled */}
        {showForm && (
          <TransactionForm onAdd={async (tx) => { await addTransaction(tx); setShowForm(false) }} />
        )}

        {/* Search & filter bar */}
        {!loading && transactions.length > 0 && (
          <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
            <input
              type="text"
              placeholder="Search description or category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-white text-sm outline-none"
              style={inputBase}
            />
            <div className="flex gap-2 flex-wrap">
              {['all', 'income', 'expense'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                  style={filterType === t
                    ? { background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#64748b' }}
                >
                  {t}
                </button>
              ))}
            </div>
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ ...inputBase, colorScheme: 'dark', color: filterCat === 'all' ? '#64748b' : '#fff' }}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
              ))}
            </select>
            {(search || filterType !== 'all' || filterCat !== 'all') && (
              <button
                onClick={() => { setSearch(''); setFilterType('all'); setFilterCat('all') }}
                className="text-xs text-slate-500 hover:text-white transition-colors whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Recurring transactions */}
        {!loading && <RecurringTransactions transactions={transactions} />}

        {/* Transaction list */}
        {loading
          ? <div className="glass rounded-2xl p-10 text-center text-slate-600 text-sm">Loading…</div>
          : <TransactionList transactions={filtered} total={transactions.length} onDelete={deleteTransaction} />
        }
      </div>
    </AppLayout>
  )
}
