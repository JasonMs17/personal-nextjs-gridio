'use client'

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
    <div className="bg-gray-900 rounded border border-gray-800 p-3 mb-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button
          onClick={handlePrev}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded transition"
        >
          ← Prev
        </button>
        
        <button
          onClick={handleToday}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded transition"
        >
          Today
        </button>
        
        <button
          onClick={handleNext}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded transition"
        >
          Next →
        </button>

        <input
          type="date"
          value={getInputValue()}
          onChange={handleDateSelect}
          className="w-full sm:w-40 px-3 py-1.5 bg-gray-800 border border-gray-700 text-xs text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        </div>
      </div>
    </div>
  )
}
