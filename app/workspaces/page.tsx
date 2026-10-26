'use client'

import { useState, useEffect } from 'react'
import { Workspace } from '@/types'
import ClientLayout from '@/components/ClientLayout'
import Dialog from '@/components/Dialog'
import { CloseIcon, FolderIcon, PencilIcon, PlusIcon, TagIcon, TrashIcon } from '@/components/icons'

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
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="page-title">Workspaces</h1>
            <p className="page-subtitle">Separate your notes into focused spaces.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm ? 'btn-secondary' : 'btn-primary'}
          >
            {showForm ? <CloseIcon width={16} height={16} /> : <PlusIcon width={16} height={16} />}
            {showForm ? 'Cancel' : 'New Workspace'}
          </button>
        </div>

        {showForm && (
          <div className="card mb-6 p-6">
            <h2 className="mb-5 text-base font-semibold text-slate-900">Create New Workspace</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Skripsi"
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional..."
                  rows={3}
                  className="input resize-none"
                />
              </div>
              <button
                type="submit"
                className="btn-primary w-full"
              >
                Create Workspace
              </button>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading...</div>
        ) : workspaces.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-500">
              <FolderIcon width={24} height={24} />
            </div>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">No workspaces yet</h2>
            <p className="text-sm text-slate-500">Create your first workspace to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {workspaces.map((ws) => (
              <div key={ws.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-base font-bold text-brand-600">
                      {ws.name.charAt(0).toUpperCase()}
                    </span>
                    <h3 className="truncate text-base font-semibold text-slate-900">{ws.name}</h3>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => handleEdit(ws)}
                      className="icon-btn"
                      aria-label="Edit workspace"
                    >
                      <PencilIcon width={15} height={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(ws.id)}
                      className="icon-btn-danger"
                      aria-label="Delete workspace"
                    >
                      <TrashIcon width={15} height={15} />
                    </button>
                  </div>
                </div>
                {ws.description && (
                  <p className="mt-3 text-sm text-slate-500">{ws.description}</p>
                )}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <TagIcon width={13} height={13} />
                    {ws._count?.categories || 0} categories
                  </span>
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
            <label className="label">Name *</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              placeholder="Workspace name"
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              placeholder="Optional..."
              rows={3}
              className="input resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditingWorkspace(null)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Dialog>
    </ClientLayout>
  )
}
