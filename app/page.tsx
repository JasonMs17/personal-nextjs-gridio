'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { GridItem, Account, BudgetCategory, BudgetTransaction } from '@/types'
import GridCard from '@/components/GridCard'
import DateNavigator from '@/components/DateNavigator'
import ClientLayout from '@/components/ClientLayout'
import BudgetOverview from '@/components/BudgetOverview'
import QuickTransactionInput from '@/components/QuickTransactionInput'
import { NoteIcon, PlusIcon, WalletIcon } from '@/components/icons'

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

  const currentDateStr = currentDate.toISOString().split('T')[0]
  const currentDateStrRef = useRef(currentDateStr)
  useEffect(() => {
    currentDateStrRef.current = currentDateStr
  }, [currentDateStr])

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

  // Called by GridCard autosave. Updates the grid locally instead of refetching,
  // so the realtime editors stay mounted while the user types.
  const handleSave = async (categoryId: string, entryDate: string, title: string, content: string) => {
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId,
        entryDate,
        title,
        content
      })
    })

    if (!res.ok) {
      throw new Error(`Failed to save entry (${res.status})`)
    }

    const entry = await res.json()
    // A save flushed by a card from a previous date must not touch the current grid
    if (entryDate !== currentDateStrRef.current) return
    setGridData((prev) =>
      prev.map((item) =>
        item.categoryId === categoryId
          ? { ...item, entryId: entry.id, title: entry.title, content: entry.content }
          : item
      )
    )
  }

  // Resolves true when the entry was deleted, so GridCard can clear its Yjs document
  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return false

    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setGridData((prev) =>
          prev.map((item) =>
            item.entryId === entryId ? { ...item, entryId: null, title: '', content: '' } : item
          )
        )
        return true
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
    }
    return false
  }

  return (
    <ClientLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="page-title">Overview</h1>
            <p className="page-subtitle">Your daily notes and cash flow at a glance.</p>
          </div>
          <Link
            href="/categories"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-500 text-white shadow-float transition hover:bg-brand-600"
            aria-label="Manage categories"
          >
            <PlusIcon width={20} height={20} strokeWidth={2.2} />
          </Link>
        </div>

        <DateNavigator currentDate={currentDate} onDateChange={setCurrentDate} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Sidebar - Budget */}
          <div className="order-first flex flex-col lg:order-first lg:col-span-1">
            <div className="mb-3 flex h-6 items-center justify-between px-1">
              <h2 className="text-base font-semibold text-slate-900">Budget</h2>
              <Link
                href="/budget"
                className="text-xs font-semibold text-brand-600 transition hover:text-brand-700"
              >
                Manage →
              </Link>
            </div>
            {accounts.length > 0 && categories.length > 0 ? (
              <div className="space-y-3">
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
              <div className="card flex min-h-80 flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-500">
                  <WalletIcon width={24} height={24} />
                </div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">No budget set up yet</h3>
                <p className="mb-5 text-sm text-slate-500">Create an account and a category on the Budget page to get started</p>
                <Link
                  href="/budget"
                  className="btn-primary"
                >
                  Go to Budget
                </Link>
              </div>
            )}
          </div>

          {/* Right Side - Grid Cards */}
          <div className="flex flex-col lg:col-span-2">
            <div className="mb-3 flex h-6 items-center justify-between px-1">
              <h2 className="text-base font-semibold text-slate-900">Daily Notes</h2>
              {!isLoading && gridData.length > 0 && (
                <span className="text-xs font-medium text-slate-400">{gridData.length} categories</span>
              )}
            </div>

            {isLoading ? (
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: isMobile ? 'repeat(1, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))' }}
              >
                {[0, 1].map((i) => (
                  <div key={i} className="card h-64 animate-pulse bg-white/60" />
                ))}
              </div>
            ) : gridData.length === 0 ? (
              <div className="card flex min-h-80 flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-500">
                  <NoteIcon width={24} height={24} />
                </div>
                <h3 className="mb-1 text-base font-semibold text-slate-900">No categories yet</h3>
                <p className="mb-5 text-sm text-slate-500">Create categories to start taking notes</p>
                <a
                  href="/categories"
                  className="btn-primary"
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
                    key={`${item.categoryId}:${currentDateStr}`}
                    item={item}
                    entryDate={currentDateStr}
                    onSave={(title, content) => handleSave(item.categoryId, currentDateStr, title, content)}
                    onDelete={item.entryId ? () => handleDelete(item.entryId!) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}
