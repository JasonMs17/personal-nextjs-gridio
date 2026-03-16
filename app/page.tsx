'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { GridItem } from '@/types'
import GridCard from '@/components/GridCard'
import DateNavigator from '@/components/DateNavigator'
import ClientLayout from '@/components/ClientLayout'

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [gridData, setGridData] = useState<GridItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [gridColumns, setGridColumns] = useState(3)
  const [isMobile, setIsMobile] = useState(false)

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
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('workspaceChanged', handleWorkspaceEvent)
    }
  }, [])

  useEffect(() => {
    fetchGridData()
  }, [currentDate])

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768)
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">📊 Grid View</h1>
            <p className="text-sm text-gray-400 mt-1">Catat aktivitas harian dalam tampilan grid yang ringkas.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/budget"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
            >
              ⚡ Quick Budget
            </Link>
          </div>
        </div>

        <DateNavigator currentDate={currentDate} onDateChange={setCurrentDate} />

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Loading grid...</div>
          </div>
        ) : gridData.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg shadow-lg border border-gray-800">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold mb-2 text-white">No categories yet</h2>
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
            className="grid gap-4 sm:gap-6"
            style={{
              gridTemplateColumns: isMobile
                ? 'repeat(1, minmax(0, 1fr))'
                : `repeat(${Math.max(1, gridColumns)}, minmax(280px, 1fr))`
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
    </ClientLayout>
  )
}
