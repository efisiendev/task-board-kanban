import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { TaskChecklistItem } from '../types'
import {
  useTaskChecklist,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from '../hooks/useTaskChecklist'
import { useBoardStatuses } from '../hooks/useBoardStatuses'
import { SubtaskModal } from './SubtaskModal'

interface SubTaskListProps {
  taskId: string
  boardId: string
}

interface SortableSubtaskProps {
  item: TaskChecklistItem
  onDelete: (id: string) => void
  onEdit: (item: TaskChecklistItem) => void
}

function SortableSubtask({ item, onDelete, onEdit }: SortableSubtaskProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
  })

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = item.due_date && new Date(item.due_date) < new Date()

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only trigger edit if not clicking delete button
        const target = e.target as HTMLElement
        if (!target.closest('button')) {
          onEdit(item)
        }
      }}
      className={`bg-white p-3 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow group ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Title and Delete */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-gray-900 text-sm flex-1">{item.title}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm('Delete this subtask?')) {
              onDelete(item.id)
            }
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Labels */}
      {item.labels && item.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {item.labels.slice(0, 3).map((label, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
            >
              {label}
            </span>
          ))}
          {item.labels.length > 3 && (
            <span className="text-xs text-gray-500">+{item.labels.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer: Priority, Due Date, Assignee */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* Priority */}
          {item.priority && (
            <span className={`px-2 py-0.5 rounded-full ${priorityColors[item.priority]}`}>
              {item.priority}
            </span>
          )}

          {/* Due Date */}
          {item.due_date && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatDate(item.due_date)}
            </span>
          )}

          {/* Estimated Time */}
          {item.estimated_time && (
            <span className="text-gray-500">
              {item.estimated_time}m
            </span>
          )}
        </div>

        {/* Assignee - just initials for now */}
        {item.assigned_to && (
          <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
            ?
          </div>
        )}
      </div>
    </div>
  )
}

interface DroppableColumnProps {
  statusId: string
  statusName: string
  statusColor: string
  items: TaskChecklistItem[]
  onDelete: (id: string) => void
  onEdit: (item: TaskChecklistItem) => void
}

function DroppableColumn({ statusId, statusName, statusColor, items, onDelete, onEdit }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusId,
  })

  const colorClass = statusColor.startsWith('bg-') ? statusColor : ''
  const colorStyle = statusColor.startsWith('#') ? { backgroundColor: statusColor } : {}

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50 rounded-lg p-3 min-h-[200px] ${isOver ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${colorClass}`} style={colorStyle} />
        <h4 className="font-medium text-sm text-gray-700">{statusName}</h4>
        <span className="text-xs text-gray-500">({items.length})</span>
      </div>

      <div className="space-y-2">
        {items
          .sort((a, b) => a.order_index - b.order_index)
          .map((item) => (
            <SortableSubtask key={item.id} item={item} onDelete={onDelete} onEdit={onEdit} />
          ))}

        {items.length === 0 && (
          <div className="text-xs text-gray-400 text-center py-4">Drop here</div>
        )}
      </div>
    </div>
  )
}

export function SubTaskList({ taskId, boardId }: SubTaskListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedSubtask, setSelectedSubtask] = useState<TaskChecklistItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: items = [], isLoading } = useTaskChecklist(taskId)
  const { data: boardStatuses = [] } = useBoardStatuses(boardId)
  const updateItem = useUpdateChecklistItem()
  const deleteItem = useDeleteChecklistItem()

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

  // Group items by status_id
  const itemsByStatusId = items.reduce((acc, item) => {
    const statusId = item.status_id
    if (!acc[statusId]) acc[statusId] = []
    acc[statusId].push(item)
    return acc
  }, {} as Record<string, TaskChecklistItem[]>)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

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
    const itemsInStatus = items
      .filter((i) => i.status_id === newStatusId)
      .sort((a, b) => a.order_index - b.order_index)

    let newOrderIndex = activeItem.order_index

    if (itemsInStatus.length > 0) {
      const overItemId = over.id as string
      const overItemIndex = itemsInStatus.findIndex((i) => i.id === overItemId)

      if (overItemIndex === -1) {
        // Dropped in empty area, add to end
        newOrderIndex = itemsInStatus[itemsInStatus.length - 1].order_index + 1
      } else if (overItemIndex === 0) {
        newOrderIndex = itemsInStatus[0].order_index - 1
      } else if (overItemIndex === itemsInStatus.length - 1) {
        newOrderIndex = itemsInStatus[itemsInStatus.length - 1].order_index + 1
      } else {
        const above = itemsInStatus[overItemIndex - 1]
        const below = itemsInStatus[overItemIndex]
        newOrderIndex = (above.order_index + below.order_index) / 2
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

  const handleDelete = (id: string) => {
    deleteItem.mutate({ id, taskId })
  }

  const handleEdit = (item: TaskChecklistItem) => {
    setSelectedSubtask(item)
    setIsModalOpen(true)
  }

  const handleModalSave = async () => {
    // For edit mode, auto-save already handles updates
    // Just close the modal
    setIsModalOpen(false)
    setSelectedSubtask(null)
  }

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null

  return (
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Subtasks ({items.length})</h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-4">
          {boardStatuses.map((status) => (
            <DroppableColumn
              key={status.id}
              statusId={status.id}
              statusName={status.name}
              statusColor={status.color}
              items={itemsByStatusId[status.id] || []}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="bg-white p-2 rounded border-2 border-blue-400 text-sm shadow-lg">
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={activeItem.is_completed} readOnly className="mt-0.5 rounded" />
                <div className="flex-1">
                  <div className="font-medium">{activeItem.title}</div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
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
