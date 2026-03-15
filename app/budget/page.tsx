"use client"

import { useEffect, useMemo, useState } from 'react'
import ClientLayout from '@/components/ClientLayout'
import DateNavigator from '@/components/DateNavigator'
import { Account, BudgetCategory, BudgetTransaction } from '@/types'

interface TransactionResponse {
  transactions: BudgetTransaction[]
  totalIncome: number
  totalExpense: number
  net: number
}

export default function BudgetPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingAccount, setIsSavingAccount] = useState(false)
  const [isSavingCategory, setIsSavingCategory] = useState(false)

  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense' | 'transfer',
    accountId: '',
    toAccountId: '',
    categoryId: '',
    amount: '',
    description: ''
  })

  const [newAccount, setNewAccount] = useState({
    name: '',
    initialBalance: '0'
  })

  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense'
  })

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
    } catch (error) {
      console.error('Error fetching transactions', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!form.accountId || !form.amount) return
    
    // Type-specific validation
    if (form.type === 'transfer') {
      if (!form.toAccountId) return
    } else {
      if (!form.categoryId) return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        accountId: form.accountId,
        type: form.type,
        amount: Number(form.amount),
        description: form.description,
        transactionDate: dateInputValue(currentDate)
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
        setForm((prev) => ({ ...prev, amount: '', description: '', toAccountId: '' }))
        await Promise.all([fetchAccounts(), fetchTransactions(currentDate)])
      }
    } catch (error) {
      console.error('Error creating transaction', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const net = totalIncome - totalExpense

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccount.name) return
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
        setNewAccount({ name: '', initialBalance: '0' })
        await fetchAccounts()
      }
    } catch (error) {
      console.error('Error creating account', error)
    } finally {
      setIsSavingAccount(false)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.name) return
    setIsSavingCategory(true)
    try {
      const res = await fetch('/api/budget/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })
      if (res.ok) {
        setNewCategory({ name: '', type: newCategory.type })
        await fetchCategories()
      }
    } catch (error) {
      console.error('Error creating category', error)
    } finally {
      setIsSavingCategory(false)
    }
  }

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

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Income (hari ini)</p>
            <p className="text-2xl font-semibold text-green-400">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Expense (hari ini)</p>
            <p className="text-2xl font-semibold text-red-400">{formatCurrency(totalExpense)}</p>
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

              <button
                type="submit"
                disabled={isSubmitting || filteredCategories.length === 0 || accounts.length === 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded font-semibold transition-colors"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </form>
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
                      <p className={`text-lg font-semibold ${Number(a.balance) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {formatCurrency(Number(a.balance))}
                      </p>
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
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((c) => (
                    <div key={c.id} className="bg-gray-800 border border-gray-700 rounded p-3">
                      <p className="text-white font-medium">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.type}</p>
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
                <div key={t.id} className="bg-gray-800 border border-gray-700 rounded p-4">
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
                          <p className="text-sm text-gray-400">{t.account?.name || 'Akun'}</p>
                        </>
                      )}
                    </div>
                    <p className={`text-lg font-semibold ${
                      t.type === 'income' ? 'text-green-300' : t.type === 'expense' ? 'text-red-300' : 'text-blue-300'
                    }`}>
                      {t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '-'}{formatCurrency(Number(t.amount))}
                    </p>
                  </div>
                  {t.description && <p className="text-gray-300 text-sm mt-2">{t.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  )
}
