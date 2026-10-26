'use client'

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'

interface DateNavigatorProps {
  currentDate: Date
  onDateChange: (date: Date) => void
}

export default function DateNavigator({ currentDate, onDateChange }: DateNavigatorProps) {
  const handlePrev = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    onDateChange(newDate)
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(new Date(e.target.value))
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getInputValue = () => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return (
    <div className="card mb-6 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-2 sm:pl-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-500">
          <CalendarIcon width={18} height={18} />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Selected date</p>
          <p className="text-sm font-semibold text-slate-900">{formatDate(currentDate)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
          <button
            onClick={handlePrev}
            className="icon-btn"
            aria-label="Previous day"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={handleToday}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-50"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="icon-btn"
            aria-label="Next day"
          >
            <ChevronRightIcon />
          </button>
        </div>

        <input
          type="date"
          value={getInputValue()}
          onChange={handleDateSelect}
          className="input w-full py-2 text-xs sm:w-40"
        />
      </div>
    </div>
  )
}
