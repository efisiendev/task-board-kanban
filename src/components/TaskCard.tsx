import { useDraggable } from '@dnd-kit/core'
import { Task } from '../types'
import { useUserProfile } from '../hooks/useUsers'

interface TaskCardProps {
  task: Task
  onClick: () => void
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  })
  const { data: assigneeProfile } = useUserProfile(task.assigned_to)

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      onClick()
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`p-3 bg-white rounded-lg border border-gray-200 cursor-grab hover:shadow-md transition ${
        isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-gray-900 line-clamp-2 flex-1">{task.title}</h3>
        {task.priority && (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}
          >
            {task.priority}
          </span>
        )}
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
            >
              {label}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
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

      {/* Footer with due date and estimated time */}
      {(task.due_date || task.estimated_time) && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
          {task.due_date && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
              📅 {formatDate(task.due_date)}
            </span>
          )}
          {task.estimated_time && (
            <span className="flex items-center gap-1">
              ⏱️ {task.estimated_time}m
            </span>
          )}
        </div>
      )}
    </div>
  )
}
