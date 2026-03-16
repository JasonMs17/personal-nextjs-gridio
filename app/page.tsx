'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { GridItem, Account, BudgetCategory, BudgetTransaction } from '@/types'
import GridCard from '@/components/GridCard'
import DateNavigator from '@/components/DateNavigator'
import ClientLayout from '@/components/ClientLayout'
import BudgetOverview from '@/components/BudgetOverview'
import QuickTransactionInput from '@/components/QuickTransactionInput'

interface TransactionResponse {
  transactions: BudgetTransaction[]
  totalIncome: number
  totalExpense: number
  totalExcluded: number
  net: number
}

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [gridData, setGridData] = useState<GridItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [gridColumns, setGridColumns] = useState(3)
  const [isMobile, setIsMobile] = useState(false)
  
  // Budget states
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [totalExcluded, setTotalExcluded] = useState(0)
  const [isBudgetLoading, setIsBudgetLoading] = useState(true)

  useEffect(() => {
    // Load grid columns from localStorage
    const saved = localStorage.getItem('gridColumns')
    if (saved) {
      setGridColumns(parseInt(saved))
    }

    // Listen for workspace changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentWorkspaceId') {
        console.log('📊 Grid - Workspace changed via storage, reloading grid data')
        fetchGridData()
      }
    }

    const handleWorkspaceEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      console.log('📊 Grid - Workspace changed via custom event, reloading:', customEvent.detail.workspaceId)
      fetchGridData()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('workspaceChanged', handleWorkspaceEvent)
    
    // Load budget data (accounts and categories) - only once on mount
    fetchBudgetData()
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('workspaceChanged', handleWorkspaceEvent)
    }
  }, [])

  useEffect(() => {
    // Fetch transactions for current date
    fetchBudgetTransactions(currentDate)
  }, [currentDate])

  useEffect(() => {
    fetchGridData()
  }, [currentDate])

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768)
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  const fetchBudgetData = async () => {
    try {
      const [accountsRes, categoriesRes] = await Promise.all([
        fetch('/api/budget/accounts'),
        fetch('/api/budget/categories')
      ])
      
      const accountsData = await accountsRes.json() as Account[]
      const categoriesData = await categoriesRes.json() as BudgetCategory[]
      
      setAccounts(accountsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error fetching budget data:', error)
    }
  }

  const fetchBudgetTransactions = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0]
      const res = await fetch(`/api/budget/transactions?date=${dateStr}`)
      if (!res.ok) {
        console.error('Failed to fetch transactions')
        return
      }
      const data: TransactionResponse = await res.json()
      setTotalIncome(data.totalIncome)
      setTotalExpense(data.totalExpense)
      setTotalExcluded(data.totalExcluded || 0)
    } catch (error) {
      console.error('Error fetching transactions', error)
    }
  }

  const fetchGridData = async () => {
    setIsLoading(true)
    try {
      const workspaceId = localStorage.getItem('currentWorkspaceId')
      if (!workspaceId) {
        setGridData([])
        return
      }

      const dateStr = currentDate.toISOString().split('T')[0]
      const res = await fetch(`/api/grid?workspaceId=${workspaceId}&date=${dateStr}`)
      const data = await res.json()
      setGridData(data)
    } catch (error) {
      console.error('Error fetching grid data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (categoryId: string, title: string, content: string) => {
    try {
      const dateStr = currentDate.toISOString().split('T')[0]
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          entryDate: dateStr,
          title,
          content
        })
      })

      if (res.ok) {
        await fetchGridData()
      }
    } catch (error) {
      console.error('Error saving entry:', error)
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await fetchGridData()
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
    }
  }

  return (
    <ClientLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DateNavigator currentDate={currentDate} onDateChange={setCurrentDate} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Sidebar - Budget */}
          <div className="lg:col-span-1 order-first lg:order-first">
            {accounts.length > 0 && categories.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold text-white">Budget</h2>
                  <Link
                    href="/budget"
                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                  >
                    Manage
                  </Link>
                </div>
                <BudgetOverview
                  totalIncome={totalIncome}
                  totalExpense={totalExpense}
                  totalExcluded={totalExcluded}
                />
                <QuickTransactionInput
                  accounts={accounts}
                  categories={categories}
                  currentDate={currentDate}
                  onTransactionAdded={() => {
                    fetchBudgetTransactions(currentDate)
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Buat account dan kategori di halaman Budget untuk mulai</p>
                <Link
                  href="/budget"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                >
                  Ke Budget
                </Link>
              </div>
            )}
          </div>

          {/* Right Side - Grid Cards */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">📝 Grid View</h2>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="text-gray-400">Loading grid...</div>
                </div>
              ) : gridData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-semibold mb-2 text-white">No categories yet</h3>
                  <p className="text-gray-400 mb-4">Create categories to start taking notes</p>
                  <a
                    href="/categories"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Create Category
                  </a>
                </div>
              ) : (
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: isMobile
                      ? 'repeat(1, minmax(0, 1fr))'
                      : `repeat(${Math.max(1, Math.min(2, gridColumns))}, minmax(250px, 1fr))`
                  }}
                >
                  {gridData.map((item) => (
                    <GridCard
                      key={item.categoryId}
                      item={item}
                      onSave={(title, content) => handleSave(item.categoryId, title, content)}
                      onDelete={item.entryId ? () => handleDelete(item.entryId!) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}
