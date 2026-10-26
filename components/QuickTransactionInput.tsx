'use client'

import { useState, useMemo } from 'react'
import { Account, BudgetCategory } from '@/types'
import toast from 'react-hot-toast'
import { SendIcon, ZapIcon } from '@/components/icons'
import { parseQuickInput, toDateKey } from '@/lib/budget'

interface QuickTransactionInputProps {
  accounts: Account[]
  categories: BudgetCategory[]
  currentDate: Date
  onTransactionAdded: () => void
  isSubmitting?: boolean
}

export default function QuickTransactionInput({
  accounts,
  categories,
  currentDate,
  onTransactionAdded,
  isSubmitting = false
}: QuickTransactionInputProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [input, setInput] = useState<string>('')
  const [exclude, setExclude] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedInput = input.trim()
    if (!trimmedInput) return

    const parsed = parseQuickInput(trimmedInput, type, accounts, categories)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/budget/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: parsed.accountId,
          type,
          categoryId: parsed.categoryId,
          amount: parsed.amount,
          description: parsed.description,
          transactionDate: toDateKey(currentDate),
          exclude: exclude
        })
      })

      if (res.ok) {
        setInput('')
        setError('')
        toast.success(`Transaction added successfully!`)
        onTransactionAdded()
      } else {
        const errorMsg = 'Failed to add transaction'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      console.error('Error creating transaction', err)
      const errorMsg = 'Error: failed to add transaction'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-500">
          <ZapIcon width={14} height={14} strokeWidth={2.2} />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">Quick Input</h3>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
          {error}
        </div>
      )}

      {/* Type Toggle */}
      <div className="segmented mb-3">
        <button
          type="button"
          onClick={() => {
            setType('expense')
            setError('')
          }}
          className={`segmented-item ${type === 'expense' ? 'segmented-item-active text-rose-600' : ''}`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => {
            setType('income')
            setError('')
          }}
          className={`segmented-item ${type === 'income' ? 'segmented-item-active text-brand-600' : ''}`}
        >
          Income
        </button>
      </div>

      {/* Chat-like Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setError('')
            }}
            placeholder={accounts.length > 0 ? `e.g ${accounts[0].name} ${filteredCategories[0]?.name || 'cat'} 50000 note` : 'account category amount detail'}
            disabled={loading || isSubmitting}
            className="input flex-1 text-xs"
          />
          <button
            type="submit"
            disabled={loading || isSubmitting || !input.trim()}
            className="btn-primary px-3"
            aria-label="Add transaction"
          >
            {loading || isSubmitting ? '...' : <SendIcon width={16} height={16} />}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Exclude Checkbox */}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={exclude}
              onChange={(e) => setExclude(e.target.checked)}
              disabled={loading || isSubmitting}
              className="h-3.5 w-3.5 cursor-pointer rounded accent-brand-500"
            />
            <span className="text-xs font-medium text-slate-600">Exclude</span>
          </label>

          <p className="text-[11px] text-slate-400">account category amount [detail]</p>
        </div>
      </form>
    </div>
  )
}
