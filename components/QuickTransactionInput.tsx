'use client'

import { useState, useMemo } from 'react'
import { Account, BudgetCategory } from '@/types'
import toast from 'react-hot-toast'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  )

  const formatCurrency = (value: number) =>
    value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

  const dateInputValue = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const parseInput = (text: string) => {
    // Format: "account_name category_name amount [description]"
    const parts = text.trim().split(/\s+/)
    if (parts.length < 3) return null

    // Find amount (last numeric value or last number-like string)
    let amountIndex = -1
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!isNaN(parseFloat(parts[i]))) {
        amountIndex = i
        break
      }
    }

    if (amountIndex < 2) return null // Need at least account + category + amount

    const accountName = parts[0]
    const categoryName = parts[1]
    const amount = parseFloat(parts[amountIndex])
    const description = parts.slice(amountIndex + 1).join(' ')

    // Find matching account
    const account = accounts.find(a => a.name.toLowerCase().includes(accountName.toLowerCase()))
    if (!account) return { error: `Account "${accountName}" not found` }

    // Find matching category
    const category = filteredCategories.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase()))
    if (!category) return { error: `Category "${categoryName}" not found for ${type}` }

    if (isNaN(amount) || amount <= 0) {
      return { error: 'Invalid amount' }
    }

    return {
      accountId: account.id,
      categoryId: category.id,
      amount,
      description
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedInput = input.trim()
    if (!trimmedInput) return

    const parsed = parseInput(trimmedInput)
    if (!parsed || 'error' in parsed) {
      setError(parsed?.error || 'Invalid format')
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
          transactionDate: dateInputValue(currentDate),
          exclude: false
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
    <div className="bg-gray-900 border border-gray-800 rounded p-3">
      <h3 className="text-sm font-semibold text-white mb-2">Quick Input</h3>
      
      {error && (
        <div className="text-xs text-red-400 bg-red-950 border border-red-800 rounded px-2 py-1 mb-2">
          {error}
        </div>
      )}

      {/* Type Toggle */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => {
            setType('expense')
            setError('')
          }}
          className={`flex-1 py-1.5 rounded text-xs font-medium transition ${
            type === 'expense'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => {
            setType('income')
            setError('')
          }}
          className={`flex-1 py-1.5 rounded text-xs font-medium transition ${
            type === 'income'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Income
        </button>
      </div>

      {/* Chat-like Input */}
      <form onSubmit={handleSubmit} className="space-y-1">
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
            className="flex-1 px-3 py-2 text-xs bg-gray-800 border border-gray-700 text-white rounded placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || isSubmitting || !input.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded font-medium text-xs transition"
          >
            {loading || isSubmitting ? '...' : '→'}
          </button>
        </div>
        <p className="text-xs text-gray-500">Format: account category amount [detail]</p>
      </form>
    </div>
  )
}
