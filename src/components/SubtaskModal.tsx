import { useState, useEffect, useCallback, useRef } from 'react'
import { TaskChecklistItem, TaskPriority } from '../types'
import { supabase } from '../lib/supabase'
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
  const [editingProperty, setEditingProperty] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialSubtaskIdRef = useRef<string | null>(null)
  const latestValuesRef = useRef({ title, description, priority, assignedTo, dueDate, startDate, labels, estimatedTime, actualTime })
  const lastEditTimeRef = useRef<number>(0)

  // Update ref with latest values on every render
  latestValuesRef.current = { title, description, priority, assignedTo, dueDate, startDate, labels, estimatedTime, actualTime }

  // Sync local state with subtask prop
  useEffect(() => {
    if (!isOpen) {
      initialSubtaskIdRef.current = null
      return
    }

    const subtaskId = subtask?.id || null
    const isNewSubtask = subtaskId !== initialSubtaskIdRef.current
    const timeSinceLastEdit = Date.now() - lastEditTimeRef.current
    const isActivelyEditing = timeSinceLastEdit < 2000

    if (isNewSubtask || !isActivelyEditing) {
      if (isNewSubtask) {
        initialSubtaskIdRef.current = subtaskId
      }

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
      } else if (isNewSubtask && mode === 'create') {
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
    }
  }, [subtask, mode, isOpen])

  // Auto-save function for edit mode
  const autoSave = useCallback(async () => {
    if (!subtask || mode !== 'edit') return

    const values = latestValuesRef.current
    if (!values.title.trim()) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('task_checklist')
        .update({
          title: values.title,
          priority: values.priority,
          assigned_to: values.assignedTo || null,
          due_date: values.dueDate || null,
          labels: values.labels.length > 0 ? values.labels : null,
          estimated_time: values.estimatedTime ? parseInt(values.estimatedTime) : null,
          actual_time: values.actualTime ? parseInt(values.actualTime) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subtask.id)

      if (error) throw error
    } catch (error) {
      console.error('Auto-save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [subtask, mode])

  // Debounced auto-save
  const debouncedAutoSave = useCallback(() => {
    if (!subtask || mode !== 'edit') return
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      autoSave()
    }, 500)
  }, [subtask, mode, autoSave])

  // Immediate auto-save
  const immediateAutoSave = useCallback(() => {
    if (subtask && mode === 'edit') {
      autoSave()
    }
  }, [subtask, mode, autoSave])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

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

    onClose()
  }

  const handleAddLabel = () => {
    if (labelInput.trim() && !labels.includes(labelInput.trim())) {
      setLabels([...labels, labelInput.trim()])
      setLabelInput('')
      if (subtask && mode === 'edit') {
        setTimeout(() => immediateAutoSave(), 100)
      }
    }
  }

  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label))
    if (subtask && mode === 'edit') {
      setTimeout(() => immediateAutoSave(), 100)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-500">
            {mode === 'create' ? 'New Subtask' : 'Subtask'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title - Large Notion-style */}
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                lastEditTimeRef.current = Date.now()
                if (subtask && mode === 'edit') debouncedAutoSave()
              }}
              className="w-full text-3xl font-bold border-none outline-none focus:ring-0 p-0"
              placeholder="Untitled"
              maxLength={200}
              autoFocus
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
              if (subtask && mode === 'edit') debouncedAutoSave()
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

              {/* Assigned */}
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

              {/* Actual Time */}
              <div className="flex items-center hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded">
                <div className="w-32 text-sm text-gray-600">Actual Time</div>
                <div className="flex-1">
                  {editingProperty === 'actual_time' ? (
                    <input
                      type="number"
                      value={actualTime}
                      onChange={(e) => {
                        setActualTime(e.target.value)
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
                      onClick={() => setEditingProperty('actual_time')}
                      className="text-sm cursor-pointer px-2 py-1"
                    >
                      {actualTime ? (
                        <span className="text-gray-900">{actualTime} min</span>
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
                  <div className="flex flex-wrap gap-2 mb-2">
                    {labels.map((label) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
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
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddLabel()
                        }
                      }}
                      placeholder="Add label and press Enter"
                      className="flex-1 text-sm border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3 justify-between items-center">
            <div className="text-xs text-gray-500">
              {isSaving && mode === 'edit' && 'Saving changes...'}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition"
              >
                {mode === 'edit' ? 'Close' : 'Cancel'}
              </button>
              {mode === 'create' && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Create
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
