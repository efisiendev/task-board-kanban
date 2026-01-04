import { useState } from 'react'
import { Flame, Calendar } from '../../../lib/icons'

export type SortOption = 'order' | 'priority' | 'due_date'

interface ColumnSortMenuProps {
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}

export function ColumnSortMenu({ sortBy, onSortChange }: ColumnSortMenuProps) {
  const [showMenu, setShowMenu] = useState(false)

  const handleSortSelect = (option: SortOption) => {
    onSortChange(option)
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1.5 hover:bg-white/50 rounded transition"
        title="Sort tasks"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => handleSortSelect('order')}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition ${
                sortBy === 'order' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              Manual Order
            </button>
            <button
              onClick={() => handleSortSelect('priority')}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition flex items-center gap-2 ${
                sortBy === 'priority' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              <Flame className="w-4 h-4" /> Priority
            </button>
            <button
              onClick={() => handleSortSelect('due_date')}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition flex items-center gap-2 ${
                sortBy === 'due_date' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" /> Due Date
            </button>
          </div>
        </>
      )}
    </div>
  )
}
