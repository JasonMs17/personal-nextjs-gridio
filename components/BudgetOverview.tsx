'use client'

interface BudgetOverviewProps {
  totalIncome: number
  totalExpense: number
  totalExcluded: number
}

export default function BudgetOverview({ totalIncome, totalExpense, totalExcluded }: BudgetOverviewProps) {
  const formatCurrency = (value: number) =>
    value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

  const net = totalIncome - totalExpense

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3">
      <div className="bg-gray-900 border border-gray-800 rounded p-3 md:p-4">
        <p className="text-xs text-gray-500 mb-1">Income</p>
        <p className="text-base md:text-xl font-bold text-green-400">{formatCurrency(totalIncome)}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded p-3 md:p-4">
        <p className="text-xs text-gray-500 mb-1">Expense</p>
        <p className="text-base md:text-xl font-bold text-red-400">{formatCurrency(totalExpense)}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded p-3 md:p-4">
        <p className="text-xs text-gray-500 mb-1">Excluded</p>
        <p className="text-base md:text-xl font-bold text-yellow-400">{formatCurrency(totalExcluded)}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded p-3 md:p-4">
        <p className="text-xs text-gray-500 mb-1">Net</p>
        <p className={`text-base md:text-xl font-bold ${net >= 0 ? 'text-green-300' : 'text-red-300'}`}>
          {formatCurrency(net)}
        </p>
      </div>
    </div>
  )
}
