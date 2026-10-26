'use client'

import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Dialog from '@/components/Dialog'
import ConfirmDialog from '@/components/budget/ConfirmDialog'
import { PencilIcon, PlusIcon, TrashIcon, WalletIcon } from '@/components/icons'
import { Account, BudgetTransaction } from '@/types'
import { formatCurrency, parseAmount } from '@/lib/budget'

interface AccountsTabProps {
  accounts: Account[]
  transactions: BudgetTransaction[]
  onChanged: () => Promise<void>
}

export default function AccountsTab({ accounts, transactions, onChanged }: AccountsTabProps) {
  const [name, setName] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [editName, setEditName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deleting, setDeleting] = useState<Account | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

  // Money in/out per account for the selected month (transfers included)
  const flows = useMemo(() => {
    const map = new Map<string, { inflow: number; outflow: number }>()
    const bump = (id: string | null, key: 'inflow' | 'outflow', amount: number) => {
      if (!id) return
      const current = map.get(id) ?? { inflow: 0, outflow: 0 }
      current[key] += amount
      map.set(id, current)
    }
    transactions.forEach((t) => {
      const amount = Number(t.amount)
      if (t.type === 'income') bump(t.accountId, 'inflow', amount)
      if (t.type === 'expense') bump(t.accountId, 'outflow', amount)
      if (t.type === 'transfer') {
        bump(t.accountId, 'outflow', amount)
        bump(t.toAccountId, 'inflow', amount)
      }
    })
    return map
  }, [transactions])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Account name is required')
      return
    }
    const initialBalance = openingBalance.trim() ? parseAmount(openingBalance) : 0
    if (Number.isNaN(initialBalance)) {
      toast.error('Opening balance must be a number')
      return
    }
    setIsCreating(true)
    try {
      const res = await fetch('/api/budget/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), initialBalance })
      })
      if (!res.ok) throw new Error()
      toast.success('Account created')
      setName('')
      setOpeningBalance('')
      await onChanged()
    } catch {
      toast.error('Failed to create account')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !editName.trim()) {
      toast.error('Account name is required')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch(`/api/budget/accounts/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      })
      if (!res.ok) throw new Error()
      toast.success('Account updated')
      setEditing(null)
      await onChanged()
    } catch {
      toast.error('Failed to update account')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/budget/accounts/${deleting.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Account deleted')
      setDeleting(null)
      await onChanged()
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500">Total balance</p>
          <p className={`mt-1 text-3xl font-bold tracking-tight ${totalBalance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatCurrency(totalBalance)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}</p>
        </div>

        <form onSubmit={handleCreate} className="card flex flex-col gap-3 p-5 lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Add account</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name, e.g. BCA, Cash, GoPay"
              aria-label="Account name"
              className="input sm:flex-1"
            />
            <div className="relative sm:w-48">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-slate-400">Rp</span>
              <input
                type="text"
                inputMode="decimal"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="Opening balance"
                aria-label="Opening balance"
                className="input pl-10"
              />
            </div>
            <button type="submit" disabled={isCreating} className="btn-primary">
              <PlusIcon width={16} height={16} />
              {isCreating ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>

      {accounts.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-500">
            <WalletIcon width={22} height={22} />
          </div>
          <p className="text-sm font-semibold text-slate-900">No accounts yet</p>
          <p className="mt-1 text-sm text-slate-500">Add the wallets and bank accounts you spend from.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => {
            const flow = flows.get(a.id)
            const balance = Number(a.balance)
            return (
              <div key={a.id} className="card group p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-600">
                      {a.name.charAt(0).toUpperCase()}
                    </span>
                    <p className="truncate text-sm font-semibold text-slate-900">{a.name}</p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(a)
                        setEditName(a.name)
                      }}
                      className="icon-btn"
                      aria-label={`Rename ${a.name}`}
                    >
                      <PencilIcon width={14} height={14} />
                    </button>
                    <button type="button" onClick={() => setDeleting(a)} className="icon-btn-danger" aria-label={`Delete ${a.name}`}>
                      <TrashIcon width={14} height={14} />
                    </button>
                  </div>
                </div>
                <p className={`mt-4 text-xl font-bold tracking-tight ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {formatCurrency(balance)}
                </p>
                <div className="mt-3 flex gap-4 border-t border-slate-100 pt-3 text-xs tabular-nums">
                  <span className="text-slate-500">
                    In <span className="font-semibold text-emerald-600">{formatCurrency(flow?.inflow ?? 0)}</span>
                  </span>
                  <span className="text-slate-500">
                    Out <span className="font-semibold text-slate-900">{formatCurrency(flow?.outflow ?? 0)}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog isOpen={editing !== null} onClose={() => setEditing(null)} title="Rename account">
        <form className="space-y-4" onSubmit={handleSaveEdit}>
          <div>
            <label className="label" htmlFor="account-name">Account name</label>
            <input
              id="account-name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSaving || !editName.trim()} className="btn-primary">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        isOpen={deleting !== null}
        title="Delete account"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      >
        <p>
          Delete <span className="font-semibold text-slate-900">&ldquo;{deleting?.name}&rdquo;</span>?
        </p>
        <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          All transactions recorded in this account, including transfers to or from it, will be permanently deleted.
        </p>
      </ConfirmDialog>
    </div>
  )
}
