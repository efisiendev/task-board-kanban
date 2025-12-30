import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskChecklistItem } from '../types'
import {
  useTaskChecklist,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
  useReorderChecklistItems,
} from '../hooks/useTaskChecklist'

interface TaskChecklistProps {
  taskId: string
}

interface SortableItemProps {
  item: TaskChecklistItem
  onToggle: (id: string, isCompleted: boolean) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, title: string) => void
}

function SortableItem({ item, onToggle, onDelete, onUpdate }: SortableItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.title)

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

  const handleSave = () => {
    if (editValue.trim() && editValue !== item.title) {
      onUpdate(item.id, editValue.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(item.title)
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
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

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={item.is_completed}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
      />

      {/* Title */}
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <span
          className={`flex-1 text-sm ${
            item.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
          }`}
          onDoubleClick={() => setIsEditing(true)}
        >
          {item.title}
        </span>
      )}

      {/* Delete button */}
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}

export function TaskChecklist({ taskId }: TaskChecklistProps) {
  const [newItemTitle, setNewItemTitle] = useState('')
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

  const handleAddItem = () => {
    if (!newItemTitle.trim()) return

    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order_index)) : 0
    createItem.mutate({
      taskId,
      title: newItemTitle.trim(),
      orderIndex: maxOrder + 1,
    })
    setNewItemTitle('')
  }

  const handleToggle = (id: string, isCompleted: boolean) => {
    updateItem.mutate({ id, taskId, isCompleted })
  }

  const handleDelete = (id: string) => {
    deleteItem.mutate({ id, taskId })
  }

  const handleUpdate = (id: string, title: string) => {
    updateItem.mutate({ id, taskId, title })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    const reorderedItems = arrayMove(items, oldIndex, newIndex)
    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      order_index: index,
    }))

    reorderItems.mutate({ taskId, items: updates })
  }

  const completedCount = items.filter((i) => i.is_completed).length
  const totalCount = items.length

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading checklist...</div>
  }

  return (
    <div className="space-y-3">
      {/* Progress */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>
              {completedCount} / {totalCount} completed
            </span>
            <span>{Math.round((completedCount / totalCount) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist items */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {items.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add new item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          placeholder="Add checklist item..."
          className="flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddItem}
          disabled={!newItemTitle.trim()}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </div>
  )
}
