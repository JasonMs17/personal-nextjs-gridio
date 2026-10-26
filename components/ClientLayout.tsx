'use client'

import { useState, useEffect } from 'react'
import { Workspace } from '@/types'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { HomeIcon, Logo, MenuIcon } from '@/components/icons'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <div className="h-1 w-32 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-500" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-sm lg:hidden"
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

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 lg:hidden"
                aria-label="Open menu"
              >
                <MenuIcon />
              </button>
              <Link
                href="/"
                className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-900"
              >
                <HomeIcon width={16} height={16} />
                <span className="hidden sm:inline">Home</span>
              </Link>
              {currentWorkspace && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="truncate text-sm font-semibold text-slate-900">{currentWorkspace.name}</span>
                </>
              )}
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
