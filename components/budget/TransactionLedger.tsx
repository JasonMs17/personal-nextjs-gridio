'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CloseIcon,
  PencilIcon,
  TransferIcon,
  TrashIcon,
  WalletIcon
} from '@/components/icons'
import { Account, BudgetCategory, BudgetTransaction } from '@/types'
import { TransactionType, apiDateKey, formatCurrency, formatDayHeading, signedAmount } from '@/lib/budget'

interface TransactionLedgerProps {
  transactions: BudgetTransaction[]
  accounts: Account[]
  categories: BudgetCategory[]
  onEdit: (transaction: BudgetTransaction) => void
  onDelete: (transaction: BudgetTransaction) => void
}

const TYPE_STYLE: Record<TransactionType, { icon: typeof WalletIcon; badge: string }> = {
  income: { icon: ArrowDownLeftIcon, badge: 'bg-emerald-50 text-emerald-600' },
  expense: { icon: ArrowUpRightIcon, badge: 'bg-rose-50 text-rose-500' },
  transfer: { icon: TransferIcon, badge: 'bg-violet-50 text-violet-500' }
}

const signedLabel = (value: number) =>
  value === 0 ? formatCurrency(0) : `${value > 0 ? '+' : '−'}${formatCurrency(Math.abs(value))}`

export default function TransactionLedger({ transactions, accounts, categories, onEdit, onDelete }: TransactionLedgerProps) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState<'all' | TransactionType>('all')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const isFiltered = search.trim() !== '' || type !== 'all' || accountId !== '' || categoryId !== ''

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions.filter((t) => {
      if (type !== 'all' && t.type !== type) return false
      if (accountId && t.accountId !== accountId && t.toAccountId !== accountId) return false
      if (categoryId && t.categoryId !== categoryId) return false
      if (!q) return true
      return [t.description, t.category?.name, t.account?.name, t.toAccount?.name]
        .some((v) => v?.toLowerCase().includes(q))
    })
  }, [transactions, search, type, accountId, categoryId])

  const groups = useMemo(() => {
    const map = new Map<string, BudgetTransaction[]>()
    filtered.forEach((t) => {
      const key = apiDateKey(t.transactionDate)
      map.set(key, [...(map.get(key) ?? []), t])
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([key, items]) => ({ key, items, net: items.reduce((sum, t) => sum + signedAmount(t), 0) }))
  }, [filtered])

  const clearFilters = () => {
    setSearch('')
    setType('all')
    setAccountId('')
    setCategoryId('')
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes, categories, accounts…"
          aria-label="Search transactions"
          className="input py-2 lg:flex-1"
        />
        <div className="grid grid-cols-3 gap-2 lg:flex">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'all' | TransactionType)}
            aria-label="Filter by type"
            className="input py-2 lg:w-32"
          >
            <option value="all">All types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
            <option value="transfer">Transfers</option>
          </select>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            aria-label="Filter by account"
            className="input py-2 lg:w-36"
          >
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="Filter by category"
            className="input py-2 lg:w-40"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isFiltered && (
        <div className="flex items-center justify-between bg-slate-50/80 px-5 py-2 text-xs text-slate-500">
          <span>
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {transactions.length} transactions
          </span>
          <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700">
            <CloseIcon width={12} height={12} />
            Clear filters
          </button>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
            <WalletIcon width={22} height={22} />
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {isFiltered ? 'No matching transactions' : 'No transactions this month'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {isFiltered ? 'Try a different search or clear the filters.' : 'Add your first one with quick add or the Add transaction button.'}
          </p>
        </div>
      ) : (
        <div>
          {groups.map((group) => (
            <section key={group.key}>
              <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-slate-100 bg-slate-50/95 px-5 py-2 text-xs backdrop-blur">
                <span className="font-semibold text-slate-600">{formatDayHeading(group.key)}</span>
                <span className={`font-semibold tabular-nums ${group.net > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {signedLabel(group.net)}
                </span>
              </div>
              <ul className="divide-y divide-slate-100">
                {group.items.map((t) => {
                  const style = TYPE_STYLE[t.type]
                  const Icon = style.icon
                  const isTransfer = t.type === 'transfer'
                  const title = t.description || (isTransfer ? 'Transfer' : t.category?.name || 'Uncategorized')
                  const subtitle = isTransfer
                    ? `${t.account?.name ?? 'Account'} → ${t.toAccount?.name ?? 'Account'}`
                    : [t.description ? t.category?.name : null, t.account?.name].filter(Boolean).join(' · ')

                  return (
                    <li key={t.id} className="group flex items-center gap-1 pr-3 transition-colors hover:bg-slate-50/80">
                      <button
                        type="button"
                        onClick={() => onEdit(t)}
                        className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-5 text-left"
                      >
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${style.badge}`}>
                          <Icon width={16} height={16} strokeWidth={2.2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-slate-900">{title}</span>
                            {t.exclude && <span className="badge shrink-0 bg-amber-50 text-amber-700">Excluded</span>}
                          </span>
                          <span className="block truncate text-xs text-slate-500">{subtitle}</span>
                        </span>
                        <span
                          className={`shrink-0 text-sm font-semibold tabular-nums ${
                            t.type === 'income'
                              ? 'text-emerald-600'
                              : t.type === 'transfer' || t.exclude
                                ? 'text-slate-400'
                                : 'text-slate-900'
                          }`}
                        >
                          {t.type === 'income' ? '+' : t.type === 'expense' ? '−' : ''}
                          {formatCurrency(Number(t.amount))}
                        </span>
                      </button>
                      <div className="flex shrink-0 gap-0.5 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                        <button type="button" onClick={() => onEdit(t)} className="icon-btn" aria-label="Edit transaction">
                          <PencilIcon width={14} height={14} />
                        </button>
                        <button type="button" onClick={() => onDelete(t)} className="icon-btn-danger" aria-label="Delete transaction">
                          <TrashIcon width={14} height={14} />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
