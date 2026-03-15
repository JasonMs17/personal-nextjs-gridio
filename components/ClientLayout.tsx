'use client'

import { useState, useEffect } from 'react'
import { Workspace } from '@/types'
import Sidebar from '@/components/Sidebar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces')
      const data = await res.json()
      console.log('🔄 ClientLayout - Fetched workspaces:', data.length)
      setWorkspaces(data)
      
      // Set current workspace from localStorage or first workspace
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
      console.log('🔄 ClientLayout - Saved workspace ID:', savedWorkspaceId)
      
      const workspace = savedWorkspaceId 
        ? data.find((ws: Workspace) => ws.id === savedWorkspaceId) || data[0]
        : data[0]
      
      console.log('🔄 ClientLayout - Setting current workspace:', workspace?.name)
      setCurrentWorkspace(workspace || null)
      
      // Always save the workspace ID to localStorage to ensure persistence
      if (workspace?.id) {
        localStorage.setItem('currentWorkspaceId', workspace.id)
        console.log('🔄 ClientLayout - Persisted workspace ID to localStorage:', workspace.id)
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find(ws => ws.id === workspaceId)
    if (workspace) {
      console.log('✅ ClientLayout - Workspace changed to:', workspace.name)
      setCurrentWorkspace(workspace)
      localStorage.setItem('currentWorkspaceId', workspaceId)
      console.log('✅ ClientLayout - Saved to localStorage:', workspaceId)
      
      // Dispatch custom event for pages to listen
      window.dispatchEvent(new CustomEvent('workspaceChanged', { detail: { workspaceId } }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
      />
      <main className="flex-1 p-8 bg-gray-950">
        {children}
      </main>
    </div>
  )
}
