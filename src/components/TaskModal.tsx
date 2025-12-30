import { useState, useEffect, useCallback, useRef } from 'react'
import { Task, TaskPriority } from '../types'
import { supabase } from '../lib/supabase'
import UserSelector from './UserSelector'
import { TaskChecklist } from './TaskChecklist'
import { TaskComments } from './TaskComments'
import { ActivityLog } from './ActivityLog'
import { TaskPages } from './TaskPages'

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
  const [activeTab, setActiveTab] = useState<'checklist' | 'pages' | 'activity'>('checklist')
  const [editingProperty, setEditingProperty] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialTaskIdRef = useRef<string | null>(null)
  const latestValuesRef = useRef({ title, description, priority, assignedTo, dueDate, startDate, labels, estimatedTime })
  const lastEditTimeRef = useRef<number>(0)

  // Update ref with latest values on every render
  latestValuesRef.current = { title, description, priority, assignedTo, dueDate, startDate, labels, estimatedTime }

  // Sync local state with task prop
  // Allow sync on Realtime updates ONLY if user is not actively editing (last edit > 2 seconds ago)
  useEffect(() => {
    if (!isOpen) {
      initialTaskIdRef.current = null
      return
    }

    const taskId = task?.id || null
    const isNewTask = taskId !== initialTaskIdRef.current
    const timeSinceLastEdit = Date.now() - lastEditTimeRef.current
    const isActivelyEditing = timeSinceLastEdit < 2000 // 2 seconds

    // Sync if: new task opened OR task changed OR not actively editing
    if (isNewTask || !isActivelyEditing) {
      if (isNewTask) {
        initialTaskIdRef.current = taskId
      }

      if (task) {
        setTitle(task.title)
        setDescription(task.description || '')
        setPriority(task.priority || null)
        setAssignedTo(task.assigned_to || '')
        setDueDate(task.due_date || '')
        setStartDate(task.start_date || '')
        setLabels(task.labels || [])
        setEstimatedTime(task.estimated_time ? String(task.estimated_time) : '')
      } else if (isNewTask) {
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
    }
  }, [task, isOpen])

  // Auto-save function - uses ref to get latest values
  const autoSave = useCallback(async () => {
    if (!task) return

    const values = latestValuesRef.current
    if (!values.title.trim()) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: values.title,
          description: values.description,
          priority: values.priority,
          assigned_to: values.assignedTo || null,
          due_date: values.dueDate || null,
          start_date: values.startDate || null,
          labels: values.labels.length > 0 ? values.labels : null,
          estimated_time: values.estimatedTime ? parseInt(values.estimatedTime) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      if (error) throw error
    } catch (error) {
      console.error('Auto-save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [task])

  // Debounced auto-save - stable function
  const debouncedAutoSave = useCallback(() => {
    if (!task) return
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      autoSave()
    }, 500)
  }, [task, autoSave])

  // Immediate auto-save for properties
  const immediateAutoSave = useCallback(() => {
    if (task) {
      autoSave()
    }
  }, [task, autoSave])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleAddLabel = () => {
    if (labelInput.trim() && !labels.includes(labelInput.trim())) {
      setLabels([...labels, labelInput.trim()])
      setLabelInput('')
      if (task) {
        setTimeout(() => immediateAutoSave(), 100)
      }
    }
  }

  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label))
    if (task) {
      setTimeout(() => immediateAutoSave(), 100)
    }
  }

  const handleSubmit = async () => {
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
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-white shadow-2xl flex flex-col animate-slide-in-right">
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
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Title - Large Notion-style */}
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                lastEditTimeRef.current = Date.now()
                if (task) debouncedAutoSave()
              }}
              className="w-full text-3xl font-bold border-none outline-none focus:ring-0 p-0"
              placeholder="Untitled"
              maxLength={200}
            />
            {isSaving && (
              <div className="absolute right-0 top-2 text-xs text-gray-400">Saving...</div>
            )}
          </div>

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              lastEditTimeRef.current = Date.now()
              if (task) debouncedAutoSave()
            }}
            className="w-full text-sm text-gray-700 border-none outline-none focus:ring-0 p-0 resize-none min-h-20"
            placeholder="Add description..."
            maxLength={2000}
          />

          {/* Properties - Notion style table */}
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-1">
              {/* Priority */}
              <div className="flex items-center hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded">
                <div className="w-32 text-sm text-gray-600">Priority</div>
                <div className="flex-1">
                  {editingProperty === 'priority' ? (
                    <select
                      value={priority || ''}
                      onChange={(e) => {
                        setPriority((e.target.value as TaskPriority) || null)
                        lastEditTimeRef.current = Date.now()
                        setEditingProperty(null)
                        immediateAutoSave()
                      }}
                      onBlur={() => setEditingProperty(null)}
                      autoFocus
                      className="w-full text-sm border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                    >
                      <option value="">None</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  ) : (
                    <div
                      onClick={() => setEditingProperty('priority')}
                      className="text-sm cursor-pointer px-2 py-1"
                    >
                      {priority ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Empty</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned To */}
              <div className="flex items-center hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded">
                <div className="w-32 text-sm text-gray-600">Assigned</div>
                <div className="flex-1">
                  {editingProperty === 'assigned' ? (
                    <div onBlur={() => setEditingProperty(null)}>
                      <UserSelector
                        value={assignedTo || null}
                        onChange={(userId) => {
                          setAssignedTo(userId)
                          lastEditTimeRef.current = Date.now()
                          setEditingProperty(null)
                          immediateAutoSave()
                        }}
                        placeholder="Select user..."
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingProperty('assigned')}
                      className="text-sm cursor-pointer px-2 py-1"
                    >
                      {assignedTo ? (
                        <span className="text-gray-900">{assignedTo}</span>
                      ) : (
                        <span className="text-gray-400">Empty</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Start Date */}
              <div className="flex items-center hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded">
                <div className="w-32 text-sm text-gray-600">Start Date</div>
                <div className="flex-1">
                  {editingProperty === 'start_date' ? (
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value)
                        lastEditTimeRef.current = Date.now()
                        immediateAutoSave()
                      }}
                      onBlur={() => setEditingProperty(null)}
                      autoFocus
                      className="w-full text-sm border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingProperty('start_date')}
                      className="text-sm cursor-pointer px-2 py-1"
                    >
                      {startDate ? (
                        <span className="text-gray-900">{new Date(startDate).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-gray-400">Empty</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="flex items-center hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded">
                <div className="w-32 text-sm text-gray-600">Due Date</div>
                <div className="flex-1">
                  {editingProperty === 'due_date' ? (
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => {
                        setDueDate(e.target.value)
                        lastEditTimeRef.current = Date.now()
                        immediateAutoSave()
                      }}
                      onBlur={() => setEditingProperty(null)}
                      autoFocus
                      className="w-full text-sm border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingProperty('due_date')}
                      className="text-sm cursor-pointer px-2 py-1"
                    >
                      {dueDate ? (
                        <span className="text-gray-900">{new Date(dueDate).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-gray-400">Empty</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Time */}
              <div className="flex items-center hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded">
                <div className="w-32 text-sm text-gray-600">Est. Time</div>
                <div className="flex-1">
                  {editingProperty === 'estimated_time' ? (
                    <input
                      type="number"
                      value={estimatedTime}
                      onChange={(e) => {
                        setEstimatedTime(e.target.value)
                        lastEditTimeRef.current = Date.now()
                      }}
                      onBlur={() => {
                        setEditingProperty(null)
                        immediateAutoSave()
                      }}
                      autoFocus
                      placeholder="Minutes"
                      min="0"
                      className="w-full text-sm border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                    />
                  ) : (
                    <div
                      onClick={() => setEditingProperty('estimated_time')}
                      className="text-sm cursor-pointer px-2 py-1"
                    >
                      {estimatedTime ? (
                        <span className="text-gray-900">{estimatedTime} min</span>
                      ) : (
                        <span className="text-gray-400">Empty</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Labels */}
              <div className="flex items-start hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded">
                <div className="w-32 text-sm text-gray-600 pt-1">Labels</div>
                <div className="flex-1">
                  {editingProperty === 'labels' ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={labelInput}
                          onChange={(e) => setLabelInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddLabel()
                            } else if (e.key === 'Escape') {
                              setEditingProperty(null)
                            }
                          }}
                          autoFocus
                          placeholder="Add label..."
                          className="flex-1 text-sm border border-gray-300 outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                        />
                        <button
                          onClick={() => setEditingProperty(null)}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Done
                        </button>
                      </div>
                      {labels.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {labels.map((label) => (
                            <span
                              key={label}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
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
                  ) : (
                    <div
                      onClick={() => setEditingProperty('labels')}
                      className="text-sm cursor-pointer px-2 py-1"
                    >
                      {labels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {labels.map((label) => (
                            <span
                              key={label}
                              className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">Empty</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section - Right after properties */}
          {task && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">💬 Comments</h3>
              <TaskComments taskId={task.id} />
            </div>
          )}

          {/* Tabs for Checklist & Pages - only show when editing existing task */}
          {task && (
            <div className="border-t border-gray-200 pt-4 mt-4">
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
                  onClick={() => setActiveTab('pages')}
                  className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
                    activeTab === 'pages'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pages
                </button>
              </div>

              {/* Tab Content */}
              <div>
                {activeTab === 'checklist' && <TaskChecklist taskId={task.id} boardId={task.board_id} />}
                {activeTab === 'pages' && <TaskPages taskId={task.id} />}
              </div>
            </div>
          )}

          {/* Activity Log - Always visible at bottom */}
          {task && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Activity</h3>
              <ActivityLog taskId={task.id} />
            </div>
          )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3 justify-between items-center">
              <div className="text-xs text-gray-500">
                {isSaving && 'Saving changes...'}
              </div>
              <div className="flex gap-3">
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
                  {task ? 'Close' : 'Cancel'}
                </button>
                {!task && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !title.trim()}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
