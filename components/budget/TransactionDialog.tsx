'use client'

import { useMemo, useState } from 'react'
import Dialog from '@/components/Dialog'
import { ArrowDownLeftIcon, ArrowUpRightIcon, TransferIcon } from '@/components/icons'
import { Account, BudgetCategory } from '@/types'
import { TransactionType, formatCurrency, parseAmount } from '@/lib/budget'

export interface TransactionFormValues {
  type: TransactionType
  accountId: string
  toAccountId: string
  categoryId: string
  amount: string
  description: string
  exclude: boolean
  transactionDate: string
}

export interface TransactionPayload {
  type: TransactionType
  accountId: string
  toAccountId: string | null
  categoryId: string | null
  amount: number
  description: string
  exclude: boolean
  transactionDate: string
}

interface TransactionDialogProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  initialValues: TransactionFormValues
  accounts: Account[]
  categories: BudgetCategory[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: TransactionPayload) => void
}

const TYPE_OPTIONS = [
  { value: 'expense' as const, label: 'Expense', icon: ArrowUpRightIcon, active: 'text-rose-600' },
  { value: 'income' as const, label: 'Income', icon: ArrowDownLeftIcon, active: 'text-brand-600' },
  { value: 'transfer' as const, label: 'Transfer', icon: TransferIcon, active: 'text-violet-600' }
]

function TransactionForm({
  mode,
  initialValues,
  accounts,
  categories,
  isSubmitting,
  onClose,
  onSubmit
}: Omit<TransactionDialogProps, 'isOpen'>) {
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState('')

  const set = <K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const typeCategories = useMemo(
    () => categories.filter((c) => c.type === values.type),
    [categories, values.type]
  )

  const amount = parseAmount(values.amount)
  const isTransfer = values.type === 'transfer'

  const handleTypeChange = (type: TransactionType) => {
    setValues((prev) => ({
      ...prev,
      type,
      categoryId:
        type === 'transfer'
          ? ''
          : categories.find((c) => c.id === prev.categoryId && c.type === type)?.id ??
            categories.find((c) => c.type === type)?.id ??
            '',
      toAccountId: type === 'transfer' ? prev.toAccountId : '',
      exclude: type === 'expense' ? prev.exclude : false
    }))
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!(amount > 0)) return setError('Enter an amount greater than 0')
    if (!values.accountId) return setError('Select an account')
    if (isTransfer) {
      if (!values.toAccountId) return setError('Select the destination account')
      if (values.toAccountId === values.accountId) return setError('Cannot transfer to the same account')
    } else if (!values.categoryId) {
      return setError('Select a category')
    }
    if (!values.transactionDate) return setError('Select a date')

    onSubmit({
      type: values.type,
      accountId: values.accountId,
      toAccountId: isTransfer ? values.toAccountId : null,
      categoryId: isTransfer ? null : values.categoryId,
      amount,
      description: values.description.trim(),
      exclude: values.type === 'expense' ? values.exclude : false,
      transactionDate: values.transactionDate
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="segmented">
        {TYPE_OPTIONS.map(({ value, label, icon: Icon, active }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleTypeChange(value)}
            className={`segmented-item py-2 ${values.type === value ? `segmented-item-active ${active}` : ''}`}
          >
            <Icon width={14} height={14} strokeWidth={2.2} />
            {label}
          </button>
        ))}
      </div>

      <div>
        <label className="label" htmlFor="tx-amount">Amount</label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-slate-400">Rp</span>
          <input
            id="tx-amount"
            type="text"
            inputMode="decimal"
            autoFocus
            value={values.amount}
            onChange={(e) => set('amount', e.target.value)}
            placeholder="0"
            className="input pl-10 text-lg font-bold tracking-tight"
          />
        </div>
        <p className="mt-1 h-4 text-xs text-slate-400">
          {values.amount && (amount > 0 ? formatCurrency(amount) : 'Use digits, e.g. 20000, 20.000 or 20k')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="tx-account">{isTransfer ? 'From account' : 'Account'}</label>
          <select
            id="tx-account"
            value={values.accountId}
            onChange={(e) => set('accountId', e.target.value)}
            className="input"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {isTransfer ? (
          <div>
            <label className="label" htmlFor="tx-to-account">To account</label>
            <select
              id="tx-to-account"
              value={values.toAccountId}
              onChange={(e) => set('toAccountId', e.target.value)}
              className="input"
            >
              <option value="">Select account</option>
              {accounts
                .filter((a) => a.id !== values.accountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="label" htmlFor="tx-category">Category</label>
            <select
              id="tx-category"
              value={values.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="input"
              disabled={typeCategories.length === 0}
            >
              {typeCategories.length === 0 && <option value="">No {values.type} categories</option>}
              {typeCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="tx-date">Date</label>
          <input
            id="tx-date"
            type="date"
            value={values.transactionDate}
            onChange={(e) => set('transactionDate', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="tx-note">Note</label>
          <input
            id="tx-note"
            type="text"
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional"
            className="input"
          />
        </div>
      </div>

      {values.type === 'expense' && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition hover:bg-slate-50">
          <input
            type="checkbox"
            checked={values.exclude}
            onChange={(e) => set('exclude', e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-amber-500"
          />
          <span>
            <span className="block text-sm font-medium text-slate-800">Exclude from totals</span>
            <span className="block text-xs text-slate-500">
              Still deducted from the account, but not counted as spending (e.g. reimbursable or one-off costs).
            </span>
          </span>
        </label>
      )}

      {error && (
        <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add transaction' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

export default function TransactionDialog({ isOpen, ...props }: TransactionDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={props.onClose}
      title={props.mode === 'create' ? 'New transaction' : 'Edit transaction'}
    >
      <TransactionForm {...props} />
    </Dialog>
  )
}
