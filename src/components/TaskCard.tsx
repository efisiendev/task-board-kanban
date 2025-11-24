import { useDraggable } from '@dnd-kit/core'
import { Task } from '../types'

interface TaskCardProps {
  task: Task
  onClick: () => void
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`p-3 bg-white rounded-lg border border-gray-200 cursor-grab hover:shadow-md transition ${
        isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''
      }`}
    >
      <h3 className="font-medium text-gray-900 line-clamp-2">{task.title}</h3>
      {task.description && (
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
      )}
    </div>
  )
}
