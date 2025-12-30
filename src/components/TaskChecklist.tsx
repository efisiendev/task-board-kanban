import { useState } from 'react'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskChecklistItem, SubtaskStatus } from '../types'
import {
  useTaskChecklist,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
  useReorderChecklistItems,
} from '../hooks/useTaskChecklist'
import { SubtaskModal } from './SubtaskModal'

interface TaskChecklistProps {
  taskId: string
}

interface SortableItemProps {
  item: TaskChecklistItem
  onDelete: (id: string) => void
  onEdit: (item: TaskChecklistItem) => void
}

function SortableItem({ item, onDelete, onEdit }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const priorityColors = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  }

  const priorityIcons = {
    low: '▼',
    medium: '■',
    high: '▲',
    urgent: '⚠',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-0.5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Title */}
        <p
          className="text-sm text-gray-900 break-words cursor-pointer hover:text-blue-600"
          onClick={() => onEdit(item)}
          title="Click to edit"
        >
          {item.title}
        </p>

        {/* Properties Display */}
        {(item.priority || item.due_date || item.estimated_time) && (
          <div className="flex items-center gap-2 text-xs">
            {/* Priority */}
            {item.priority && (
              <span className={`flex items-center gap-0.5 ${priorityColors[item.priority]}`}>
                {priorityIcons[item.priority]} {item.priority}
              </span>
            )}

            {/* Due Date */}
            {item.due_date && (
              <span className="flex items-center gap-0.5 text-gray-600">
                📅 {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}

            {/* Estimated Time */}
            {item.estimated_time && (
              <span className="flex items-center gap-0.5 text-gray-600">
                ⏱️ {item.estimated_time}m
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
        <button
          onClick={() => onDelete(item.id)}
          className="text-gray-400 hover:text-red-600"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

interface ColumnProps {
  status: SubtaskStatus
  title: string
  items: TaskChecklistItem[]
  onDelete: (id: string) => void
  onEdit: (item: TaskChecklistItem) => void
}

function Column({ status, title, items, onDelete, onEdit }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const bgColor = {
    todo: 'bg-gray-50',
    in_progress: 'bg-blue-50',
    done: 'bg-green-50',
  }[status]

  const borderColor = {
    todo: 'border-gray-200',
    in_progress: 'border-blue-200',
    done: 'border-green-200',
  }[status]

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 ${bgColor} ${borderColor} border rounded-lg p-3 transition-colors ${
        isOver ? 'ring-2 ring-blue-400 bg-blue-100' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm text-gray-700">{title}</h4>
        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export function TaskChecklist({ taskId }: TaskChecklistProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState<TaskChecklistItem | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const { data: items = [], isLoading } = useTaskChecklist(taskId)
  const createItem = useCreateChecklistItem()
  const updateItem = useUpdateChecklistItem()
  const deleteItem = useDeleteChecklistItem()
  const reorderItems = useReorderChecklistItems()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Group items by status
  const itemsByStatus = {
    todo: items.filter((i) => i.status === 'todo'),
    in_progress: items.filter((i) => i.status === 'in_progress'),
    done: items.filter((i) => i.status === 'done'),
  }

  const handleOpenCreateModal = () => {
    setModalMode('create')
    setEditingSubtask(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (subtask: TaskChecklistItem) => {
    setModalMode('edit')
    setEditingSubtask(subtask)
    setIsModalOpen(true)
  }

  const handleModalSave = (data: {
    title: string
    priority: TaskChecklistItem['priority']
    due_date: string | null
    estimated_time: number | null
  }) => {
    if (modalMode === 'create') {
      // Calculate max order_index for todo column
      const todoItems = itemsByStatus.todo
      const maxOrder = todoItems.length > 0 ? Math.max(...todoItems.map((i) => i.order_index)) : 0

      createItem.mutate({
        taskId,
        title: data.title,
        orderIndex: maxOrder + 1,
        status: 'todo',
        priority: data.priority,
        dueDate: data.due_date,
        estimatedTime: data.estimated_time,
      })
    } else if (editingSubtask) {
      updateItem.mutate({
        id: editingSubtask.id,
        taskId,
        title: data.title,
        priority: data.priority,
        due_date: data.due_date,
        estimated_time: data.estimated_time,
      })
    }
  }

  const handleDelete = (id: string) => {
    deleteItem.mutate({ id, taskId })
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Not needed for our implementation
    return
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeItem = items.find((i) => i.id === active.id)
    if (!activeItem) return

    // Check if dropped over another item or over a column container
    const overId = over.id.toString()

    // If over.id is a status (column container), not an item
    if (overId === 'todo' || overId === 'in_progress' || overId === 'done') {
      const newStatus = overId as SubtaskStatus
      if (activeItem.status === newStatus) return

      // Move to empty column or top of column
      const targetColumnItems = items.filter((i) => i.status === newStatus)
      const maxOrder = targetColumnItems.length > 0
        ? Math.max(...targetColumnItems.map((i) => i.order_index))
        : 0

      updateItem.mutate({
        id: activeItem.id,
        taskId,
        status: newStatus,
        orderIndex: maxOrder + 1,
      })
      return
    }

    // Otherwise, dropped over another item
    const overItem = items.find((i) => i.id === over.id)
    if (!overItem) return

    if (active.id === over.id) return

    // If moving within the same column, just reorder
    if (activeItem.status === overItem.status) {
      const columnItems = items.filter((i) => i.status === activeItem.status)
      const oldIndex = columnItems.findIndex((i) => i.id === active.id)
      const newIndex = columnItems.findIndex((i) => i.id === over.id)

      if (oldIndex === newIndex) return

      // Reorder within column
      const reordered = [...columnItems]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      const updates = reordered.map((item, index) => ({
        id: item.id,
        order_index: index,
      }))

      reorderItems.mutate({ taskId, items: updates })
    } else {
      // Moving to different column - update status and order
      const targetColumnItems = items.filter((i) => i.status === overItem.status)
      const targetIndex = targetColumnItems.findIndex((i) => i.id === over.id)

      const updates = [
        {
          id: activeItem.id,
          order_index: targetIndex,
          status: overItem.status,
        },
        ...targetColumnItems
          .filter((i) => i.id !== activeItem.id)
          .map((item, index) => ({
            id: item.id,
            order_index: index >= targetIndex ? index + 1 : index,
          })),
      ]

      reorderItems.mutate({ taskId, items: updates })
    }
  }

  // Calculate progress (done items)
  const doneCount = itemsByStatus.done.length
  const totalCount = items.length
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading subtasks...</div>
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>
              {doneCount} / {totalCount} completed
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Kanban Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-3">
          <Column
            status="todo"
            title="To Do"
            items={itemsByStatus.todo}
            onDelete={handleDelete}
            onEdit={handleOpenEditModal}
          />
          <Column
            status="in_progress"
            title="In Progress"
            items={itemsByStatus.in_progress}
            onDelete={handleDelete}
            onEdit={handleOpenEditModal}
          />
          <Column
            status="done"
            title="Done"
            items={itemsByStatus.done}
            onDelete={handleDelete}
            onEdit={handleOpenEditModal}
          />
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="p-3 bg-white border-2 border-blue-500 rounded-lg shadow-lg">
              {items.find((i) => i.id === activeId)?.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add new subtask */}
      <div className="pt-2 border-t border-gray-200">
        <button
          onClick={handleOpenCreateModal}
          className="w-full px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Subtask
        </button>
      </div>

      {/* Subtask Modal */}
      <SubtaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        subtask={editingSubtask}
        mode={modalMode}
      />
    </div>
  )
}
