"use client"

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import ClientLayout from '@/components/ClientLayout'
import DateNavigator from '@/components/DateNavigator'
import Dialog from '@/components/Dialog'
import MobileBudgetPage from '@/components/mobile/MobileBudgetPage'
import { Account, BudgetCategory, BudgetTransaction } from '@/types'
import { isNative } from '@/lib/platform'

interface TransactionResponse {
  transactions: BudgetTransaction[]
  totalIncome: number
  totalExpense: number
  totalExcluded: number
  net: number
}

export default function BudgetPage() {
  const [isNativeApp, setIsNativeApp] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [totalExcluded, setTotalExcluded] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingAccount, setIsSavingAccount] = useState(false)
  const [isSavingCategory, setIsSavingCategory] = useState(false)

  // Quick input state
  const [quickInputType, setQuickInputType] = useState<'income' | 'expense'>('expense')
  const [quickInputText, setQuickInputText] = useState('')
  const [quickInputError, setQuickInputError] = useState('')
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false)

  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense' | 'transfer',
    accountId: '',
    toAccountId: '',
    categoryId: '',
    amount: '',
    description: '',
    exclude: false
  })

  const [newAccount, setNewAccount] = useState({
    name: '',
    initialBalance: '0'
  })

  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense'
  })

  // Edit/Delete dialog states
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<BudgetTransaction | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<BudgetCategory | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<BudgetTransaction | null>(null)
  const [editAccountName, setEditAccountName] = useState('')
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryType, setEditCategoryType] = useState<'income' | 'expense'>('expense')
  const [editTransactionForm, setEditTransactionForm] = useState({
    accountId: '',
    toAccountId: '',
    categoryId: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: '',
    description: '',
    exclude: false,
    transactionDate: ''
  })
  const [isEditingAccount, setIsEditingAccount] = useState(false)
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [isEditingTransaction, setIsEditingTransaction] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false)

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === form.type),
    [categories, form.type]
  )

  const formatCurrency = (value: number) =>
    value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

  const dateInputValue = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      await Promise.all([fetchAccounts(), fetchCategories()])
      await fetchTransactions(currentDate)
      setIsLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Wait a bit for Capacitor to initialize before detecting platform
    const timer = setTimeout(() => {
      try {
        setIsNativeApp(isNative())
      } catch (error) {
        console.error('Error detecting native app:', error)
        setIsNativeApp(false)
      }
    }, 500) // Small delay to let Capacitor init
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    fetchTransactions(currentDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate])

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/budget/accounts')
      const data: Account[] = await res.json()
      setAccounts(data)
      if (!form.accountId && data.length > 0) {
        setForm((prev) => ({ ...prev, accountId: data[0].id }))
      }
    } catch (error) {
      console.error('Error fetching accounts', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/budget/categories')
      const data: BudgetCategory[] = await res.json()
      setCategories(data)
      const first = data.find((c) => c.type === form.type)
      if (!form.categoryId && first) {
        setForm((prev) => ({ ...prev, categoryId: first.id }))
      }
    } catch (error) {
      console.error('Error fetching categories', error)
    }
  }

  const fetchTransactions = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0]
      const res = await fetch(`/api/budget/transactions?date=${dateStr}`)
      if (!res.ok) {
        console.error('Failed to fetch transactions')
        return
      }
      const data: TransactionResponse = await res.json()
      setTransactions(data.transactions)
      setTotalIncome(data.totalIncome)
      setTotalExpense(data.totalExpense)
      setTotalExcluded(data.totalExcluded || 0)
    } catch (error) {
      console.error('Error fetching transactions', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!form.accountId || !form.amount) {
      toast.error('Please fill in all required fields')
      return
    }
    
    // Type-specific validation
    if (form.type === 'transfer') {
      if (!form.toAccountId) {
        toast.error('Please select destination account for transfer')
        return
      }
    } else {
      if (!form.categoryId) {
        toast.error('Please select a category')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        accountId: form.accountId,
        type: form.type,
        amount: Number(form.amount),
        description: form.description,
        transactionDate: dateInputValue(currentDate),
        exclude: form.exclude
      }

      if (form.type === 'transfer') {
        payload.toAccountId = form.toAccountId
      } else {
        payload.categoryId = form.categoryId
      }

      const res = await fetch('/api/budget/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast.success('Transaction added successfully!')
        setForm((prev) => ({ ...prev, amount: '', description: '', toAccountId: '', exclude: false }))
        await Promise.all([fetchAccounts(), fetchTransactions(currentDate)])
      } else {
        toast.error('Failed to create transaction')
      }
    } catch (error) {
      console.error('Error creating transaction', error)
      toast.error('Error creating transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  const net = totalIncome - totalExpense

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccount.name) {
      toast.error('Account name is required')
      return
    }
    setIsSavingAccount(true)
    try {
      const res = await fetch('/api/budget/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAccount.name,
          initialBalance: Number(newAccount.initialBalance) || 0
        })
      })
      if (res.ok) {
        toast.success('Account created successfully!')
        setNewAccount({ name: '', initialBalance: '0' })
        await fetchAccounts()
      } else {
        toast.error('Failed to create account')
      }
    } catch (error) {
      console.error('Error creating account', error)
      toast.error('Error creating account')
    } finally {
      setIsSavingAccount(false)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.name) {
      toast.error('Category name is required')
      return
    }
    setIsSavingCategory(true)
    try {
      const res = await fetch('/api/budget/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })
      if (res.ok) {
        toast.success('Category created successfully!')
        setNewCategory({ name: '', type: newCategory.type })
        await fetchCategories()
      } else {
        toast.error('Failed to create category')
      }
    } catch (error) {
      console.error('Error creating category', error)
      toast.error('Error creating category')
    } finally {
      setIsSavingCategory(false)
    }
  }

  // Edit Account
  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setEditAccountName(account.name)
  }

  const handleSaveEditAccount = async () => {
    if (!editingAccount || !editAccountName) {
      toast.error('Account name is required')
      return
    }
    setIsEditingAccount(true)
    try {
      const res = await fetch(`/api/budget/accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editAccountName })
      })
      if (res.ok) {
        toast.success('Account updated successfully!')
        setEditingAccount(null)
        await fetchAccounts()
      } else {
        toast.error('Failed to update account')
      }
    } catch (error) {
      console.error('Error updating account', error)
      toast.error('Error updating account')
    } finally {
      setIsEditingAccount(false)
    }
  }

  // Delete Account
  const handleDeleteAccount = (account: Account) => {
    setDeletingAccount(account)
  }

  const confirmDeleteAccount = async () => {
    if (!deletingAccount) return
    setIsDeletingAccount(true)
    try {
      const res = await fetch(`/api/budget/accounts/${deletingAccount.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Account deleted successfully!')
        setDeletingAccount(null)
        await fetchAccounts()
      } else {
        toast.error('Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account', error)
      toast.error('Error deleting account')
    } finally {
      setIsDeletingAccount(false)
    }
  }

  // Edit Category
  const handleEditCategory = (category: BudgetCategory) => {
    setEditingCategory(category)
    setEditCategoryName(category.name)
    setEditCategoryType(category.type as 'income' | 'expense')
  }

  const handleSaveEditCategory = async () => {
    if (!editingCategory || !editCategoryName) {
      toast.error('Category name is required')
      return
    }
    setIsEditingCategory(true)
    try {
      const res = await fetch(`/api/budget/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCategoryName,
          type: editCategoryType
        })
      })
      if (res.ok) {
        toast.success('Category updated successfully!')
        setEditingCategory(null)
        await fetchCategories()
      } else {
        toast.error('Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category', error)
      toast.error('Error updating category')
    } finally {
      setIsEditingCategory(false)
    }
  }

  // Delete Category
  const handleDeleteCategory = (category: BudgetCategory) => {
    setDeletingCategory(category)
  }

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return
    setIsDeletingCategory(true)
    try {
      const res = await fetch(`/api/budget/categories/${deletingCategory.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Category deleted successfully!')
        setDeletingCategory(null)
        await fetchCategories()
        // Reset form if the deleted category was selected
        if (form.categoryId === deletingCategory.id) {
          setForm((prev) => ({ ...prev, categoryId: '' }))
        }
      } else {
        toast.error('Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category', error)
      toast.error('Error deleting category')
    } finally {
      setIsDeletingCategory(false)
    }
  }

  // Edit Transaction
  const handleEditTransaction = (transaction: BudgetTransaction) => {
    setEditingTransaction(transaction)
    setEditTransactionForm({
      accountId: transaction.accountId,
      toAccountId: transaction.toAccountId || '',
      categoryId: transaction.categoryId || '',
      type: transaction.type as 'income' | 'expense' | 'transfer',
      amount: String(transaction.amount),
      description: transaction.description || '',
      exclude: transaction.exclude,
      transactionDate: dateInputValue(new Date(transaction.transactionDate))
    })
  }

  const handleSaveEditTransaction = async () => {
    if (!editingTransaction) return
    setIsEditingTransaction(true)
    try {
      const res = await fetch(`/api/budget/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: editTransactionForm.accountId,
          toAccountId: editTransactionForm.toAccountId || null,
          categoryId: editTransactionForm.categoryId || null,
          type: editTransactionForm.type,
          amount: Number(editTransactionForm.amount),
          description: editTransactionForm.description,
          exclude: editTransactionForm.exclude,
          transactionDate: editTransactionForm.transactionDate
        })
      })
      if (res.ok) {
        toast.success('Transaction updated successfully!')
        setEditingTransaction(null)
        await fetchTransactions(currentDate)
        await fetchAccounts()
      } else {
        toast.error('Failed to update transaction')
      }
    } catch (error) {
      console.error('Error updating transaction', error)
      toast.error('Error updating transaction')
    } finally {
      setIsEditingTransaction(false)
    }
  }

  // Delete Transaction
  const handleDeleteTransaction = (transaction: BudgetTransaction) => {
    setDeletingTransaction(transaction)
  }

  const confirmDeleteTransaction = async () => {
    if (!deletingTransaction) return
    setIsDeletingTransaction(true)
    try {
      const res = await fetch(`/api/budget/transactions/${deletingTransaction.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Transaction deleted successfully!')
        setDeletingTransaction(null)
        await fetchTransactions(currentDate)
        await fetchAccounts()
      } else {
        toast.error('Failed to delete transaction')
      }
    } catch (error) {
      console.error('Error deleting transaction', error)
      toast.error('Error deleting transaction')
    } finally {
      setIsDeletingTransaction(false)
    }
  }

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setQuickInputError('')
    
    if (!quickInputText.trim()) {
      setQuickInputError('Input tidak boleh kosong')
      return
    }

    // Parse format: "account kategori angka"
    const parts = quickInputText.trim().split(/\s+/)
    if (parts.length < 3) {
      setQuickInputError('Format: account kategori angka (contoh: BCA makanan 20000)')
      return
    }

    const accountName = parts[0]
    const categoryName = parts.slice(1, -1).join(' ')
    const amountStr = parts[parts.length - 1]

    // Validate amount
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
      setQuickInputError('Angka transaksi tidak valid')
      return
    }

    // Find account
    const account = accounts.find((a) => a.name.toLowerCase() === accountName.toLowerCase())
    if (!account) {
      setQuickInputError(`Account "${accountName}" tidak ditemukan`)
      return
    }

    // Find category
    const category = categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase() && c.type === quickInputType
    )
    if (!category) {
      setQuickInputError(`Kategori "${categoryName}" (${quickInputType}) tidak ditemukan`)
      return
    }

    setIsQuickSubmitting(true)
    try {
      const res = await fetch('/api/budget/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          categoryId: category.id,
          type: quickInputType,
          amount: amount,
          description: '',
          transactionDate: dateInputValue(currentDate),
          exclude: false
        })
      })

      if (res.ok) {
        setQuickInputText('')
        await Promise.all([fetchAccounts(), fetchTransactions(currentDate)])
      } else {
        const error = await res.json()
        setQuickInputError(error.error || 'Gagal menyimpan transaksi')
      }
    } catch (error) {
      console.error('Error creating quick transaction', error)
      setQuickInputError('Terjadi kesalahan saat menyimpan transaksi')
    } finally {
      setIsQuickSubmitting(false)
    }
  }

  // Mobile UI for native app
  if (isNativeApp && !isLoading) {
    return (
      <MobileBudgetPage
        accounts={accounts}
        categories={categories}
        transactions={transactions}
        onTransactionCreate={async () => {
          await Promise.all([fetchAccounts(), fetchTransactions(currentDate)])
        }}
        onRefresh={async () => {
          await Promise.all([fetchAccounts(), fetchTransactions(currentDate)])
        }}
      />
    )
  }

  // Web UI
  return (
    <ClientLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">💰 Budget</h1>
            <p className="text-gray-400">Catat income/expense, lihat saldo akun, dan transaksi per hari.</p>
          </div>
        </div>

        <DateNavigator currentDate={currentDate} onDateChange={setCurrentDate} />

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Income (hari ini)</p>
            <p className="text-2xl font-semibold text-green-400">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Expense (hari ini)</p>
            <p className="text-2xl font-semibold text-red-400">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Excluded Expense</p>
            <p className="text-2xl font-semibold text-yellow-400">{formatCurrency(totalExcluded)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Net (hari ini)</p>
            <p className={`text-2xl font-semibold ${net >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatCurrency(net)}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold text-white mb-4">Input Transaksi</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Tipe Transaksi</label>
                <select
                  value={form.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'income' | 'expense' | 'transfer'
                    setForm((prev) => ({
                      ...prev,
                      type: newType,
                      categoryId: newType !== 'transfer' ? categories.find((c) => c.type === newType)?.id || '' : '',
                      toAccountId: ''
                    }))
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                >
                  <option value="income">💵 Income</option>
                  <option value="expense">💸 Expense</option>
                  <option value="transfer">🔄 Transfer (Pindah Dana)</option>
                </select>
              </div>

              {form.type === 'transfer' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Dari Account</label>
                    <select
                      value={form.accountId}
                      onChange={(e) => setForm((prev) => ({ ...prev, accountId: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Ke Account</label>
                    <select
                      value={form.toAccountId}
                      onChange={(e) => setForm((prev) => ({ ...prev, toAccountId: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                    >
                      <option value="">Pilih account tujuan</option>
                      {accounts.map((a) => (
                        a.id !== form.accountId && (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        )
                      ))}
                    </select>
                    {form.toAccountId === form.accountId && form.toAccountId && (
                      <p className="text-xs text-red-400 mt-1">Tidak bisa transfer ke account yang sama</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Account</label>
                    <select
                      value={form.accountId}
                      onChange={(e) => setForm((prev) => ({ ...prev, accountId: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Kategori</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                    >
                      {filteredCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {filteredCategories.length === 0 && (
                      <p className="text-xs text-yellow-300 mt-1">Belum ada kategori untuk tipe ini.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Jumlah</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Tanggal</label>
                  <input
                    type="date"
                    value={dateInputValue(currentDate)}
                    onChange={(e) => setCurrentDate(new Date(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Deskripsi (opsional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                  placeholder="Contoh: Makan siang, gaji, dsb"
                />
              </div>

              {form.type === 'expense' && (
                <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded p-3">
                  <input
                    type="checkbox"
                    id="exclude"
                    checked={form.exclude}
                    onChange={(e) => setForm((prev) => ({ ...prev, exclude: e.target.checked }))}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="exclude" className="text-sm text-gray-300 cursor-pointer">
                    ⚠️ Exclude
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || (form.type !== 'transfer' && filteredCategories.length === 0) || accounts.length === 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded font-semibold transition-colors"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </form>

            <div className="border-t border-gray-700 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">⚡ Input Cepat</h3>
              <p className="text-sm text-gray-400 mb-3">Format: <code className="bg-gray-800 px-2 py-1 rounded">account kategori angka</code></p>
              <p className="text-xs text-gray-500 mb-4">Contoh: <code className="bg-gray-800 px-2 py-1 rounded">BCA makanan 20000</code></p>
              
              <form className="space-y-3" onSubmit={handleQuickSubmit}>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Tipe</label>
                  <select
                    value={quickInputType}
                    onChange={(e) => setQuickInputType(e.target.value as 'income' | 'expense')}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                  >
                    <option value="income">💵 Income</option>
                    <option value="expense">💸 Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Input</label>
                  <input
                    type="text"
                    value={quickInputText}
                    onChange={(e) => {
                      setQuickInputText(e.target.value)
                      setQuickInputError('')
                    }}
                    placeholder="BCA makanan 20000"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                  />
                  {quickInputError && (
                    <p className="text-xs text-red-400 mt-2">{quickInputError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isQuickSubmitting || !quickInputText.trim()}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded font-semibold transition-colors text-sm"
                >
                  {isQuickSubmitting ? 'Menyimpan...' : 'Simpan Cepat'}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Accounts</h2>
                <span className="text-sm text-gray-400">{accounts.length} akun</span>
              </div>
              <form className="space-y-3 mb-4" onSubmit={handleCreateAccount}>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nama akun (Cash/BCA)"
                    className="col-span-2 px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                    required
                  />
                  <input
                    type="number"
                    value={newAccount.initialBalance}
                    onChange={(e) => setNewAccount((prev) => ({ ...prev, initialBalance: e.target.value }))}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                    placeholder="Saldo"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingAccount}
                  className="w-full py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded text-sm border border-gray-700"
                >
                  {isSavingAccount ? 'Menyimpan akun...' : 'Tambah Akun'}
                </button>
              </form>
              {accounts.length === 0 ? (
                <p className="text-gray-400">Belum ada akun. Tambah via form di atas.</p>
              ) : (
                <div className="space-y-3">
                  {accounts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded p-3">
                      <div>
                        <p className="text-white font-medium">{a.name}</p>
                        <p className="text-xs text-gray-400">Saldo</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`text-lg font-semibold ${Number(a.balance) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {formatCurrency(Number(a.balance))}
                        </p>
                        <button
                          onClick={() => handleEditAccount(a)}
                          className="px-2 py-1 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(a)}
                          disabled={isDeletingAccount}
                          className="px-2 py-1 text-xs bg-red-700 hover:bg-red-600 disabled:bg-gray-700 text-white rounded"
                        >
                          Del
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Budget Categories</h2>
                <span className="text-sm text-gray-400">{categories.length} kategori</span>
              </div>
              <form className="space-y-3 mb-4" onSubmit={handleCreateCategory}>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nama kategori"
                    className="col-span-2 px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                    required
                  />
                  <select
                    value={newCategory.type}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="w-full py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded text-sm border border-gray-700"
                >
                  {isSavingCategory ? 'Menyimpan kategori...' : 'Tambah Kategori'}
                </button>
              </form>
              {categories.length === 0 ? (
                <p className="text-gray-400">Belum ada kategori budget.</p>
              ) : (
                <div className="space-y-3">
                  {categories.map((c) => (
                    <div key={c.id} className="bg-gray-800 border border-gray-700 rounded p-3 flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.type}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(c)}
                          className="px-2 py-1 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c)}
                          disabled={isDeletingCategory}
                          className="px-2 py-1 text-xs bg-red-700 hover:bg-red-600 disabled:bg-gray-700 text-white rounded"
                        >
                          Del
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Transaksi {dateInputValue(currentDate)}</h2>
            <span className="text-sm text-gray-400">{transactions.length} transaksi</span>
          </div>

          {transactions.length === 0 ? (
            <p className="text-gray-400">Belum ada transaksi untuk tanggal ini.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className={`border rounded p-4 transition-all ${
                    t.exclude
                      ? 'bg-yellow-900 border-yellow-700 opacity-75'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      {t.type === 'transfer' ? (
                        <>
                          <p className="text-white font-semibold">🔄 Transfer</p>
                          <p className="text-sm text-gray-400">{t.account?.name} → {t.toAccount?.name}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-white font-semibold">{t.category?.name || 'Kategori'}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-400">{t.account?.name || 'Akun'}</p>
                            {t.exclude && <span className="text-xs bg-yellow-700 text-yellow-100 px-2 py-1 rounded">Excluded</span>}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`text-lg font-semibold ${
                        t.type === 'income' ? 'text-green-300' : t.type === 'expense' ? 'text-red-300' : 'text-blue-300'
                      }`}>
                        {t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '-'}{formatCurrency(Number(t.amount))}
                      </p>
                      <button
                        onClick={() => handleEditTransaction(t)}
                        className="px-2 py-1 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(t)}
                        className="px-2 py-1 text-xs bg-red-700 hover:bg-red-600 text-white rounded"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                  {t.description && <p className="text-gray-300 text-sm mt-2">{t.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Account Dialog */}
      <Dialog
        isOpen={editingAccount !== null}
        onClose={() => setEditingAccount(null)}
        title="Edit Akun"
      >
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault()
          handleSaveEditAccount()
        }}>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Nama Akun</label>
            <input
              type="text"
              value={editAccountName}
              onChange={(e) => setEditAccountName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setEditingAccount(null)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isEditingAccount || !editAccountName}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded"
            >
              {isEditingAccount ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog
        isOpen={deletingAccount !== null}
        onClose={() => setDeletingAccount(null)}
        title="Hapus Akun"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Yakin hapus akun <span className="font-semibold text-white">"{deletingAccount?.name}"</span>?
          </p>
          <p className="text-sm text-gray-400">
            Transaksi yang terkait tidak akan dihapus, tapi akan kehilangan referensi akun.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeletingAccount(null)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded"
            >
              Batal
            </button>
            <button
              onClick={confirmDeleteAccount}
              disabled={isDeletingAccount}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded"
            >
              {isDeletingAccount ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog
        isOpen={editingCategory !== null}
        onClose={() => setEditingCategory(null)}
        title="Edit Kategori"
      >
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault()
          handleSaveEditCategory()
        }}>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Nama Kategori</label>
            <input
              type="text"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Tipe</label>
            <select
              value={editCategoryType}
              onChange={(e) => setEditCategoryType(e.target.value as 'income' | 'expense')}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isEditingCategory || !editCategoryName}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded"
            >
              {isEditingCategory ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog
        isOpen={deletingCategory !== null}
        onClose={() => setDeletingCategory(null)}
        title="Hapus Kategori"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Yakin hapus kategori <span className="font-semibold text-white">"{deletingCategory?.name}"</span>?
          </p>
          <p className="text-sm text-gray-400">
            Transaksi yang terkait tidak akan dihapus, tapi akan kehilangan referensi kategori.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeletingCategory(null)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded"
            >
              Batal
            </button>
            <button
              onClick={confirmDeleteCategory}
              disabled={isDeletingCategory}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded"
            >
              {isDeletingCategory ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog
        isOpen={editingTransaction !== null}
        onClose={() => setEditingTransaction(null)}
        title="Edit Transaksi"
      >
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault()
          handleSaveEditTransaction()
        }}>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Tipe Transaksi</label>
            <select
              value={editTransactionForm.type}
              onChange={(e) => {
                const newType = e.target.value as 'income' | 'expense' | 'transfer'
                setEditTransactionForm((prev) => ({
                  ...prev,
                  type: newType,
                  categoryId: newType !== 'transfer' ? categories.find((c) => c.type === newType)?.id || '' : '',
                  toAccountId: newType === 'transfer' ? prev.toAccountId : ''
                }))
              }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
            >
              <option value="income">💵 Income</option>
              <option value="expense">💸 Expense</option>
              <option value="transfer">🔄 Transfer</option>
            </select>
          </div>

          {editTransactionForm.type === 'transfer' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Dari Account</label>
                <select
                  value={editTransactionForm.accountId}
                  onChange={(e) => setEditTransactionForm((prev) => ({ ...prev, accountId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Ke Account</label>
                <select
                  value={editTransactionForm.toAccountId}
                  onChange={(e) => setEditTransactionForm((prev) => ({ ...prev, toAccountId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                >
                  <option value="">Pilih account tujuan</option>
                  {accounts.map((a) => (
                    a.id !== editTransactionForm.accountId && (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    )
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Account</label>
                <select
                  value={editTransactionForm.accountId}
                  onChange={(e) => setEditTransactionForm((prev) => ({ ...prev, accountId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Kategori</label>
                <select
                  value={editTransactionForm.categoryId}
                  onChange={(e) => setEditTransactionForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                >
                  {categories.filter((c) => c.type === editTransactionForm.type).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Jumlah</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editTransactionForm.amount}
                onChange={(e) => setEditTransactionForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Tanggal</label>
              <input
                type="date"
                value={editTransactionForm.transactionDate}
                onChange={(e) => setEditTransactionForm((prev) => ({ ...prev, transactionDate: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Deskripsi</label>
            <input
              type="text"
              value={editTransactionForm.description}
              onChange={(e) => setEditTransactionForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
            />
          </div>

          {editTransactionForm.type === 'expense' && (
            <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded p-3">
              <input
                type="checkbox"
                id="editExclude"
                checked={editTransactionForm.exclude}
                onChange={(e) => setEditTransactionForm((prev) => ({ ...prev, exclude: e.target.checked }))}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="editExclude" className="text-sm text-gray-300 cursor-pointer">
                ⚠️ Exclude
              </label>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setEditingTransaction(null)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isEditingTransaction || !editTransactionForm.amount}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded"
            >
              {isEditingTransaction ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete Transaction Dialog */}
      <Dialog
        isOpen={deletingTransaction !== null}
        onClose={() => setDeletingTransaction(null)}
        title="Hapus Transaksi"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Yakin hapus transaksi ini?
          </p>
          {deletingTransaction && (
            <div className="bg-gray-800 border border-gray-700 rounded p-3 space-y-2">
              <p className="text-sm text-gray-400">{deletingTransaction.category?.name || deletingTransaction.account?.name}</p>
              <p className="font-semibold text-white">{formatCurrency(Number(deletingTransaction.amount))}</p>
              {deletingTransaction.description && <p className="text-xs text-gray-400">{deletingTransaction.description}</p>}
            </div>
          )}
          <p className="text-sm text-gray-400">
            Saldo akun akan dikembalikan otomatis.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeletingTransaction(null)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded"
            >
              Batal
            </button>
            <button
              onClick={confirmDeleteTransaction}
              disabled={isDeletingTransaction}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded"
            >
              {isDeletingTransaction ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </div>
      </Dialog>
    </ClientLayout>
  )
}
