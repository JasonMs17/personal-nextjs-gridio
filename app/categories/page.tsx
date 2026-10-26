'use client'

import { useState, useEffect } from 'react'
import { Category } from '@/types'
import ClientLayout from '@/components/ClientLayout'
import { CloseIcon, FolderIcon, PlusIcon, TagIcon, TrashIcon } from '@/components/icons'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', icon: '📝', color: '#3B82F6' })
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
    console.log('📌 Categories - Checking localStorage:', { savedWorkspaceId })
    setWorkspaceId(savedWorkspaceId)
    
    if (savedWorkspaceId) {
      console.log('📌 Categories - Fetching categories for workspace:', savedWorkspaceId)
      fetchCategories(savedWorkspaceId)
    } else {
      console.log('⚠️ Categories - No workspace ID found')
      setIsLoading(false)
    }

    // Listen for storage changes (when workspace is selected in sidebar)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentWorkspaceId' && e.newValue) {
        console.log('📌 Categories - Workspace changed via storage event:', e.newValue)
        setWorkspaceId(e.newValue)
        fetchCategories(e.newValue)
      }
    }

    // Listen for custom workspace change event
    const handleWorkspaceEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      console.log('📌 Categories - Workspace changed via custom event:', customEvent.detail.workspaceId)
      setWorkspaceId(customEvent.detail.workspaceId)
      fetchCategories(customEvent.detail.workspaceId)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('workspaceChanged', handleWorkspaceEvent)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('workspaceChanged', handleWorkspaceEvent)
    }
  }, [])

  const fetchCategories = async (wsId: string) => {
    try {
      const res = await fetch(`/api/categories?workspaceId=${wsId}`)
      const data = await res.json()
      setCategories(data)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Category name is required')
      return
    }
    
    if (!workspaceId) {
      alert('Please select a workspace first')
      return
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, workspaceId })
      })

      if (res.ok) {
        const newCategory = await res.json()
        setCategories([...categories, newCategory])
        setFormData({ name: '', icon: '📝', color: '#3B82F6' })
        setShowForm(false)
      } else {
        const error = await res.json()
        alert('Error creating category: ' + error.error)
      }
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Error creating category')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete all entries in this category.')) return

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setCategories(categories.filter(cat => cat.id !== id))
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="py-12 text-center text-sm text-slate-400">Loading categories...</div>
      </ClientLayout>
    )
  }

  console.log('📌 Categories - Render with state:', { workspaceId, isLoading, categoriesCount: categories.length })

  if (!workspaceId) {
    console.log('⚠️ Categories - No workspace ID, showing warning')
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
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="page-title">Categories</h1>
            <p className="page-subtitle">Each category becomes a card in your daily grid.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm ? 'btn-secondary' : 'btn-primary'}
          >
            {showForm ? <CloseIcon width={16} height={16} /> : <PlusIcon width={16} height={16} />}
            {showForm ? 'Cancel' : 'New Category'}
          </button>
        </div>

        {showForm && (
          <div className="card mb-6 p-6">
            <h2 className="mb-5 text-base font-semibold text-slate-900">Create New Category</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Progress"
                  required
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Icon</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    maxLength={2}
                    className="input py-2 text-center text-2xl"
                  />
                </div>
                <div>
                  <label className="label">Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-[50px] w-full cursor-pointer rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary w-full"
              >
                Create Category
              </button>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-500">
              <TagIcon width={24} height={24} />
            </div>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">No categories yet</h2>
            <p className="text-sm text-slate-500">Create your first category to start taking notes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="card relative overflow-hidden p-5"
              >
                <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: cat.color }} />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-12 w-12 place-items-center rounded-full text-2xl"
                      style={{ backgroundColor: `${cat.color}1f` }}
                    >
                      {cat.icon}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{cat.name}</h3>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium uppercase text-slate-400">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.color}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="icon-btn-danger"
                    aria-label="Delete category"
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
