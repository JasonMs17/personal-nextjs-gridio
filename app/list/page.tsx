'use client'

import { useState, useEffect } from 'react'
import { Category, Entry } from '@/types'
import ClientLayout from '@/components/ClientLayout'
import { CalendarIcon, FolderIcon, NoteIcon, TagIcon, TrashIcon } from '@/components/icons'

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
        <div className="py-12 text-center text-sm text-slate-400">Loading...</div>
      </ClientLayout>
    )
  }

  if (!workspaceId) {
    return (
      <ClientLayout>
        <div className="card mx-auto flex max-w-lg flex-col items-center px-6 py-14 text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-500">
            <FolderIcon width={24} height={24} />
          </div>
          <h2 className="mb-1 text-lg font-semibold text-slate-900">No workspace selected</h2>
          <p className="mb-5 text-sm text-slate-500">Please select or create a workspace first</p>
          <a
            href="/workspaces"
            className="btn-primary"
          >
            Go to Workspaces
          </a>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="page-title">List View</h1>
          <p className="page-subtitle">Browse every note you have written, per category.</p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-500">
              <TagIcon width={24} height={24} />
            </div>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">No categories yet</h2>
            <p className="mb-5 text-sm text-slate-500">Create categories to start taking notes</p>
            <a
              href="/categories"
              className="btn-primary"
            >
              Create Category
            </a>
          </div>
        ) : (
          <>
            <div className="card mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              {selectedCategory && (
                <div className="flex flex-1 items-center gap-3">
                  <span
                    className="grid h-12 w-12 place-items-center rounded-full text-2xl"
                    style={{ backgroundColor: `${selectedCategory.color}1f` }}
                  >
                    {selectedCategory.icon}
                  </span>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Category</p>
                    <h2 className="text-lg font-bold text-slate-900">{selectedCategory.name}</h2>
                  </div>
                </div>
              )}
              <div className="sm:w-64">
                <label className="label">Select Category</label>
                <select
                  value={selectedCategoryId || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="input"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {entries.length === 0 ? (
              <div className="card flex flex-col items-center px-6 py-12 text-center">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                  <NoteIcon width={22} height={22} />
                </div>
                <p className="text-sm text-slate-500">No entries yet for this category</p>
              </div>
            ) : (
              <div className="card divide-y divide-slate-100">
                {entries.map((entry) => (
                  <div key={entry.id} className="group flex items-start gap-4 p-5">
                    <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400 sm:grid">
                      <CalendarIcon width={18} height={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 text-xs font-medium text-slate-400">
                        {formatDate(entry.entryDate)}
                      </div>
                      <h3 className="mb-1 text-base font-semibold text-slate-900">{entry.title}</h3>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{entry.content}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="icon-btn-danger"
                      aria-label="Delete entry"
                    >
                      <TrashIcon width={16} height={16} />
                    </button>
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
