'use client'

import { useState, useEffect } from 'react'
import { Category, Entry } from '@/types'
import ClientLayout from '@/components/ClientLayout'

export default function ListPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
    console.log('📋 List - Checking localStorage:', { savedWorkspaceId })
    setWorkspaceId(savedWorkspaceId)
    
    if (savedWorkspaceId) {
      console.log('📋 List - Fetching categories for workspace:', savedWorkspaceId)
      fetchCategories(savedWorkspaceId)
    } else {
      console.log('⚠️ List - No workspace ID found')
      setIsLoading(false)
    }

    // Listen for storage changes (when workspace is selected in sidebar)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentWorkspaceId' && e.newValue) {
        console.log('📋 List - Workspace changed via storage event:', e.newValue)
        setWorkspaceId(e.newValue)
        fetchCategories(e.newValue)
        setSelectedCategoryId(null)
      }
    }

    // Listen for custom workspace change event
    const handleWorkspaceEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      console.log('📋 List - Workspace changed via custom event:', customEvent.detail.workspaceId)
      setWorkspaceId(customEvent.detail.workspaceId)
      fetchCategories(customEvent.detail.workspaceId)
      setSelectedCategoryId(null)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('workspaceChanged', handleWorkspaceEvent)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('workspaceChanged', handleWorkspaceEvent)
    }
  }, [])

  useEffect(() => {
    if (selectedCategoryId) {
      fetchEntries(selectedCategoryId)
    }
  }, [selectedCategoryId])

  const fetchCategories = async (wsId: string) => {
    try {
      const res = await fetch(`/api/categories?workspaceId=${wsId}`)
      const data = await res.json()
      setCategories(data)
      if (data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data[0].id)
      }
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setIsLoading(false)
    }
  }

  const fetchEntries = async (categoryId: string) => {
    try {
      const res = await fetch(`/api/entries?categoryId=${categoryId}`)
      const data = await res.json()
      setEntries(data)
    } catch (error) {
      console.error('Error fetching entries:', error)
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setEntries(entries.filter(e => e.id !== entryId))
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="text-center py-12 text-gray-400">Loading...</div>
      </ClientLayout>
    )
  }

  if (!workspaceId) {
    return (
      <ClientLayout>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h2 className="text-xl font-semibold mb-2 text-white">No workspace selected</h2>
          <p className="text-gray-400 mb-4">Please select or create a workspace first</p>
          <a
            href="/workspaces"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Workspaces
          </a>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-white">📋 List View</h1>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg shadow-lg border border-gray-800">
            <div className="text-6xl mb-4">🏷️</div>
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
          <>
            <div className="bg-gray-900 rounded-lg shadow-lg p-4 mb-6 border border-gray-800">
              <label className="block text-sm font-medium mb-2 text-gray-300">Select Category</label>
              <select
                value={selectedCategoryId || ''}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory && (
              <div className="bg-gray-900 rounded-lg shadow-lg p-6 mb-6 border border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{selectedCategory.icon}</span>
                  <h2 className="text-2xl font-semibold text-white">{selectedCategory.name}</h2>
                </div>
              </div>
            )}

            {entries.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-lg shadow-lg border border-gray-800">
                <p className="text-gray-400">No entries yet for this category</p>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-2">
                          📅 {formatDate(entry.entryDate)}
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-white">{entry.title}</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">{entry.content}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="px-3 py-1 text-red-400 hover:bg-gray-800 rounded transition-colors ml-4"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ClientLayout>
  )
}
