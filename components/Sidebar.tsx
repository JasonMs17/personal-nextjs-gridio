'use client'

import { Workspace } from '@/types'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  CloseIcon,
  FolderIcon,
  GridIcon,
  ListIcon,
  Logo,
  LogoutIcon,
  PlusIcon,
  SettingsIcon,
  TagIcon,
  WalletIcon
} from '@/components/icons'

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
    { path: '/', label: 'Overview', icon: GridIcon },
    { path: '/list', label: 'List View', icon: ListIcon },
    { path: '/categories', label: 'Categories', icon: TagIcon },
    { path: '/budget', label: 'Budget', icon: WalletIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
    { path: '/workspaces', label: 'Workspaces', icon: FolderIcon }
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
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200/70 bg-white px-4 py-6 transform transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
        isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full'
      }`}
    >
      <div className="mb-8 flex items-center justify-between px-2">
        <Logo />
        <button type="button" onClick={onClose} className="icon-btn lg:hidden" aria-label="Close sidebar">
          <CloseIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {currentWorkspace ? (
          <>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.path
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onNavigate}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={isActive ? 'text-brand-500' : 'text-slate-400 group-hover:text-slate-600'} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-8">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Workspaces
              </p>
              <div className="space-y-0.5">
                {workspaces.map((ws) => {
                  const isActive = ws.id === currentWorkspace.id
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => onWorkspaceChange(ws.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold ${
                          isActive ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {ws.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex-1 truncate font-medium">{ws.name}</span>
                      <span className={`text-xs ${isActive ? 'text-brand-600' : 'text-slate-400'}`}>
                        {ws._count?.categories || 0}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
            <p className="text-sm font-semibold text-brand-700">Welcome to Gridio</p>
            <p className="mt-1 text-xs text-brand-700/80">Create your first workspace to get started.</p>
            <Link
              href="/workspaces"
              onClick={onNavigate}
              className="btn-primary mt-4 w-full"
            >
              <PlusIcon width={16} height={16} />
              Create Workspace
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <Link
          href="/workspaces"
          onClick={onNavigate}
          className="grid h-11 w-11 place-items-center rounded-full bg-brand-500 text-white shadow-float transition hover:bg-brand-600"
          aria-label="Manage workspaces"
        >
          <PlusIcon width={20} height={20} strokeWidth={2.2} />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogoutIcon width={16} height={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}
