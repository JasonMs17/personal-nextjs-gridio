'use client'

import { useState, useEffect, useRef } from 'react'
import { Account, BudgetCategory, BudgetTransaction } from '@/types'

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
      content: '👋 Halo! Silakan input transaksi dengan format: account kategori angka\nContoh: BCA makanan 20000',
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
      // Parse format: "account kategori angka"
      const parts = userInput.split(/\s+/)

      if (parts.length < 3) {
        addMessage({
          type: 'error',
          content: '❌ Format salah. Gunakan: account kategori angka\nContoh: BCA makanan 20000'
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
          content: '❌ Angka tidak valid. Harus lebih dari 0'
        })
        return
      }

      // Find account
      const account = accounts.find((a) => a.name.toLowerCase() === accountName.toLowerCase())
      if (!account) {
        addMessage({
          type: 'error',
          content: `❌ Account "${accountName}" tidak ditemukan. Akun tersedia: ${accounts.map((a) => a.name).join(', ')}`
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
          content: `❌ Kategori "${categoryName}" (${transactionType}) tidak ditemukan.\nKategori tersedia: ${availableCategories || 'Belum ada kategori'}`
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
          content: `✅ Transaksi berhasil!\n${transactionType === 'income' ? '💵' : '💸'} ${category.name} - ${formatCurrency(amount)}\nAkun: ${account.name}`,
          transaction
        })
        await onRefresh()
      } else {
        const error = await res.json()
        addMessage({
          type: 'error',
          content: `❌ Gagal menyimpan: ${error.error || 'Error tidak diketahui'}`
        })
      }
    } catch (error) {
      console.error('Error:', error)
      addMessage({
        type: 'error',
        content: '❌ Terjadi kesalahan saat memproses input'
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
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 shadow-lg">
        <h1 className="text-xl font-bold mb-3">💰 Budget</h1>
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-blue-800 bg-opacity-50 p-2 rounded">
            <p className="text-gray-300">Income</p>
            <p className="font-semibold">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-red-800 bg-opacity-50 p-2 rounded">
            <p className="text-gray-300">Expense</p>
            <p className="font-semibold">{formatCurrency(totalExpense)}</p>
          </div>
          <div className={`${net >= 0 ? 'bg-green-800' : 'bg-red-800'} bg-opacity-50 p-2 rounded`}>
            <p className="text-gray-300">Net</p>
            <p className="font-semibold">{formatCurrency(net)}</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg whitespace-pre-wrap break-words text-sm ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : msg.type === 'success'
                    ? 'bg-green-900 text-green-100 rounded-bl-none'
                    : msg.type === 'error'
                      ? 'bg-red-900 text-red-100 rounded-bl-none'
                      : 'bg-gray-800 text-gray-100 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Transaction Type Selector */}
      <div className="border-t border-gray-800 p-3">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setTransactionType('expense')}
            className={`flex-1 py-2 rounded font-semibold text-sm transition-colors ${
              transactionType === 'expense'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            💸 Expense
          </button>
          <button
            onClick={() => setTransactionType('income')}
            className={`flex-1 py-2 rounded font-semibold text-sm transition-colors ${
              transactionType === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            💵 Income
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
            placeholder={`${transactionType === 'expense' ? 'BCA makanan 20000' : 'BCA gaji 1000000'}`}
            disabled={isLoading}
            className="flex-1 bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-4 py-2 rounded font-semibold transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : '→'}
          </button>
        </div>
      </div>
    </div>
  )
}
