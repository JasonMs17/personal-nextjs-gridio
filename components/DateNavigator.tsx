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
    <div className="bg-gray-900 rounded-lg shadow-lg p-4 mb-6 border border-gray-800">
      <div className="flex items-center gap-3">
        <button
          onClick={handlePrev}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors border border-gray-700"
        >
          ⬅️ Prev
        </button>
        
        <button
          onClick={handleToday}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
        >
          Today
        </button>
        
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors border border-gray-700"
        >
          Next ➡️
        </button>

        <input
          type="date"
          value={getInputValue()}
          onChange={handleDateSelect}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded font-medium text-white">
          📅 {formatDate(currentDate)}
        </div>
      </div>
    </div>
  )
}
