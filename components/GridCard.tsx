'use client'

import { GridItem } from '@/types'
import { useState } from 'react'

interface GridCardProps {
  item: GridItem
  onSave: (title: string, content: string) => Promise<void>
  onDelete?: () => Promise<void>
}

export default function GridCard({ item, onSave, onDelete }: GridCardProps) {
  const [title, setTitle] = useState(item.title)
  const [content, setContent] = useState(item.content)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(title, content)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-4 border-t-4 hover:shadow-xl transition-shadow" style={{ borderTopColor: item.categoryColor }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <span>{item.categoryIcon}</span>
          <span>{item.categoryName}</span>
        </h3>
      </div>

      {/* Display existing entry */}
      {item.entryId && item.title && (
        <div className="mb-3 p-3 bg-gray-800 rounded border border-gray-700">
          <p className="font-medium text-sm mb-1 text-white">{item.title}</p>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.content}</p>
          {onDelete && (
            <button
              onClick={onDelete}
              className="mt-2 text-xs text-red-400 hover:text-red-300"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSave} className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quick note..."
          className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Details..."
          rows={3}
          className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 transition-colors text-sm font-medium"
        >
          {isSaving ? '💾 Saving...' : '💾 Save'}
        </button>
      </form>
    </div>
  )
}
