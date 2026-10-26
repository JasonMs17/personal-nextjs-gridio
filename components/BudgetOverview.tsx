'use client'

import { ArrowDownLeftIcon, ArrowUpRightIcon, ScaleIcon, SlashIcon } from '@/components/icons'

interface BudgetOverviewProps {
  totalIncome: number
  totalExpense: number
  totalExcluded: number
}

export default function BudgetOverview({ totalIncome, totalExpense, totalExcluded }: BudgetOverviewProps) {
  const formatCurrency = (value: number) =>
    value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

  const net = totalIncome - totalExpense

  const stats = [
    { label: 'Income', value: totalIncome, icon: ArrowDownLeftIcon, badge: 'bg-brand-50 text-brand-500', text: 'text-slate-900' },
    { label: 'Expense', value: totalExpense, icon: ArrowUpRightIcon, badge: 'bg-rose-50 text-rose-500', text: 'text-slate-900' },
    { label: 'Excluded', value: totalExcluded, icon: SlashIcon, badge: 'bg-amber-50 text-amber-500', text: 'text-slate-900' },
    {
      label: 'Net',
      value: net,
      icon: ScaleIcon,
      badge: net >= 0 ? 'bg-violet-50 text-violet-500' : 'bg-rose-50 text-rose-500',
      text: net >= 0 ? 'text-brand-600' : 'text-rose-500'
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(({ label, value, icon: Icon, badge, text }) => (
        <div key={label} className="card p-4">
          <div className={`mb-3 grid h-8 w-8 place-items-center rounded-full ${badge}`}>
            <Icon width={16} height={16} strokeWidth={2.2} />
          </div>
          <p className={`truncate text-base font-bold tracking-tight md:text-lg ${text}`}>{formatCurrency(value)}</p>
          <p className="mt-0.5 text-xs text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  )
}
