import { useState, useEffect } from 'react'
import { Task, TaskPriority } from '../types'
import UserSelector from './UserSelector'
import { TaskChecklist } from './TaskChecklist'
import { TaskComments } from './TaskComments'
import { ActivityLog } from './ActivityLog'

interface TaskModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onCreate: (data: TaskFormData) => Promise<void>
  onUpdate: (data: TaskFormData) => Promise<void>
  onDelete: () => Promise<void>
}

export interface TaskFormData {
  title: string
  description: string
  priority: TaskPriority | null
  assigned_to: string | null
  due_date: string | null
  start_date: string | null
  labels: string[] | null
  estimated_time: number | null
}

export default function TaskModal({
  task,
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority | null>(null)
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [labelInput, setLabelInput] = useState<string>('')
  const [labels, setLabels] = useState<string[]>([])
  const [estimatedTime, setEstimatedTime] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'checklist' | 'comments' | 'activity'>('checklist')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority || null)
      setAssignedTo(task.assigned_to || '')
      setDueDate(task.due_date || '')
      setStartDate(task.start_date || '')
      setLabels(task.labels || [])
      setEstimatedTime(task.estimated_time ? String(task.estimated_time) : '')
    } else {
      setTitle('')
      setDescription('')
      setPriority(null)
      setAssignedTo('')
      setDueDate('')
      setStartDate('')
      setLabels([])
      setLabelInput('')
      setEstimatedTime('')
    }
  }, [task, isOpen])

  const handleAddLabel = () => {
    if (labelInput.trim() && !labels.includes(labelInput.trim())) {
      setLabels([...labels, labelInput.trim()])
      setLabelInput('')
    }
  }

  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const formData: TaskFormData = {
        title,
        description,
        priority,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
        start_date: startDate || null,
        labels: labels.length > 0 ? labels : null,
        estimated_time: estimatedTime ? parseInt(estimatedTime) : null,
      }

      if (task) {
        await onUpdate(formData)
      } else {
        await onCreate(formData)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {task ? 'Edit Task' : 'Create Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Task title..."
              required
              autoFocus
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-24"
              placeholder="Task description..."
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priority || ''}
                onChange={(e) => setPriority((e.target.value as TaskPriority) || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Time (minutes)</label>
              <input
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., 60"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
            <UserSelector
              value={assignedTo || null}
              onChange={(userId) => setAssignedTo(userId)}
              placeholder="Select a user to assign..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLabel())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Add label and press Enter"
              />
              <button
                type="button"
                onClick={handleAddLabel}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
              >
                Add
              </button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(label)}
                      className="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          </form>

          {/* Tabs for Checklist, Comments, Activity - only show when editing existing task */}
          {task && (
            <div className="border-t border-gray-200 pt-4">
              {/* Tab Headers */}
              <div className="flex gap-4 border-b border-gray-200 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('checklist')}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
                    activeTab === 'checklist'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Checklist
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('comments')}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
                    activeTab === 'comments'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Comments
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('activity')}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
                    activeTab === 'activity'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Activity
                </button>
              </div>

              {/* Tab Content */}
              <div>
                {activeTab === 'checklist' && <TaskChecklist taskId={task.id} boardId={task.board_id} />}
                {activeTab === 'comments' && <TaskComments taskId={task.id} />}
                {activeTab === 'activity' && <ActivityLog taskId={task.id} />}
              </div>
            </div>
          )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3 justify-end">
              {task && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Delete this task?')) {
                      await onDelete()
                    }
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !title.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : task ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
