'use client'

import { useState, useEffect } from 'react'
import { Workspace } from '@/types'
import ClientLayout from '@/components/ClientLayout'
import Dialog from '@/components/Dialog'

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [editFormData, setEditFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces')
      const data = await res.json()
      setWorkspaces(data)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const newWorkspace = await res.json()
        setWorkspaces([newWorkspace, ...workspaces])
        setFormData({ name: '', description: '' })
        setShowForm(false)
        localStorage.setItem('currentWorkspaceId', newWorkspace.id)
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will delete all categories and entries in this workspace.')) return

    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setWorkspaces(workspaces.filter(ws => ws.id !== id))
        const currentId = localStorage.getItem('currentWorkspaceId')
        if (currentId === id) {
          localStorage.removeItem('currentWorkspaceId')
        }
      }
    } catch (error) {
      console.error('Error deleting workspace:', error)
    }
  }

  const handleEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace)
    setEditFormData({
      name: workspace.name,
      description: workspace.description || ''
    })
  }

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingWorkspace || !editFormData.name.trim()) return

    try {
      const res = await fetch(`/api/workspaces/${editingWorkspace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })

      if (res.ok) {
        const updatedWorkspace = await res.json()
        setWorkspaces(workspaces.map(ws => ws.id === updatedWorkspace.id ? updatedWorkspace : ws))
        setEditingWorkspace(null)
        setEditFormData({ name: '', description: '' })
      }
    } catch (error) {
      console.error('Error updating workspace:', error)
    }
  }

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">📁 Workspaces</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancel' : '➕ New Workspace'}
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-900 rounded-lg shadow-lg p-6 mb-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-white">Create New Workspace</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Skripsi"
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Create Workspace
              </button>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg shadow-lg border border-gray-800">
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-xl font-semibold mb-2 text-white">No workspaces yet</h2>
            <p className="text-gray-400">Create your first workspace to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workspaces.map((ws) => (
              <div key={ws.id} className="bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 text-white">{ws.name}</h3>
                    {ws.description && (
                      <p className="text-gray-400 mb-2">{ws.description}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      📌 {ws._count?.categories || 0} categories
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(ws)}
                      className="px-3 py-1 text-blue-400 hover:bg-gray-800 rounded transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ws.id)}
                      className="px-3 py-1 text-red-400 hover:bg-gray-800 rounded transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        isOpen={editingWorkspace !== null}
        onClose={() => setEditingWorkspace(null)}
        title="Edit Workspace"
      >
        <form onSubmit={handleUpdateWorkspace} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Name *</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              placeholder="Workspace name"
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
            <textarea
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              placeholder="Optional..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditingWorkspace(null)}
              className="flex-1 bg-gray-800 text-gray-300 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Dialog>
    </ClientLayout>
  )
}
