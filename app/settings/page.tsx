'use client'

import { useState, useEffect } from 'react'
import ClientLayout from '@/components/ClientLayout'

export default function SettingsPage() {
  const [gridColumns, setGridColumns] = useState(3)

  useEffect(() => {
    const saved = localStorage.getItem('gridColumns')
    if (saved) {
      setGridColumns(parseInt(saved))
    }
  }, [])

  const handleColumnChange = (value: number) => {
    setGridColumns(value)
    localStorage.setItem('gridColumns', value.toString())
  }

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-white">⚙️ Settings</h1>

        <div className="bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-white">Grid View Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Number of Columns: {gridColumns}
              </label>
              <input
                type="range"
                min="1"
                max="6"
                value={gridColumns}
                onChange={(e) => handleColumnChange(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-400">
                💡 Adjust the number of columns displayed in the grid view. Changes are saved automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg shadow-lg p-6 mt-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-white">About Grid Notes</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p>📝 Version: 1.0.0</p>
            <p>🔗 Built with Next.js, Prisma & Supabase</p>
            <p>✨ A simple daily note-taking app organized in grids</p>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}
