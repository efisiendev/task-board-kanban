import { useDroppable } from '@dnd-kit/core'
import { Task } from '../types'
import TaskCard from './TaskCard'

interface KanbanColumnProps {
  status: string
  statusLabel: string
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export default function KanbanColumn({
  status,
  statusLabel,
  tasks,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status, data: { status } })

  return (
    <div className="flex flex-col bg-gray-100 rounded-lg p-4 min-h-96">
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
