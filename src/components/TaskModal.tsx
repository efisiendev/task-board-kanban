import { useState, useEffect } from 'react'
import { Task } from '../types'
import { supabase } from '../lib/supabase'
import { TaskComments } from './TaskComments'
import { ActivityLog } from './ActivityLog'
import { SubTaskList } from './SubTaskList'
import { TaskPages } from './TaskPages'
import { TaskRelations } from './TaskRelations'
import { useTaskFormState, TaskFormData } from '../hooks/useTaskFormState'
import { useAutoSave } from '../hooks/useAutoSave'
import { PropertyRow, PriorityField, DateField, TimeField, AssigneeField, LabelsField, AddPropertyButton, AdditionalProperty } from './shared'
import { useSubtasks } from '../hooks/useSubtasks'
import { useTaskPages } from '../hooks/useTaskPages'
import { useTaskRelations } from '../hooks/useTaskRelations'

interface TaskModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onCreate: (data: TaskFormData) => Promise<void>
  onUpdate: (data: TaskFormData) => Promise<void>
  onDelete: () => Promise<void>
}

export type { TaskFormData }

export default function TaskModal({
  task,
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: TaskModalProps) {
  const [editingProperty, setEditingProperty] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [visibleProperties, setVisibleProperties] = useState<AdditionalProperty[]>([])

  // Fetch data to determine which properties have content
  const { data: subtasks = [] } = useSubtasks(task?.id || '')
  const { data: pages = [] } = useTaskPages(task?.id || '')
  const { data: relationsData } = useTaskRelations(task?.id || '')
  const { outgoing = [], incoming = [] } = relationsData || {}

  // Auto-show properties that have content (only on initial load)
  useEffect(() => {
    if (!task) return

    const autoVisible: AdditionalProperty[] = []
    if (subtasks.length > 0) autoVisible.push('subtasks')
    if (pages.length > 0) autoVisible.push('pages')
    if (outgoing.length > 0 || incoming.length > 0) autoVisible.push('relations')

    setVisibleProperties(prev => {
      // Merge auto-visible dengan yang sudah manually ditambahkan user
      const merged = new Set([...prev, ...autoVisible])
      return Array.from(merged)
    })
  }, [task, subtasks.length, pages.length, outgoing.length, incoming.length])

  // Auto-save function for edit mode
  const handleAutoSave = async (data: TaskFormData) => {
    if (!task || !data.title.trim()) return

    try {
      // If assigning to a user, ensure they're a board member
      if (data.assigned_to) {
        const { data: existing } = await supabase
          .from('board_members')
          .select('id')
          .eq('board_id', task.board_id)
          .eq('user_id', data.assigned_to)
          .maybeSingle()

        if (!existing) {
          await supabase.from('board_members').insert({
            board_id: task.board_id,
            user_id: data.assigned_to,
            role: 'member',
          })
        }
      }

      await supabase
        .from('tasks')
        .update({
          title: data.title,
          description: data.description,
          priority: data.priority,
          assigned_to: data.assigned_to,
          due_date: data.due_date,
          start_date: data.start_date,
          labels: data.labels,
          estimated_time: data.estimated_time,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }

  // Use shared auto-save hook (harus dipanggil dulu untuk bikin lastEditTimeRef)
  const { isSaving, debouncedAutoSave, immediateAutoSave, lastEditTimeRef } = useAutoSave({
    onSave: handleAutoSave,
    delay: 500,
  })

  // Use shared form state hook (terima lastEditTimeRef untuk proteksi Realtime)
  const {
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    assignedTo,
    setAssignedTo,
    dueDate,
    setDueDate,
    startDate,
    setStartDate,
    labels,
    labelInput,
    setLabelInput,
    handleAddLabel: addLabel,
    handleRemoveLabel: removeLabel,
    estimatedTime,
    setEstimatedTime,
    getFormData,
  } = useTaskFormState({
    initialData: task ? {
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigned_to: task.assigned_to,
      due_date: task.due_date,
      start_date: task.start_date,
      labels: task.labels,
      estimated_time: task.estimated_time,
      actual_time: task.actual_time,
    } : null,
    id: task?.id,
    lastEditTimeRef,
  })

  // Auto-save untuk semua field changes
  // Proteksi Realtime sudah ada di useTaskFormState, jadi kita safe untuk auto-save setiap perubahan
  useEffect(() => {
    if (task) {
      const timeSinceLastEdit = Date.now() - lastEditTimeRef.current
      // Hanya trigger autosave jika user baru edit (dalam 2 detik terakhir)
      // Ini mencegah autosave saat initial load atau saat Realtime sync
      if (timeSinceLastEdit < 2000) {
        debouncedAutoSave(getFormData())
      }
    }
  }, [task, title, description, priority, assignedTo, dueDate, startDate, labels, estimatedTime]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!title.trim()) return

    setLoading(true)
    try {
      if (task) {
        await onUpdate(getFormData())
      } else {
        await onCreate(getFormData())
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
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl flex flex-col animate-slide-in-right">
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
            }}
            className="w-full text-sm text-gray-700 border-none outline-none focus:ring-0 p-0 resize-none min-h-20"
            placeholder="Add description..."
            maxLength={2000}
          />

          {/* Properties - Notion style table */}
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-1">
              {/* Priority */}
              <PropertyRow label="Priority">
                <PriorityField
                  value={priority}
                  isEditing={editingProperty === 'priority'}
                  onEdit={() => setEditingProperty('priority')}
                  onChange={(value) => {
                    setPriority(value)
                    lastEditTimeRef.current = Date.now()
                    setEditingProperty(null)
                    if (task) immediateAutoSave(getFormData())
                  }}
                  onBlur={() => setEditingProperty(null)}
                />
              </PropertyRow>

              {/* Assigned */}
              <PropertyRow label="Assigned">
                <AssigneeField
                  value={assignedTo}
                  isEditing={editingProperty === 'assigned'}
                  onEdit={() => setEditingProperty('assigned')}
                  onChange={(value) => {
                    setAssignedTo(value || '')
                    lastEditTimeRef.current = Date.now()
                    setEditingProperty(null)
                    if (task) immediateAutoSave(getFormData())
                  }}
                  onBlur={() => setEditingProperty(null)}
                />
              </PropertyRow>

              {/* Start Date */}
              <PropertyRow label="Start Date">
                <DateField
                  value={startDate}
                  isEditing={editingProperty === 'start_date'}
                  onEdit={() => setEditingProperty('start_date')}
                  onChange={(value) => {
                    setStartDate(value)
                    lastEditTimeRef.current = Date.now()
                    if (task) immediateAutoSave(getFormData())
                  }}
                  onBlur={() => setEditingProperty(null)}
                />
              </PropertyRow>

              {/* Due Date */}
              <PropertyRow label="Due Date">
                <DateField
                  value={dueDate}
                  isEditing={editingProperty === 'due_date'}
                  onEdit={() => setEditingProperty('due_date')}
                  onChange={(value) => {
                    setDueDate(value)
                    lastEditTimeRef.current = Date.now()
                    if (task) immediateAutoSave(getFormData())
                  }}
                  onBlur={() => setEditingProperty(null)}
                />
              </PropertyRow>

              {/* Estimated Time */}
              <PropertyRow label="Est. Time">
                <TimeField
                  value={estimatedTime}
                  isEditing={editingProperty === 'estimated_time'}
                  onEdit={() => setEditingProperty('estimated_time')}
                  onChange={(value) => {
                    setEstimatedTime(value)
                    lastEditTimeRef.current = Date.now()
                    if (task) immediateAutoSave(getFormData())
                  }}
                  onBlur={() => {
                    setEditingProperty(null)
                  }}
                />
              </PropertyRow>

              {/* Labels */}
              <PropertyRow label="Labels">
                <LabelsField
                  labels={labels}
                  labelInput={labelInput}
                  isEditing={editingProperty === 'labels'}
                  onEdit={() => setEditingProperty('labels')}
                  onLabelInputChange={setLabelInput}
                  onAddLabel={() => {
                    lastEditTimeRef.current = Date.now()
                    addLabel(() => {
                      if (task) immediateAutoSave(getFormData())
                    })
                  }}
                  onRemoveLabel={(label) => {
                    lastEditTimeRef.current = Date.now()
                    removeLabel(label, () => {
                      if (task) immediateAutoSave(getFormData())
                    })
                  }}
                  onBlur={() => setEditingProperty(null)}
                />
              </PropertyRow>

              {/* Add Property Button - only show for existing tasks */}
              {task && (
                <AddPropertyButton
                  onAddProperty={(property) => {
                    if (!visibleProperties.includes(property)) {
                      setVisibleProperties([...visibleProperties, property])
                      // Open appropriate modal/form to create first item
                      if (property === 'subtasks') {
                        // Will be handled by SubTaskList component
                      } else if (property === 'pages') {
                        // Will be handled by TaskPages component
                      } else if (property === 'relations') {
                        // Will be handled by TaskRelations component
                      }
                    }
                  }}
                  availableProperties={
                    (['subtasks', 'pages', 'relations'] as AdditionalProperty[]).filter(
                      (p) => !visibleProperties.includes(p)
                    )
                  }
                />
              )}

            </div>
          </div>

          {/* Full Sections - only show when they have content or user added them */}
          {task && visibleProperties.includes('subtasks') && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">☑️ Subtasks</h3>
              <SubTaskList taskId={task.id} boardId={task.board_id} />
            </div>
          )}

          {task && visibleProperties.includes('pages') && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">📄 Pages</h3>
              <TaskPages taskId={task.id} />
            </div>
          )}

          {task && visibleProperties.includes('relations') && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">🔗 Relations</h3>
              <TaskRelations taskId={task.id} boardId={task.board_id} />
            </div>
          )}

          {/* Comments Section - Right after properties */}
          {task && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">💬 Comments</h3>
              <TaskComments taskId={task.id} />
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
