import { useState, useEffect } from 'react'
import { Subtask } from '../types'
import { supabase } from '../lib/supabase'
import UserSelector from './UserSelector'
import { useTaskFormState } from '../hooks/useTaskFormState'
import { useAutoSave } from '../hooks/useAutoSave'
import { PropertyRow, PriorityField, DateField, TimeField } from './shared'

import { TaskFormData } from '../hooks/useTaskFormState'

interface SubtaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: TaskFormData) => void
  subtask?: Subtask | null
  mode: 'create' | 'edit'
}

export function SubtaskModal({ isOpen, onClose, onSave, subtask, mode }: SubtaskModalProps) {
  const [editingProperty, setEditingProperty] = useState<string | null>(null)

  // Auto-save function for edit mode
  const handleAutoSave = async (data: TaskFormData) => {
    if (!subtask || mode !== 'edit' || !data.title.trim()) return

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
        actual_time: data.actual_time,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subtask.id)
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
    handleAddLabel,
    handleRemoveLabel,
    estimatedTime,
    setEstimatedTime,
    actualTime,
    setActualTime,
    getFormData,
  } = useTaskFormState({
    initialData: subtask && mode === 'edit' ? subtask : undefined,
    id: subtask?.id,
    lastEditTimeRef,
  })

  // Auto-save untuk semua field changes
  // Proteksi Realtime sudah ada di useTaskFormState, jadi kita safe untuk auto-save setiap perubahan
  useEffect(() => {
    if (subtask && mode === 'edit') {
      const timeSinceLastEdit = Date.now() - lastEditTimeRef.current
      // Hanya trigger autosave jika user baru edit (dalam 2 detik terakhir)
      // Ini mencegah autosave saat initial load atau saat Realtime sync
      if (timeSinceLastEdit < 2000) {
        debouncedAutoSave(getFormData())
      }
    }
  }, [subtask, mode, title, description, priority, assignedTo, dueDate, startDate, labels, estimatedTime, actualTime]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    if (!title.trim()) return
    onSave(getFormData())
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl flex flex-col animate-slide-in-right">
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
                lastEditTimeRef.current = Date.now() // Tandai user sedang mengetik
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
                    if (subtask && mode === 'edit') immediateAutoSave(getFormData())
                  }}
                  onBlur={() => setEditingProperty(null)}
                />
              </PropertyRow>

              {/* Assigned */}
              <PropertyRow label="Assigned">
                {editingProperty === 'assigned' ? (
                  <div onBlur={() => setEditingProperty(null)}>
                    <UserSelector
                      value={assignedTo || null}
                      onChange={(userId) => {
                        setAssignedTo(userId)
                        lastEditTimeRef.current = Date.now()
                        setEditingProperty(null)
                        if (subtask && mode === 'edit') immediateAutoSave(getFormData())
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
                    if (subtask && mode === 'edit') immediateAutoSave(getFormData())
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
                    if (subtask && mode === 'edit') immediateAutoSave(getFormData())
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
                    if (subtask && mode === 'edit') immediateAutoSave(getFormData())
                  }}
                  onBlur={() => {
                    setEditingProperty(null)
                  }}
                />
              </PropertyRow>

              {/* Actual Time */}
              <PropertyRow label="Actual Time">
                <TimeField
                  value={actualTime}
                  isEditing={editingProperty === 'actual_time'}
                  onEdit={() => setEditingProperty('actual_time')}
                  onChange={(value) => {
                    setActualTime(value)
                    lastEditTimeRef.current = Date.now()
                    if (subtask && mode === 'edit') immediateAutoSave(getFormData())
                  }}
                  onBlur={() => {
                    setEditingProperty(null)
                  }}
                />
              </PropertyRow>

              {/* Labels */}
              <PropertyRow label="Labels">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {labels.map((label) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {label}
                        <button
                          onClick={() => handleRemoveLabel(label, () => {
                            if (subtask && mode === 'edit') immediateAutoSave(getFormData())
                          })}
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
                          handleAddLabel(() => {
                            if (subtask && mode === 'edit') immediateAutoSave(getFormData())
                          })
                        }
                      }}
                      placeholder="Add label and press Enter"
                      className="flex-1 text-sm border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 bg-gray-50"
                    />
                  </div>
                </div>
              </PropertyRow>
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
