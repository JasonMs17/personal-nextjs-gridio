'use client'

import { useMemo } from 'react'
import { BudgetTransaction } from '@/types'
import { countsTowardTotals, formatCurrency } from '@/lib/budget'

interface SpendingByCategoryProps {
  transactions: BudgetTransaction[]
}

const MAX_ROWS = 6

export default function SpendingByCategory({ transactions }: SpendingByCategoryProps) {
  const { rows, total } = useMemo(() => {
    const byCategory = new Map<string, number>()
    transactions
      .filter((t) => t.type === 'expense' && countsTowardTotals(t))
      .forEach((t) => {
        const name = t.category?.name ?? 'Uncategorized'
        byCategory.set(name, (byCategory.get(name) ?? 0) + Number(t.amount))
      })

    const sorted = Array.from(byCategory.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)

    // Fold the tail into "Other" rather than growing the list
    const top = sorted.slice(0, MAX_ROWS)
    const rest = sorted.slice(MAX_ROWS)
    if (rest.length > 0) {
      top.push({ name: `Other (${rest.length})`, amount: rest.reduce((s, r) => s + r.amount, 0) })
    }
    return { rows: top, total: sorted.reduce((s, r) => s + r.amount, 0) }
  }, [transactions])

  const max = Math.max(...rows.map((r) => r.amount), 0)

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900">Spending by category</h2>
        <p className="text-xs text-slate-500">Share of this month&apos;s expenses</p>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No spending recorded this month.</p>
      ) : (
        <ul className="space-y-3.5">
          {rows.map((row) => (
            <li key={row.name}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate font-medium text-slate-700">{row.name}</span>
                <span className="shrink-0 tabular-nums text-slate-500">
                  <span className="font-semibold text-slate-900">{formatCurrency(row.amount)}</span>
                  <span className="ml-1.5 inline-block w-9 text-right">{Math.round((row.amount / total) * 100)}%</span>
                </span>
              </div>
              <div className="h-2 rounded-r bg-brand-50">
                <div
                  className="h-full rounded-r bg-brand-500"
                  style={{ width: `${max > 0 ? Math.max((row.amount / max) * 100, 1.5) : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
