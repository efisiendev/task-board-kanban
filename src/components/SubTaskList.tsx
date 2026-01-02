import { useState, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { TaskChecklistItem, Task } from '../types'
import {
  useTaskChecklist,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from '../hooks/useTaskChecklist'
import { useBoardStatuses } from '../hooks/useBoardStatuses'
import { SubtaskModal } from './SubtaskModal'
import { useBatchUserProfiles } from '../hooks/useBatchUserProfiles'
import KanbanColumn from './KanbanColumn'

interface SubTaskListProps {
  taskId: string
  boardId: string
}

export function SubTaskList({ taskId, boardId }: SubTaskListProps) {
  const [selectedSubtask, setSelectedSubtask] = useState<TaskChecklistItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: items = [], isLoading } = useTaskChecklist(taskId)
  const { data: boardStatuses = [] } = useBoardStatuses(boardId)
  const updateItem = useUpdateChecklistItem()
  const deleteItem = useDeleteChecklistItem()

  // Batch fetch all user profiles for subtasks (prevents N+1 queries)
  const assigneeIds = useMemo(() => items.map(i => i.assigned_to), [items])
  const { data: userProfiles = [] } = useBatchUserProfiles(assigneeIds)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  if (isLoading) {
    return <div className="p-4 text-gray-500">Loading...</div>
  }

  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>No subtasks yet.</p>
        <p className="text-xs mt-2">Add subtasks to break down this task into smaller pieces</p>
      </div>
    )
  }

  // Convert checklist items to Task format for KanbanColumn compatibility
  const convertToTask = (item: TaskChecklistItem): Task => ({
    id: item.id,
    title: item.title,
    description: null, // Subtasks don't have description in schema
    status_id: item.status_id,
    priority: item.priority || null,
    assigned_to: item.assigned_to || null,
    due_date: item.due_date || null,
    start_date: null, // Subtasks don't have start_date in schema
    labels: item.labels || [],
    estimated_time: item.estimated_time || null,
    actual_time: item.actual_time || null,
    order_index: item.order_index,
    created_at: item.created_at,
    updated_at: item.updated_at,
    board_id: boardId,
    created_by: null, // Not needed for display
    board_status: undefined, // Will be filled by rendering
  })

  // Group items by status_id
  const tasksByStatusId = items.reduce((acc, item) => {
    const statusId = item.status_id
    if (!acc[statusId]) acc[statusId] = []
    acc[statusId].push(convertToTask(item))
    return acc
  }, {} as Record<string, Task[]>)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeItem = items.find((i) => i.id === active.id)
    if (!activeItem) return

    const overId = over.id as string

    // Determine the target status ID
    let newStatusId = ''

    // Check if dropped on a status column
    const isDroppedOnColumn = boardStatuses.some((s) => s.id === overId)

    if (isDroppedOnColumn) {
      newStatusId = overId
    } else {
      // If over is a subtask, find its status
      const overItem = items.find((i) => i.id === overId)
      if (overItem) {
        newStatusId = overItem.status_id
      }
    }

    if (!newStatusId) return

    // Calculate new order_index based on position
    // Filter out the item being dragged to get accurate positions
    const itemsInStatus = items
      .filter((i) => i.status_id === newStatusId && i.id !== activeItem.id)
      .sort((a, b) => a.order_index - b.order_index)

    let newOrderIndex = activeItem.order_index

    if (itemsInStatus.length === 0) {
      // Moving to empty column
      newOrderIndex = 0
    } else {
      const overItemId = over.id as string

      // If dropped on the column itself (not a specific item), add to end
      if (overItemId === newStatusId) {
        newOrderIndex = itemsInStatus[itemsInStatus.length - 1].order_index + 1
      } else {
        // Dropped on a specific item
        const overItemIndex = itemsInStatus.findIndex((i) => i.id === overItemId)

        if (overItemIndex === -1) {
          // Shouldn't happen, but fallback to end
          newOrderIndex = itemsInStatus[itemsInStatus.length - 1].order_index + 1
        } else if (overItemIndex === 0) {
          // Dropped on first item - place before it
          newOrderIndex = itemsInStatus[0].order_index - 1
        } else {
          // Dropped between items - average their order_index
          const above = itemsInStatus[overItemIndex - 1]
          const below = itemsInStatus[overItemIndex]
          newOrderIndex = (above.order_index + below.order_index) / 2
        }
      }
    }

    // Only update if status or order changed
    if (activeItem.status_id !== newStatusId || activeItem.order_index !== newOrderIndex) {
      updateItem.mutate({
        id: activeItem.id,
        taskId,
        status_id: newStatusId,
        orderIndex: newOrderIndex,
      })
    }
  }

  const handleDelete = (taskId: string) => {
    if (confirm('Delete this subtask?')) {
      deleteItem.mutate({ id: taskId, taskId: taskId })
    }
  }

  const handleTaskClick = (task: Task) => {
    // Find original checklist item
    const item = items.find(i => i.id === task.id)
    if (item) {
      setSelectedSubtask(item)
      setIsModalOpen(true)
    }
  }

  const handleModalSave = async () => {
    // For edit mode, auto-save already handles updates
    // Just close the modal
    setIsModalOpen(false)
    setSelectedSubtask(null)
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Subtasks ({items.length})</h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: `${boardStatuses.length * 320}px` }}>
            {boardStatuses.map((status) => (
              <KanbanColumn
                key={status.id}
                statusId={status.id}
                statusLabel={status.name}
                statusColor={status.color}
                tasks={tasksByStatusId[status.id] || []}
                userProfiles={userProfiles}
                onTaskClick={handleTaskClick}
                onDeleteTask={handleDelete}
                simplified={true}
              />
            ))}
          </div>
        </div>

      </DndContext>

      {/* Subtask Edit Modal */}
      <SubtaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedSubtask(null)
        }}
        onSave={handleModalSave}
        subtask={selectedSubtask}
        mode="edit"
      />
    </div>
  )
}
