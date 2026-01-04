import { useMemo, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Task, UserProfile } from '../types'
import TaskCard from './TaskCard'
import { ColumnSortMenu, SortOption } from './ColumnSortMenu'

interface KanbanColumnProps {
  statusId: string
  statusLabel: string
  statusColor: string
  tasks: Task[]
  userProfiles: UserProfile[]
  onTaskClick: (task: Task) => void
  onAddTask?: (statusId: string) => void // Made optional for subtasks
  onDeleteTask?: (taskId: string) => void
  onQuickEditTask?: (taskId: string, newTitle: string) => void
  simplified?: boolean // Pass to TaskCard for subtask mode
}

const COLOR_CLASSES: Record<string, string> = {
  gray: 'bg-gray-100',
  blue: 'bg-blue-50',
  green: 'bg-green-50',
  yellow: 'bg-yellow-50',
  orange: 'bg-orange-50',
  red: 'bg-red-50',
  purple: 'bg-purple-50',
  pink: 'bg-pink-50',
}

const BADGE_COLORS: Record<string, string> = {
  gray: 'bg-gray-200 text-gray-800 border border-gray-300',
  blue: 'bg-blue-100 text-blue-800 border border-blue-200',
  green: 'bg-green-100 text-green-800 border border-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  orange: 'bg-orange-100 text-orange-800 border border-orange-200',
  red: 'bg-red-100 text-red-800 border border-red-200',
  purple: 'bg-purple-100 text-purple-800 border border-purple-200',
  pink: 'bg-pink-100 text-pink-800 border border-pink-200',
}

// Priority order mapping for sorting
const PRIORITY_ORDER: Record<string, number> = {
  'urgent': 0,
  'high': 1,
  'medium': 2,
  'low': 3,
}

export default function KanbanColumn({
  statusId,
  statusLabel,
  statusColor,
  tasks,
  userProfiles,
  onTaskClick,
  onAddTask,
  onDeleteTask,
  onQuickEditTask,
  simplified = false,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: statusId, data: { statusId } })
  const [sortBy, setSortBy] = useState<SortOption>('order')

  const bgColor = COLOR_CLASSES[statusColor] || 'bg-gray-100'
  const badgeColor = BADGE_COLORS[statusColor] || 'bg-gray-600 text-white'

  // Memoize sorted tasks to avoid sorting on every render
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks]

    if (sortBy === 'priority') {
      sorted.sort((a, b) => {
        const aPriority = a.priority ? PRIORITY_ORDER[a.priority.toLowerCase()] ?? 999 : 999
        const bPriority = b.priority ? PRIORITY_ORDER[b.priority.toLowerCase()] ?? 999 : 999
        if (aPriority !== bPriority) return aPriority - bPriority
        return a.order_index - b.order_index // Secondary sort by order
      })
    } else if (sortBy === 'due_date') {
      sorted.sort((a, b) => {
        if (!a.due_date && !b.due_date) return a.order_index - b.order_index
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        const dateCompare = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        if (dateCompare !== 0) return dateCompare
        return a.order_index - b.order_index
      })
    } else {
      // Default: sort by order_index
      sorted.sort((a, b) => a.order_index - b.order_index)
    }

    return sorted
  }, [tasks, sortBy])

  return (
    <div className={`flex flex-col ${bgColor} rounded-lg p-4 w-80 flex-shrink-0 transition ${isOver ? 'ring-2 ring-blue-400' : ''}`}>
      {/* Header with sort button */}
      <div className="mb-3 flex items-center justify-between">
        <span className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${badgeColor}`}>
          {statusLabel}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm font-medium">
            {tasks.length}
          </span>
          <ColumnSortMenu sortBy={sortBy} onSortChange={setSortBy} />
        </div>
      </div>

      {/* Tasks list */}
      <div ref={setNodeRef} className="space-y-2">
        {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              userProfiles={userProfiles}
              statusColor={statusColor}
              onClick={() => onTaskClick(task)}
              onDelete={onDeleteTask}
              onQuickEdit={onQuickEditTask}
              simplified={simplified}
            />
          ))}

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-gray-400">
            <p className="text-sm">No tasks yet</p>
          </div>
        )}
      </div>

      {/* Add New Task Button - only show if onAddTask provided */}
      {onAddTask && (
        <button
          onClick={() => onAddTask(statusId)}
          className="mt-2 w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-white hover:border-gray-300 bg-white/30 border-2 border-dashed border-gray-300 rounded-lg transition flex items-center gap-2 group hover:shadow-sm"
        >
          <span className="text-lg text-gray-500 group-hover:text-blue-600">+</span>
          <span className="group-hover:text-gray-900 font-medium">New</span>
        </button>
      )}
    </div>
  )
}
