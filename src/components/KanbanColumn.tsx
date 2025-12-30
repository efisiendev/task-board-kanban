import { useDroppable } from '@dnd-kit/core'
import { Task } from '../types'
import TaskCard from './TaskCard'

interface KanbanColumnProps {
  statusId: string
  statusLabel: string
  statusColor: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
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

export default function KanbanColumn({
  statusId,
  statusLabel,
  statusColor,
  tasks,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: statusId, data: { statusId } })

  const bgColor = COLOR_CLASSES[statusColor] || 'bg-gray-100'

  return (
    <div className={`flex flex-col ${bgColor} rounded-lg p-4 min-h-96 w-80 flex-shrink-0 transition ${isOver ? 'ring-2 ring-blue-400' : ''}`}>
      <h2 className="font-semibold text-gray-900 mb-4">
        {statusLabel} <span className="text-gray-600 text-sm">({tasks.length})</span>
      </h2>

      <div ref={setNodeRef} className="flex-1 space-y-2 overflow-y-auto">
        {tasks
          .sort((a, b) => a.order_index - b.order_index)
          .map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-gray-400">
            <p className="text-sm">No tasks yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
