'use client'

import { useState, useEffect } from 'react'
import { Category } from '@/types'
import ClientLayout from '@/components/ClientLayout'

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
        <div className="text-center py-12 text-gray-400">Loading categories...</div>
      </ClientLayout>
    )
  }

  console.log('📌 Categories - Render with state:', { workspaceId, isLoading, categoriesCount: categories.length })

  if (!workspaceId) {
    console.log('⚠️ Categories - No workspace ID, showing warning')
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">🏷️ Categories</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancel' : '➕ New Category'}
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-900 rounded-lg shadow-lg p-6 mb-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-white">Create New Category</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Progress"
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Icon</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    maxLength={2}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-11 border border-gray-700 rounded cursor-pointer bg-gray-800"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Create Category
              </button>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg shadow-lg border border-gray-800">
            <div className="text-6xl mb-4">🏷️</div>
            <h2 className="text-xl font-semibold mb-2 text-white">No categories yet</h2>
            <p className="text-gray-400">Create your first category to start taking notes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-gray-900 rounded-lg shadow-lg p-6 border-l-4 border-gray-800"
                style={{ borderLeftColor: cat.color }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{cat.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{cat.name}</h3>
                      <div
                        className="inline-block px-2 py-1 rounded text-xs text-white mt-1"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.color}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="px-3 py-1 text-red-400 hover:bg-gray-800 rounded transition-colors"
                  >
                    🗑️
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
