import { useState, useEffect } from 'react'
import { TaskChecklistItem, TaskPriority } from '../types'
import UserSelector from './UserSelector'

interface SubtaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    title: string
    description: string
    priority: TaskPriority | null
    assigned_to: string | null
    due_date: string | null
    start_date: string | null
    labels: string[] | null
    estimated_time: number | null
    actual_time: number | null
  }) => void
  subtask?: TaskChecklistItem | null
  mode: 'create' | 'edit'
}

export function SubtaskModal({ isOpen, onClose, onSave, subtask, mode }: SubtaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority | null>(null)
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [labels, setLabels] = useState<string[]>([])
  const [estimatedTime, setEstimatedTime] = useState('')
  const [actualTime, setActualTime] = useState('')

  useEffect(() => {
    if (subtask && mode === 'edit') {
      setTitle(subtask.title)
      setDescription('')
      setPriority(subtask.priority)
      setAssignedTo(subtask.assigned_to || '')
      setDueDate(subtask.due_date || '')
      setStartDate('')
      setLabels(subtask.labels || [])
      setEstimatedTime(subtask.estimated_time?.toString() || '')
      setActualTime(subtask.actual_time?.toString() || '')
    } else {
      // Reset for create mode
      setTitle('')
      setDescription('')
      setPriority(null)
      setAssignedTo('')
      setDueDate('')
      setStartDate('')
      setLabelInput('')
      setLabels([])
      setEstimatedTime('')
      setActualTime('')
    }
  }, [subtask, mode, isOpen])

  const handleSave = () => {
    if (!title.trim()) return

    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
      start_date: startDate || null,
      labels: labels.length > 0 ? labels : null,
      estimated_time: estimatedTime ? parseInt(estimatedTime) : null,
      actual_time: actualTime ? parseInt(actualTime) : null,
    })

    // Reset form
    setTitle('')
    setDescription('')
    setPriority(null)
    setAssignedTo('')
    setDueDate('')
    setStartDate('')
    setLabelInput('')
    setLabels([])
    setEstimatedTime('')
    setActualTime('')
    onClose()
  }

  const handleAddLabel = () => {
    if (labelInput.trim() && !labels.includes(labelInput.trim())) {
      setLabels([...labels, labelInput.trim()])
      setLabelInput('')
    }
  }

  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label))
  }

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddLabel()
    }
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              rows={3}
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

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned To
            </label>
            <UserSelector value={assignedTo} onChange={setAssignedTo} />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Labels
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={handleLabelKeyDown}
                placeholder="Add label..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddLabel}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add
              </button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <span
                    key={label}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {label}
                    <button
                      onClick={() => handleRemoveLabel(label)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
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

          {/* Actual Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actual Time (minutes)
            </label>
            <input
              type="number"
              value={actualTime}
              onChange={(e) => setActualTime(e.target.value)}
              placeholder="e.g., 45"
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
