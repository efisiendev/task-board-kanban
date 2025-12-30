import { Task, BoardStatus } from '../types'
import { useUserProfile } from '../hooks/useUsers'

interface ListViewProps {
  tasks: Task[]
  statuses: BoardStatus[]
  onTaskClick: (task: Task) => void
}

export function ListView({ tasks, statuses, onTaskClick }: ListViewProps) {
  return (
    <div className="space-y-6">
      {statuses.map((status) => (
        <ListSection
          key={status.id}
          title={status.name}
          tasks={tasks.filter((t) => t.status_id === status.id)}
          onTaskClick={onTaskClick}
          emptyMessage={`No tasks in ${status.name.toLowerCase()}`}
        />
      ))}
    </div>
  )
}

interface ListSectionProps {
  title: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
  emptyMessage: string
}

function ListSection({ title, tasks, onTaskClick, emptyMessage }: ListSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">{tasks.length} tasks</span>
      </div>
      <div className="divide-y divide-gray-100">
        {tasks.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            {emptyMessage}
          </div>
        ) : (
          tasks.map((task) => (
            <ListItem key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))
        )}
      </div>
    </div>
  )
}

interface ListItemProps {
  task: Task
  onClick: () => void
}

function ListItem({ task, onClick }: ListItemProps) {
  const { data: assigneeProfile } = useUserProfile(task.assigned_to)

  const priorityColors = {
    low: 'text-blue-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
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

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.board_status?.name !== 'Done'

  return (
    <div
      onClick={onClick}
      className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Title & Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
            {task.priority && (
              <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
                {task.priority === 'urgent' && '🔴'}
                {task.priority === 'high' && '🟠'}
                {task.priority === 'medium' && '🟡'}
                {task.priority === 'low' && '🔵'}
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-gray-500 truncate">{task.description}</p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {/* Assignee */}
            {assigneeProfile && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-medium">
                  {assigneeProfile.email[0].toUpperCase()}
                </div>
                <span className="truncate max-w-[120px]">{assigneeProfile.email}</span>
              </div>
            )}

            {/* Due Date */}
            {task.due_date && (
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                📅 {formatDate(task.due_date)}
              </span>
            )}

            {/* Estimated Time */}
            {task.estimated_time && (
              <span>⏱️ {task.estimated_time}m</span>
            )}
          </div>
        </div>

        {/* Right: Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {task.labels.slice(0, 3).map((label) => (
              <span
                key={label}
                className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {label}
              </span>
            ))}
            {task.labels.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                +{task.labels.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
