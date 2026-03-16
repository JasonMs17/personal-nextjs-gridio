'use client'

import { useState, useEffect } from 'react'
import { Workspace } from '@/types'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem('currentWorkspaceId')
      router.replace('/login')
    } catch (error) {
      console.error('Error signing out', error)
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
    <div className="min-h-screen bg-black">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen">
        <Sidebar
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          onWorkspaceChange={handleWorkspaceChange}
          onNavigate={() => setIsSidebarOpen(false)}
          onClose={() => setIsSidebarOpen(false)}
          isOpen={isSidebarOpen}
        />

        <main className="flex-1 bg-gray-950 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center justify-center rounded-lg bg-gray-800 px-3 py-2 text-white hover:bg-gray-700 transition"
              >
                ☰
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 transition"
              >
                Home
              </Link>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-lg bg-red-600/10 hover:bg-red-600/20 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 transition border border-red-800/30"
            >
              Logout
            </button>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
