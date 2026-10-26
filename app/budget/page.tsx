"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import ClientLayout from '@/components/ClientLayout'
import MobileBudgetPage from '@/components/mobile/MobileBudgetPage'
import TransactionDialog, { TransactionFormValues, TransactionPayload } from '@/components/budget/TransactionDialog'
import TransactionLedger from '@/components/budget/TransactionLedger'
import QuickAddBar from '@/components/budget/QuickAddBar'
import SpendingByCategory from '@/components/budget/SpendingByCategory'
import DailySpendingChart from '@/components/budget/DailySpendingChart'
import AccountsTab from '@/components/budget/AccountsTab'
import CategoriesTab from '@/components/budget/CategoriesTab'
import ConfirmDialog from '@/components/budget/ConfirmDialog'
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  PlusIcon,
  ScaleIcon,
  WalletIcon
} from '@/components/icons'
import { Account, BudgetCategory, BudgetTransaction } from '@/types'
import { isNative } from '@/lib/platform'
import {
  addMonths,
  apiDateKey,
  defaultEntryDate,
  formatCurrency,
  formatMonth,
  monthRange,
  startOfMonth
} from '@/lib/budget'

interface TransactionResponse {
  transactions: BudgetTransaction[]
  totalIncome: number
  totalExpense: number
  totalExcluded: number
  net: number
}

type Tab = 'transactions' | 'accounts' | 'categories'

type DialogState =
  | { mode: 'create'; key: number }
  | { mode: 'edit'; key: number; transaction: BudgetTransaction }

const EMPTY_TOTALS = { totalIncome: 0, totalExpense: 0, totalExcluded: 0 }

export default function BudgetPage() {
  const [isNativeApp, setIsNativeApp] = useState(false)
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [tab, setTab] = useState<Tab>('transactions')

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([])
  const [totals, setTotals] = useState(EMPTY_TOTALS)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingTransaction, setDeletingTransaction] = useState<BudgetTransaction | null>(null)
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false)

  const range = useMemo(() => monthRange(month), [month])
  const isCurrentMonth = startOfMonth(new Date()).getTime() === month.getTime()
  const requestIdRef = useRef(0)

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/budget/accounts')
      if (!res.ok) throw new Error()
      setAccounts(await res.json())
    } catch (error) {
      console.error('Error fetching accounts', error)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/budget/categories')
      if (!res.ok) throw new Error()
      setCategories(await res.json())
    } catch (error) {
      console.error('Error fetching categories', error)
    }
  }, [])

  const fetchTransactions = useCallback(async () => {
    // Ignore responses from a month the user already navigated away from
    const requestId = ++requestIdRef.current
    try {
      const res = await fetch(`/api/budget/transactions?from=${range.from}&to=${range.to}`)
      if (!res.ok) throw new Error()
      const data: TransactionResponse = await res.json()
      if (requestId !== requestIdRef.current) return
      setTransactions(data.transactions)
      setTotals({
        totalIncome: data.totalIncome,
        totalExpense: data.totalExpense,
        totalExcluded: data.totalExcluded || 0
      })
    } catch (error) {
      console.error('Error fetching transactions', error)
      if (requestId === requestIdRef.current) toast.error('Failed to load transactions')
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [range.from, range.to])

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchAccounts(), fetchCategories(), fetchTransactions()])
  }, [fetchAccounts, fetchCategories, fetchTransactions])

  useEffect(() => {
    fetchAccounts()
    fetchCategories()
  }, [fetchAccounts, fetchCategories])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    // Wait a bit for Capacitor to initialize before detecting platform
    const timer = setTimeout(() => {
      try {
        setIsNativeApp(isNative())
      } catch (error) {
        console.error('Error detecting native app:', error)
        setIsNativeApp(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const changeMonth = (next: Date) => {
    if (next.getTime() === month.getTime()) return
    setIsRefreshing(true)
    setMonth(next)
  }

  // ------------------------------------------------------------------ transactions

  const createTransaction = async (payload: TransactionPayload) => {
    try {
      const res = await fetch('/api/budget/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error || 'Failed to add transaction')
        return false
      }
      const outsideMonth = payload.transactionDate < range.from || payload.transactionDate > range.to
      toast.success(outsideMonth ? 'Transaction added to another month' : 'Transaction added')
      await Promise.all([fetchAccounts(), fetchTransactions()])
      return true
    } catch (error) {
      console.error('Error creating transaction', error)
      toast.error('Failed to add transaction')
      return false
    }
  }

  const updateTransaction = async (id: string, payload: TransactionPayload) => {
    try {
      const res = await fetch(`/api/budget/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        toast.error('Failed to update transaction')
        return false
      }
      toast.success('Transaction updated')
      await Promise.all([fetchAccounts(), fetchTransactions()])
      return true
    } catch (error) {
      console.error('Error updating transaction', error)
      toast.error('Failed to update transaction')
      return false
    }
  }

  const handleDialogSubmit = async (payload: TransactionPayload) => {
    if (!dialog) return
    setIsSubmitting(true)
    const ok = dialog.mode === 'create'
      ? await createTransaction(payload)
      : await updateTransaction(dialog.transaction.id, payload)
    setIsSubmitting(false)
    if (ok) setDialog(null)
  }

  const confirmDeleteTransaction = async () => {
    if (!deletingTransaction) return
    setIsDeletingTransaction(true)
    try {
      const res = await fetch(`/api/budget/transactions/${deletingTransaction.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Transaction deleted')
      setDeletingTransaction(null)
      await Promise.all([fetchAccounts(), fetchTransactions()])
    } catch (error) {
      console.error('Error deleting transaction', error)
      toast.error('Failed to delete transaction')
    } finally {
      setIsDeletingTransaction(false)
    }
  }

  const openCreate = () => setDialog({ mode: 'create', key: Date.now() })
  const openEdit = (transaction: BudgetTransaction) => setDialog({ mode: 'edit', key: Date.now(), transaction })

  const dialogInitialValues: TransactionFormValues = useMemo(() => {
    if (dialog?.mode === 'edit') {
      const t = dialog.transaction
      return {
        type: t.type,
        accountId: t.accountId,
        toAccountId: t.toAccountId || '',
        categoryId: t.categoryId || '',
        amount: String(t.amount),
        description: t.description || '',
        exclude: t.exclude,
        transactionDate: apiDateKey(t.transactionDate)
      }
    }
    return {
      type: 'expense',
      accountId: accounts[0]?.id ?? '',
      toAccountId: '',
      categoryId: categories.find((c) => c.type === 'expense')?.id ?? '',
      amount: '',
      description: '',
      exclude: false,
      transactionDate: defaultEntryDate(range.from, range.to)
    }
  }, [dialog, accounts, categories, range.from, range.to])

  // ------------------------------------------------------------------ derived

  const net = totals.totalIncome - totals.totalExpense
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
  const savingsRate = totals.totalIncome > 0 ? Math.round((net / totals.totalIncome) * 100) : null
  const needsSetup = !isLoading && (accounts.length === 0 || categories.length === 0)

  // Mobile UI for native app
  if (isNativeApp && !isLoading) {
    return (
      <MobileBudgetPage
        accounts={accounts}
        categories={categories}
        transactions={transactions}
        onTransactionCreate={async () => {
          await Promise.all([fetchAccounts(), fetchTransactions()])
        }}
        onRefresh={async () => {
          await Promise.all([fetchAccounts(), fetchTransactions()])
        }}
      />
    )
  }

  const stats = [
    {
      label: 'Income',
      value: formatCurrency(totals.totalIncome),
      note: `${transactions.filter((t) => t.type === 'income').length} entries`,
      icon: ArrowDownLeftIcon,
      badge: 'bg-emerald-50 text-emerald-600',
      valueClass: 'text-slate-900'
    },
    {
      label: 'Expenses',
      value: formatCurrency(totals.totalExpense),
      note: totals.totalExcluded > 0
        ? `+ ${formatCurrency(totals.totalExcluded)} excluded`
        : `${transactions.filter((t) => t.type === 'expense').length} entries`,
      icon: ArrowUpRightIcon,
      badge: 'bg-rose-50 text-rose-500',
      valueClass: 'text-slate-900'
    },
    {
      label: 'Net cash flow',
      value: `${net > 0 ? '+' : net < 0 ? '−' : ''}${formatCurrency(Math.abs(net))}`,
      note: savingsRate !== null
        ? `${Math.abs(savingsRate)}% of income ${savingsRate >= 0 ? 'saved' : 'overspent'}`
        : 'No income yet',
      icon: ScaleIcon,
      badge: net >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500',
      valueClass: net > 0 ? 'text-emerald-600' : net < 0 ? 'text-rose-600' : 'text-slate-900'
    },
    {
      label: 'Total balance',
      value: formatCurrency(totalBalance),
      note: `Across ${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'}`,
      icon: WalletIcon,
      badge: 'bg-brand-50 text-brand-600',
      valueClass: totalBalance < 0 ? 'text-rose-600' : 'text-slate-900'
    }
  ]

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'transactions', label: 'Transactions', count: transactions.length },
    { id: 'accounts', label: 'Accounts', count: accounts.length },
    { id: 'categories', label: 'Categories', count: categories.length }
  ]

  return (
    <ClientLayout>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="page-title">Budget</h1>
            <p className="page-subtitle">Track cash flow, balances, and spending by month.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
              <button type="button" onClick={() => changeMonth(addMonths(month, -1))} className="icon-btn" aria-label="Previous month">
                <ChevronLeftIcon />
              </button>
              <span className="min-w-36 px-2 text-center text-sm font-semibold text-slate-900">{formatMonth(month)}</span>
              <button type="button" onClick={() => changeMonth(addMonths(month, 1))} className="icon-btn" aria-label="Next month">
                <ChevronRightIcon />
              </button>
            </div>
            {!isCurrentMonth && (
              <button type="button" onClick={() => changeMonth(startOfMonth(new Date()))} className="btn-secondary px-3 py-2">
                This month
              </button>
            )}
            <button type="button" onClick={openCreate} disabled={accounts.length === 0} className="btn-primary py-2">
              <PlusIcon width={16} height={16} />
              Add transaction
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-6 border-b border-slate-200" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors ${
                tab === t.id ? 'border-brand-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
              <span className={`badge ${tab === t.id ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {needsSetup && (
          <div className="card mb-6 flex flex-col gap-3 border-brand-100 bg-brand-50/60 p-4 sm:flex-row sm:items-center">
            <InfoIcon width={18} height={18} className="shrink-0 text-brand-600" />
            <p className="flex-1 text-sm text-slate-700">
              {accounts.length === 0
                ? 'Add at least one account (cash, bank, or e-wallet) before recording transactions.'
                : 'Add income and expense categories so transactions can be classified.'}
            </p>
            <button
              type="button"
              onClick={() => setTab(accounts.length === 0 ? 'accounts' : 'categories')}
              className="btn-primary py-2"
            >
              {accounts.length === 0 ? 'Add account' : 'Add categories'}
            </button>
          </div>
        )}

        <div className={`transition-opacity ${isRefreshing ? 'opacity-60' : ''}`}>
          {tab === 'transactions' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((s) => {
                  const Icon = s.icon
                  return (
                    <div key={s.label} className="card p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`grid h-7 w-7 place-items-center rounded-full ${s.badge}`}>
                          <Icon width={14} height={14} strokeWidth={2.2} />
                        </span>
                        <p className="text-xs font-medium text-slate-500">{s.label}</p>
                      </div>
                      {isLoading ? (
                        <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-100" />
                      ) : (
                        <p className={`truncate text-2xl font-bold tracking-tight ${s.valueClass}`}>{s.value}</p>
                      )}
                      <p className="mt-1 h-4 truncate text-xs text-slate-500">{isLoading ? '' : s.note}</p>
                    </div>
                  )
                })}
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Ledger */}
                <div className="card lg:col-span-2">
                  <div className="px-5 pt-5">
                    <h2 className="text-sm font-semibold text-slate-900">Transactions</h2>
                    <p className="text-xs text-slate-500">{formatMonth(month)}</p>
                  </div>
                  {accounts.length > 0 && categories.length > 0 && (
                    <div className="px-5 pt-4">
                      <QuickAddBar
                        accounts={accounts}
                        categories={categories}
                        entryDate={defaultEntryDate(range.from, range.to)}
                        onCreate={createTransaction}
                      />
                    </div>
                  )}
                  {isLoading ? (
                    <div className="space-y-3 p-5">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                      ))}
                    </div>
                  ) : (
                    <TransactionLedger
                      transactions={transactions}
                      accounts={accounts}
                      categories={categories}
                      onEdit={openEdit}
                      onDelete={setDeletingTransaction}
                    />
                  )}
                </div>

                {/* Insights */}
                <div className="space-y-6">
                  <DailySpendingChart transactions={transactions} days={range.days} />
                  <SpendingByCategory transactions={transactions} />
                </div>
              </div>
            </div>
          )}

          {tab === 'accounts' && (
            <AccountsTab accounts={accounts} transactions={transactions} onChanged={refreshAll} />
          )}

          {tab === 'categories' && (
            <CategoriesTab categories={categories} transactions={transactions} onChanged={refreshAll} />
          )}
        </div>
      </div>

      <TransactionDialog
        key={dialog?.key ?? 'closed'}
        isOpen={dialog !== null}
        mode={dialog?.mode ?? 'create'}
        initialValues={dialogInitialValues}
        accounts={accounts}
        categories={categories}
        isSubmitting={isSubmitting}
        onClose={() => setDialog(null)}
        onSubmit={handleDialogSubmit}
      />

      <ConfirmDialog
        isOpen={deletingTransaction !== null}
        title="Delete transaction"
        isConfirming={isDeletingTransaction}
        onConfirm={confirmDeleteTransaction}
        onClose={() => setDeletingTransaction(null)}
      >
        {deletingTransaction && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              {deletingTransaction.type === 'transfer'
                ? `${deletingTransaction.account?.name ?? 'Account'} → ${deletingTransaction.toAccount?.name ?? 'Account'}`
                : `${deletingTransaction.category?.name ?? 'Uncategorized'} · ${deletingTransaction.account?.name ?? 'Account'}`}
            </p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(Number(deletingTransaction.amount))}</p>
            {deletingTransaction.description && <p className="text-xs text-slate-500">{deletingTransaction.description}</p>}
          </div>
        )}
        <p className="text-xs text-slate-500">The account balance will be restored automatically.</p>
      </ConfirmDialog>
    </ClientLayout>
  )
}
