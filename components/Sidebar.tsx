'use client'

import { Workspace } from '@/types'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface SidebarProps {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  onWorkspaceChange: (workspaceId: string) => void
  onNavigate?: () => void
  onClose?: () => void
  isOpen?: boolean
}

export default function Sidebar({ workspaces, currentWorkspace, onWorkspaceChange, onNavigate, onClose, isOpen }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const navItems = [
    { path: '/', label: '📊 Grid View' },
    { path: '/list', label: '📋 List View' },
    { path: '/categories', label: '🏷️ Categories' },
    { path: '/budget', label: '💰 Budget' },
    { path: '/settings', label: '⚙️ Settings' },
    { path: '/workspaces', label: '📁 Workspaces' }
  ]

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem('currentWorkspaceId')
      router.replace('/login')
    } catch (error) {
      console.error('Error signing out', error)
    }
  }

  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 w-72 bg-gray-950 border-r border-gray-800 p-4 transform transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">📝 Grid Notes</h1>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
        
      {workspaces.length > 0 ? (
        currentWorkspace && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Workspace
            </label>
            <select
              value={currentWorkspace.id}
              onChange={(e) => onWorkspaceChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>
        )
      ) : (
        <div className="mb-4 p-3 bg-gray-900 border border-gray-700 rounded text-sm">
          <p className="text-blue-400 font-medium mb-1">👋 Welcome!</p>
          <p className="text-gray-400 text-xs">Create your first workspace to get started</p>
        </div>
      )}

      {currentWorkspace ? (
        <>
          <div className="border-t border-gray-800 pt-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">Navigation</h2>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onNavigate}
                    className={`block px-3 py-2 rounded transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Quick Stats</h3>
            <p className="text-sm text-gray-300">
              📌 Categories: {currentWorkspace._count?.categories || 0}
            </p>
          </div>

          <div className="border-t border-gray-800 pt-4 mt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <div className="border-t border-gray-800 pt-4">
          <Link
            href="/workspaces"
            onClick={onNavigate}
            className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded hover:bg-blue-700 transition-colors font-medium"
          >
            📁 Create Workspace
          </Link>
          <div className="border-t border-gray-800 pt-4 mt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
