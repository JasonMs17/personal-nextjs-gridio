'use client'

import { useState, useEffect, useRef } from 'react'
import { Account, BudgetCategory, BudgetTransaction } from '@/types'
import { SendIcon, WalletIcon } from '@/components/icons'

interface Message {
  id: string
  type: 'user' | 'system' | 'success' | 'error'
  content: string
  timestamp: Date
  transaction?: BudgetTransaction
}

interface MobileBudgetPageProps {
  accounts: Account[]
  categories: BudgetCategory[]
  transactions: BudgetTransaction[]
  onTransactionCreate: (transaction: any) => Promise<void>
  onRefresh: () => Promise<void>
}

export default function MobileBudgetPage({
  accounts,
  categories,
  transactions,
  onTransactionCreate,
  onRefresh
}: MobileBudgetPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      type: 'system',
      content: '👋 Hi! Add a transaction using the format: account category amount\nExample: BCA food 20000',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userInput = input.trim()
    
    // Add user message
    addMessage({
      type: 'user',
      content: userInput
    })

    setInput('')
    setIsLoading(true)

    try {
      // Parse format: "account category amount"
      const parts = userInput.split(/\s+/)

      if (parts.length < 3) {
        addMessage({
          type: 'error',
          content: '❌ Invalid format. Use: account category amount\nExample: BCA food 20000'
        })
        return
      }

      const accountName = parts[0]
      const categoryName = parts.slice(1, -1).join(' ')
      const amountStr = parts[parts.length - 1]

      // Validate amount
      const amount = parseFloat(amountStr)
      if (isNaN(amount) || amount <= 0) {
        addMessage({
          type: 'error',
          content: '❌ Invalid amount. It must be greater than 0'
        })
        return
      }

      // Find account
      const account = accounts.find((a) => a.name.toLowerCase() === accountName.toLowerCase())
      if (!account) {
        addMessage({
          type: 'error',
          content: `❌ Account "${accountName}" not found. Available accounts: ${accounts.map((a) => a.name).join(', ')}`
        })
        return
      }

      // Find category
      const category = categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase() && c.type === transactionType
      )
      if (!category) {
        const availableCategories = categories
          .filter((c) => c.type === transactionType)
          .map((c) => c.name)
          .join(', ')
        addMessage({
          type: 'error',
          content: `❌ Category "${categoryName}" (${transactionType}) not found.\nAvailable categories: ${availableCategories || 'No categories yet'}`
        })
        return
      }

      // Create transaction
      const res = await fetch('/api/budget/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          categoryId: category.id,
          type: transactionType,
          amount: amount,
          description: '',
          transactionDate: new Date().toISOString().split('T')[0],
          exclude: false
        })
      })

      if (res.ok) {
        const transaction = await res.json()
        addMessage({
          type: 'success',
          content: `✅ Transaction saved!\n${transactionType === 'income' ? '💵' : '💸'} ${category.name} - ${formatCurrency(amount)}\nAccount: ${account.name}`,
          transaction
        })
        await onRefresh()
      } else {
        const error = await res.json()
        addMessage({
          type: 'error',
          content: `❌ Failed to save: ${error.error || 'Unknown error'}`
        })
      }
    } catch (error) {
      console.error('Error:', error)
      addMessage({
        type: 'error',
        content: '❌ Something went wrong while processing your input'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

  const totalIncome = transactions
    .filter((t) => t.type === 'income' && !t.exclude)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense' && !t.exclude)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const net = totalIncome - totalExpense

  return (
    <div className="flex h-screen flex-col bg-background text-slate-900">
      {/* Header */}
      <div className="rounded-b-3xl bg-brand-500 px-4 pt-5 pb-4 text-white shadow-float">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20">
            <WalletIcon width={18} height={18} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Budget</h1>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-white/15 p-2.5">
            <p className="text-white/75">Income</p>
            <p className="truncate font-semibold">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="rounded-xl bg-white/15 p-2.5">
            <p className="text-white/75">Expense</p>
            <p className="truncate font-semibold">{formatCurrency(totalExpense)}</p>
          </div>
          <div className={`rounded-xl p-2.5 ${net >= 0 ? 'bg-white text-brand-700' : 'bg-rose-500 text-white'}`}>
            <p className={net >= 0 ? 'text-brand-600/80' : 'text-white/80'}>Net</p>
            <p className="truncate font-semibold">{formatCurrency(net)}</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${
                msg.type === 'user'
                  ? 'rounded-br-md bg-brand-500 text-white'
                  : msg.type === 'success'
                    ? 'rounded-bl-md border border-brand-100 bg-brand-50 text-brand-800'
                    : msg.type === 'error'
                      ? 'rounded-bl-md border border-rose-100 bg-rose-50 text-rose-700'
                      : 'rounded-bl-md border border-slate-200/70 bg-white text-slate-700 shadow-card'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Transaction Type Selector */}
      <div className="border-t border-slate-200/70 bg-white p-3">
        <div className="segmented mb-3">
          <button
            onClick={() => setTransactionType('expense')}
            className={`segmented-item py-2 text-sm ${transactionType === 'expense' ? 'segmented-item-active text-rose-600' : ''}`}
          >
            Expense
          </button>
          <button
            onClick={() => setTransactionType('income')}
            className={`segmented-item py-2 text-sm ${transactionType === 'income' ? 'segmented-item-active text-brand-600' : ''}`}
          >
            Income
          </button>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSend()
              }
            }}
            placeholder={`${transactionType === 'expense' ? 'BCA food 20000' : 'BCA salary 1000000'}`}
            disabled={isLoading}
            className="input flex-1"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="btn-primary px-3.5"
            aria-label="Send"
          >
            {isLoading ? '...' : <SendIcon width={18} height={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
