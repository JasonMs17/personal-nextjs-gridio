'use client'

import { Workspace } from '@/types'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  onWorkspaceChange: (workspaceId: string) => void
}

export default function Sidebar({ workspaces, currentWorkspace, onWorkspaceChange }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { path: '/', label: '📊 Grid View' },
    { path: '/list', label: '📋 List View' },
    { path: '/categories', label: '🏷️ Categories' },
    { path: '/budget', label: '💰 Budget' },
    { path: '/settings', label: '⚙️ Settings' },
    { path: '/workspaces', label: '📁 Workspaces' }
  ]

  return (
    <div className="w-64 bg-gray-950 border-r border-gray-800 min-h-screen p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4 text-white">📝 Grid Notes</h1>
        
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
      </div>

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
        </>
      ) : (
        <div className="border-t border-gray-800 pt-4">
          <Link
            href="/workspaces"
            className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded hover:bg-blue-700 transition-colors font-medium"
          >
            📁 Create Workspace
          </Link>
        </div>
      )}
    </div>
  )
}
