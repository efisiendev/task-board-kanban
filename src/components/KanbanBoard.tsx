import {
  DndContext,
  DragEndEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Task, BoardStatus } from '../types'
import KanbanColumn from './KanbanColumn'

interface KanbanBoardProps {
  tasks: Task[]
  statuses: BoardStatus[]
  onTaskClick: (task: Task) => void
  onTaskMoved: (taskId: string, newStatusId: string, newOrderIndex: number) => void
}

export default function KanbanBoard({ tasks, statuses, onTaskClick, onTaskMoved }: KanbanBoardProps) {

  // Configure pointer sensor for better drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const taskId = active.id as string
    const overData = over.data?.current

    // Determine the target status ID
    let newStatusId = ''

    // If over is a column (droppable area)
    if (overData?.statusId) {
      newStatusId = overData.statusId
    } else {
      // If over is a task, find its status
      const overTask = tasks.find((t) => t.id === over.id)
      if (overTask) {
        newStatusId = overTask.status_id
      }
    }

    if (!newStatusId) return

    const tasksInStatus = tasks
      .filter((t) => t.status_id === newStatusId)
      .sort((a, b) => a.order_index - b.order_index)

    let newOrderIndex = 0
    if (tasksInStatus.length > 0) {
      const overTaskId = over.id as string
      const overTaskIndex = tasksInStatus.findIndex((t) => t.id === overTaskId)

      if (overTaskIndex === -1) {
        // Dropped in empty area, add to end
        newOrderIndex = tasksInStatus[tasksInStatus.length - 1].order_index + 1
      } else if (overTaskIndex === 0) {
        newOrderIndex = tasksInStatus[0].order_index - 1
      } else if (overTaskIndex === tasksInStatus.length - 1) {
        newOrderIndex = tasksInStatus[tasksInStatus.length - 1].order_index + 1
      } else {
        const above = tasksInStatus[overTaskIndex - 1]
        const below = tasksInStatus[overTaskIndex]
        newOrderIndex = (above.order_index + below.order_index) / 2
      }
    }

    onTaskMoved(taskId, newStatusId, newOrderIndex)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6" style={{ minWidth: `${statuses.length * 320}px` }}>
          {statuses.map((status) => (
            <KanbanColumn
              key={status.id}
              statusId={status.id}
              statusLabel={status.name}
              statusColor={status.color}
              tasks={tasks.filter((t) => t.status_id === status.id)}
              onTaskClick={onTaskClick}
            />
          ))}
        </div>
      </div>
    </DndContext>
  )
}
