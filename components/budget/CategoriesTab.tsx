'use client'

import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Dialog from '@/components/Dialog'
import ConfirmDialog from '@/components/budget/ConfirmDialog'
import { ArrowDownLeftIcon, ArrowUpRightIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/icons'
import { BudgetCategory, BudgetTransaction } from '@/types'
import { CategoryType, formatCurrency } from '@/lib/budget'

interface CategoriesTabProps {
  categories: BudgetCategory[]
  transactions: BudgetTransaction[]
  onChanged: () => Promise<void>
}

const COLUMNS: { type: CategoryType; title: string; hint: string; icon: typeof ArrowUpRightIcon; badge: string }[] = [
  { type: 'expense', title: 'Expense categories', hint: 'e.g. Food, Transport, Bills', icon: ArrowUpRightIcon, badge: 'bg-rose-50 text-rose-500' },
  { type: 'income', title: 'Income categories', hint: 'e.g. Salary, Freelance, Bonus', icon: ArrowDownLeftIcon, badge: 'bg-emerald-50 text-emerald-600' }
]

function CategoryColumn({
  type,
  title,
  hint,
  icon: Icon,
  badge,
  categories,
  usage,
  onChanged,
  onEdit,
  onDelete
}: (typeof COLUMNS)[number] & {
  categories: BudgetCategory[]
  usage: Map<string, { total: number; count: number }>
  onChanged: () => Promise<void>
  onEdit: (category: BudgetCategory) => void
  onDelete: (category: BudgetCategory) => void
}) {
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/budget/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type })
      })
      if (!res.ok) throw new Error()
      toast.success('Category created')
      setName('')
      await onChanged()
    } catch {
      toast.error('Failed to create category')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className={`grid h-8 w-8 place-items-center rounded-full ${badge}`}>
          <Icon width={15} height={15} strokeWidth={2.2} />
        </span>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{categories.length} categories</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 border-b border-slate-100 px-5 py-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`New category — ${hint}`}
          aria-label={`New ${type} category`}
          className="input py-2"
        />
        <button type="submit" disabled={isCreating || !name.trim()} className="btn-primary px-3 py-2" aria-label="Add category">
          <PlusIcon width={16} height={16} />
        </button>
      </form>

      {categories.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-400">No {type} categories yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {categories.map((c) => {
            const used = usage.get(c.id)
            return (
              <li key={c.id} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/80">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">
                    {used ? `${used.count} ${used.count === 1 ? 'transaction' : 'transactions'} this month` : 'Not used this month'}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-slate-900">{used ? formatCurrency(used.total) : '—'}</span>
                <div className="flex shrink-0 gap-0.5 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                  <button type="button" onClick={() => onEdit(c)} className="icon-btn" aria-label={`Edit ${c.name}`}>
                    <PencilIcon width={14} height={14} />
                  </button>
                  <button type="button" onClick={() => onDelete(c)} className="icon-btn-danger" aria-label={`Delete ${c.name}`}>
                    <TrashIcon width={14} height={14} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function CategoriesTab({ categories, transactions, onChanged }: CategoriesTabProps) {
  const [editing, setEditing] = useState<BudgetCategory | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<CategoryType>('expense')
  const [isSaving, setIsSaving] = useState(false)
  const [deleting, setDeleting] = useState<BudgetCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const usage = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>()
    transactions.forEach((t) => {
      if (!t.categoryId) return
      const current = map.get(t.categoryId) ?? { total: 0, count: 0 }
      current.total += Number(t.amount)
      current.count += 1
      map.set(t.categoryId, current)
    })
    return map
  }, [transactions])

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !editName.trim()) {
      toast.error('Category name is required')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch(`/api/budget/categories/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), type: editType })
      })
      if (!res.ok) throw new Error()
      toast.success('Category updated')
      setEditing(null)
      await onChanged()
    } catch {
      toast.error('Failed to update category')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/budget/categories/${deleting.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Category deleted')
      setDeleting(null)
      await onChanged()
    } catch {
      toast.error('Failed to delete category')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {COLUMNS.map((column) => (
        <CategoryColumn
          key={column.type}
          {...column}
          categories={categories.filter((c) => c.type === column.type)}
          usage={usage}
          onChanged={onChanged}
          onEdit={(c) => {
            setEditing(c)
            setEditName(c.name)
            setEditType(c.type)
          }}
          onDelete={setDeleting}
        />
      ))}

      <Dialog isOpen={editing !== null} onClose={() => setEditing(null)} title="Edit category">
        <form className="space-y-4" onSubmit={handleSaveEdit}>
          <div>
            <label className="label" htmlFor="category-name">Name</label>
            <input
              id="category-name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="category-type">Type</label>
            <select
              id="category-type"
              value={editType}
              onChange={(e) => setEditType(e.target.value as CategoryType)}
              className="input"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
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
        title="Delete category"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      >
        <p>
          Delete <span className="font-semibold text-slate-900">&ldquo;{deleting?.name}&rdquo;</span>?
        </p>
        <p className="text-xs text-slate-500">
          Its transactions are kept and will show as Uncategorized.
        </p>
      </ConfirmDialog>
    </div>
  )
}
