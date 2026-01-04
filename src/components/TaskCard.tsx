import { useMemo, useState, useRef, useEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Task, UserProfile } from '../types'
import { useProfileFromBatch } from '../hooks/useBatchUserProfiles'
import { useSubtasks } from '../hooks/useSubtasks'
import { useToggle } from '../hooks/useToggle'
import { ConfirmDialog } from './ConfirmDialog'
import { createPortal } from 'react-dom'
import { Edit, Link2, Trash2, CheckSquare, Calendar, Clock, AlertTriangle } from 'lucide-react'

interface TaskCardProps {
  task: Task
  userProfiles: UserProfile[]
  statusColor?: string // For subtask mode - to color card based on column
  onClick: () => void
  onDelete?: (taskId: string) => void
  onQuickEdit?: (taskId: string, newTitle: string) => void
  simplified?: boolean // Simplified mode for subtasks - hide description, priority, menu
}

const priorityColors = {
  low: 'bg-blue-200 text-blue-900',
  medium: 'bg-yellow-200 text-yellow-900',
  high: 'bg-orange-200 text-orange-900',
  urgent: 'bg-red-200 text-red-900',
}

export default function TaskCard({ task, userProfiles, statusColor, onClick, onDelete, onQuickEdit, simplified = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  })
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const showDeleteConfirm = useToggle()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })

  // Get assignee profile from batched data
  const assigneeProfile = useProfileFromBatch(task.assigned_to, userProfiles)
  const { data: subtaskItems = [] } = useSubtasks(task.id)

  // Card colors - lighter than column background (for simplified/subtask mode)
  const CARD_COLORS: Record<string, string> = {
    gray: 'bg-white',
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    orange: 'bg-orange-100',
    red: 'bg-red-100',
    purple: 'bg-purple-100',
    pink: 'bg-pink-100',
  }

  const cardBg = statusColor ? (CARD_COLORS[statusColor] || 'bg-white') : 'bg-white'

  const handleClick = () => {
    if (!isDragging && !isEditing) {
      onClick()
    }
  }

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/board/${task.board_id}?task=${task.id}`
    navigator.clipboard.writeText(url)
    setShowMenu(false)
    // Optional: show a toast notification
    alert('Link copied to clipboard!')
  }

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!showMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        right: window.innerWidth - rect.right
      })
    }
    setShowMenu(!showMenu)
  }

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = () => setShowMenu(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showMenu])

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    showDeleteConfirm.open()
    setShowMenu(false)
  }

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setShowMenu(false)
  }

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== task.title && onQuickEdit) {
      onQuickEdit(task.id, editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditTitle(task.title)
    setIsEditing(false)
  }

  // Memoize date calculations to avoid creating new Date objects on every render
  const { formattedDate, isOverdue } = useMemo(() => {
    if (!task.due_date) return { formattedDate: null, isOverdue: false }

    const date = new Date(task.due_date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let formatted: string
    if (date.toDateString() === today.toDateString()) {
      formatted = 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      formatted = 'Tomorrow'
    } else {
      formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return {
      formattedDate: formatted,
      isOverdue: date < new Date()
    }
  }, [task.due_date])

  // Memoize subtask calculations
  const { subtasksCompleted, subtasksTotal, hasSubtasks } = useMemo(() => ({
    subtasksCompleted: subtaskItems.filter((i) => i.is_completed).length,
    subtasksTotal: subtaskItems.length,
    hasSubtasks: subtaskItems.length > 0
  }), [subtaskItems])

  return (
    <>
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`group p-3 ${cardBg} rounded-lg border border-gray-200 cursor-grab hover:shadow-md transition relative ${
        isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        {isEditing ? (
          <div className="flex-1 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit()
                if (e.key === 'Escape') handleCancelEdit()
              }}
              className="flex-1 px-2 py-1 border border-blue-500 rounded text-sm focus:ring-2 focus:ring-blue-300 outline-none"
              autoFocus
              onBlur={handleSaveEdit}
            />
          </div>
        ) : (
          <h3 className="font-medium text-gray-900 line-clamp-2 flex-1">{task.title}</h3>
        )}

        <div className="flex items-center gap-1">
          {!simplified && task.priority && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}
            >
              {task.priority}
            </span>
          )}

          {/* Three-dot menu - hidden in simplified mode */}
          {!simplified && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              ref={menuButtonRef}
              onClick={handleToggleMenu}
              className="p-1 hover:bg-gray-100 rounded transition opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                <circle cx="8" cy="3" r="1.5"/>
                <circle cx="8" cy="8" r="1.5"/>
                <circle cx="8" cy="13" r="1.5"/>
              </svg>
            </button>

            {showMenu && createPortal(
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div 
                  className="fixed w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50" 
                  style={{
                    top: `${menuPosition.top}px`,
                    right: `${menuPosition.right}px`
                  }}
                >
                  <button
                    onClick={handleStartEdit}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit name
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    Copy link
                  </button>
                  {onDelete && (
                    <>
                      <div className="border-t border-gray-200 my-1" />
                      <button
                        onClick={handleDelete}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>,
              document.body
            )}
          </div>
          )}
        </div>
      </div>

      {!simplified && task.description && (
        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
          {task.description.split(' ').slice(0, 5).join(' ')}
          {task.description.split(' ').length > 5 && '...'}
        </p>
      )}

      {/* Assignee */}
      {assigneeProfile && (
        <div className="flex items-center gap-2 mt-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
            {assigneeProfile.email[0].toUpperCase()}
          </div>
          <span className="text-xs text-gray-600 truncate">
            {assigneeProfile.email}
            {assigneeProfile.employee_number && ` - ${assigneeProfile.employee_number}`}
          </span>
        </div>
      )}

      {/* Footer with subtasks, due date and estimated time - hidden in simplified mode */}
      {!simplified && (hasSubtasks || task.due_date || task.estimated_time) && (
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
          {hasSubtasks && (
            <span className={`flex items-center gap-1 ${subtasksCompleted === subtasksTotal ? 'text-green-600' : ''}`}>
              <CheckSquare className="w-3.5 h-3.5" /> {subtasksCompleted}/{subtasksTotal}
            </span>
          )}
          {formattedDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
              <Calendar className="w-3.5 h-3.5" /> {formattedDate}
            </span>
          )}
          {task.estimated_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {task.estimated_time}m
            </span>
          )}
        </div>
      )}
    </div>

    {/* Delete Confirmation Dialog */}
    <ConfirmDialog
      isOpen={showDeleteConfirm.isOpen}
      title="Delete Task?"
      icon={<AlertTriangle className="w-6 h-6 text-orange-500" />}
      message={
        <div className="space-y-2">
          <p>This will <strong>permanently delete</strong>:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Task "<strong>{task.title}</strong>"</li>
            <li>All subtasks</li>
            <li>All comments and activity history</li>
            <li>All attachments and pages</li>
          </ul>
          <p className="text-red-600 font-medium mt-3">
            This action cannot be undone.
          </p>
        </div>
      }
      confirmText="Delete Task"
      confirmButtonClass="bg-red-600 hover:bg-red-700"
      requireTextConfirm={true}
      textToConfirm={task.title}
      onConfirm={() => {
        if (onDelete) onDelete(task.id)
        showDeleteConfirm.close()
      }}
      onCancel={showDeleteConfirm.close}
    />
  </>
  )
}
