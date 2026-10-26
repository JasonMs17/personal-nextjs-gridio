'use client'

import { useMemo, useState } from 'react'
import { BudgetTransaction } from '@/types'
import {
  apiDateKey,
  countsTowardTotals,
  formatCompactCurrency,
  formatCurrency,
  keyToDate,
  toDateKey
} from '@/lib/budget'

interface DailySpendingChartProps {
  transactions: BudgetTransaction[]
  days: string[]
}

const PLOT_HEIGHT = 112

const niceCeil = (value: number) => {
  if (value <= 0) return 0
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value) ?? 10
  return step * magnitude
}

export default function DailySpendingChart({ transactions, days }: DailySpendingChartProps) {
  const [active, setActive] = useState<number | null>(null)
  const today = toDateKey(new Date())

  const values = useMemo(() => {
    const byDay = new Map<string, number>()
    transactions
      .filter((t) => t.type === 'expense' && countsTowardTotals(t))
      .forEach((t) => {
        const key = apiDateKey(t.transactionDate)
        byDay.set(key, (byDay.get(key) ?? 0) + Number(t.amount))
      })
    return days.map((key) => ({ key, amount: byDay.get(key) ?? 0 }))
  }, [transactions, days])

  const peak = values.reduce((best, v) => (v.amount > best.amount ? v : best), { key: '', amount: 0 })
  const scaleMax = niceCeil(peak.amount)
  const activeValue = active !== null ? values[active] : null
  const dayLabel = (key: string) =>
    keyToDate(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Daily spending</h2>
          <p className="text-xs text-slate-500">
            {peak.amount > 0 ? `Peak ${formatCurrency(peak.amount)} on ${dayLabel(peak.key)}` : 'No spending yet this month'}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {/* Y axis ticks */}
        <div className="relative w-12 shrink-0 text-right text-[10px] tabular-nums text-slate-400" style={{ height: PLOT_HEIGHT }}>
          {scaleMax > 0 && (
            <>
              <span className="absolute right-0 -translate-y-1/2" style={{ top: 0 }}>{formatCompactCurrency(scaleMax)}</span>
              <span className="absolute right-0 -translate-y-1/2" style={{ top: PLOT_HEIGHT / 2 }}>{formatCompactCurrency(scaleMax / 2)}</span>
            </>
          )}
          <span className="absolute right-0 -translate-y-1/2" style={{ top: PLOT_HEIGHT }}>0</span>
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Gridlines: hairline, solid, recessive */}
          <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-slate-100" />
          <div className="pointer-events-none absolute inset-x-0 border-t border-slate-100" style={{ top: PLOT_HEIGHT / 2 }} />

          <div className="relative flex items-end gap-[2px] border-b border-slate-200" style={{ height: PLOT_HEIGHT }} onMouseLeave={() => setActive(null)}>
            {values.map((v, i) => {
              const height = scaleMax > 0 ? (v.amount / scaleMax) * PLOT_HEIGHT : 0
              return (
                <button
                  key={v.key}
                  type="button"
                  aria-label={`${dayLabel(v.key)}: ${formatCurrency(v.amount)}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="flex h-full min-w-0 flex-1 cursor-default items-end justify-center outline-none"
                >
                  {v.amount > 0 && (
                    <span
                      className={`block w-full max-w-6 rounded-t transition-colors ${
                        active === i ? 'bg-brand-700' : v.key === today ? 'bg-brand-600' : 'bg-brand-500'
                      }`}
                      style={{ height: Math.max(height, 2) }}
                    />
                  )}
                </button>
              )
            })}

            {activeValue && active !== null && (
              <div
                className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg"
                style={{ left: `${((active + 0.5) / values.length) * 100}%` }}
              >
                <p className="font-semibold tabular-nums text-slate-900">{formatCurrency(activeValue.amount)}</p>
                <p className="text-slate-500">{dayLabel(activeValue.key)}</p>
              </div>
            )}
          </div>

          {/* X axis */}
          <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-slate-400">
            <span>{keyToDate(days[0]).getDate()}</span>
            <span>{keyToDate(days[Math.floor(days.length / 2)]).getDate()}</span>
            <span>{keyToDate(days[days.length - 1]).getDate()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
