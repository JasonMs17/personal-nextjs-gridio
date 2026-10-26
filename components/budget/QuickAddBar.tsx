'use client'

import { useState } from 'react'
import { SendIcon, ZapIcon } from '@/components/icons'
import { Account, BudgetCategory } from '@/types'
import { CategoryType, parseQuickInput } from '@/lib/budget'
import { TransactionPayload } from '@/components/budget/TransactionDialog'

interface QuickAddBarProps {
  accounts: Account[]
  categories: BudgetCategory[]
  entryDate: string
  onCreate: (payload: TransactionPayload) => Promise<boolean>
}

export default function QuickAddBar({ accounts, categories, entryDate, onCreate }: QuickAddBarProps) {
  const [type, setType] = useState<CategoryType>('expense')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const example = accounts[0]
    ? `${accounts[0].name} ${categories.find((c) => c.type === type)?.name ?? 'category'} 25000 note`
    : 'account category amount note'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    const parsed = parseQuickInput(text, type, accounts, categories)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    setIsSubmitting(true)
    const created = await onCreate({
      type,
      accountId: parsed.accountId,
      toAccountId: null,
      categoryId: parsed.categoryId,
      amount: parsed.amount,
      description: parsed.description,
      exclude: false,
      transactionDate: entryDate
    })
    setIsSubmitting(false)
    if (created) setText('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="segmented shrink-0 sm:w-44">
          <button
            type="button"
            onClick={() => { setType('expense'); setError('') }}
            className={`segmented-item ${type === 'expense' ? 'segmented-item-active text-rose-600' : ''}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => { setType('income'); setError('') }}
            className={`segmented-item ${type === 'income' ? 'segmented-item-active text-brand-600' : ''}`}
          >
            Income
          </button>
        </div>
        <div className="relative flex-1">
          <ZapIcon width={15} height={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-amber-500" />
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setError('')
            }}
            placeholder={`Quick add — ${example}`}
            disabled={isSubmitting}
            aria-label="Quick add transaction"
            className="input pr-12 pl-10"
          />
          <button
            type="submit"
            disabled={isSubmitting || !text.trim()}
            aria-label="Add"
            className="absolute top-1/2 right-1.5 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:bg-slate-200 disabled:text-slate-400"
          >
            <SendIcon width={14} height={14} />
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
    </form>
  )
}
