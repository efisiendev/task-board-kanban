import { useState, useEffect } from 'react'
import { TaskChecklistItem, TaskPriority } from '../types'

interface SubtaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    title: string
    priority: TaskPriority | null
    due_date: string | null
    estimated_time: number | null
  }) => void
  subtask?: TaskChecklistItem | null
  mode: 'create' | 'edit'
}

export function SubtaskModal({ isOpen, onClose, onSave, subtask, mode }: SubtaskModalProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority | null>(null)
  const [dueDate, setDueDate] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')

  useEffect(() => {
    if (subtask && mode === 'edit') {
      setTitle(subtask.title)
      setPriority(subtask.priority)
      setDueDate(subtask.due_date || '')
      setEstimatedTime(subtask.estimated_time?.toString() || '')
    } else {
      // Reset for create mode
      setTitle('')
      setPriority(null)
      setDueDate('')
      setEstimatedTime('')
    }
  }, [subtask, mode, isOpen])

  const handleSave = () => {
    if (!title.trim()) return

    onSave({
      title: title.trim(),
      priority,
      due_date: dueDate || null,
      estimated_time: estimatedTime ? parseInt(estimatedTime) : null,
    })

    // Reset form
    setTitle('')
    setPriority(null)
    setDueDate('')
    setEstimatedTime('')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sidebar */}
      <div
        className="relative h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add Subtask' : 'Edit Subtask'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter subtask title..."
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setPriority(null)}
                className={`px-4 py-2 rounded-lg border transition ${
                  priority === null
                    ? 'bg-gray-100 border-gray-400 text-gray-900'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                None
              </button>
              <button
                onClick={() => setPriority('low')}
                className={`px-4 py-2 rounded-lg border transition ${
                  priority === 'low'
                    ? 'bg-gray-100 border-gray-400 text-gray-900'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                ▼ Low
              </button>
              <button
                onClick={() => setPriority('medium')}
                className={`px-4 py-2 rounded-lg border transition ${
                  priority === 'medium'
                    ? 'bg-blue-100 border-blue-400 text-blue-900'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                ■ Medium
              </button>
              <button
                onClick={() => setPriority('high')}
                className={`px-4 py-2 rounded-lg border transition ${
                  priority === 'high'
                    ? 'bg-orange-100 border-orange-400 text-orange-900'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                ▲ High
              </button>
              <button
                onClick={() => setPriority('urgent')}
                className={`px-4 py-2 rounded-lg border transition col-span-4 ${
                  priority === 'urgent'
                    ? 'bg-red-100 border-red-400 text-red-900'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                ⚠ Urgent
              </button>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="e.g., 30"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {mode === 'create' ? 'Add Subtask' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
