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
import { Trash2, Edit } from 'lucide-react'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBoardStatuses, useCreateBoardStatus, useUpdateBoardStatus, useDeleteBoardStatus, useReorderBoardStatuses } from '../hooks/useBoardStatuses'
import { BoardStatus } from '../../../types'

interface BoardStatusManagerProps {
  boardId: string
  isOwner: boolean
}

const COLOR_OPTIONS = [
  { value: 'gray', label: 'Gray', class: 'bg-gray-500' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
]

interface SortableStatusItemProps {
  status: BoardStatus
  isOwner: boolean
  isEditing: boolean
  editName: string
  editColor: string
  onStartEdit: (status: BoardStatus) => void
  onSaveEdit: (id: string) => void
  onCancelEdit: () => void
  onDelete: (id: string, name: string) => void
  onEditNameChange: (name: string) => void
  onEditColorChange: (color: string) => void
}

function SortableStatusItem({
  status,
  isOwner,
  isEditing,
  editName,
  editColor,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onEditNameChange,
  onEditColorChange,
}: SortableStatusItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition ${
        isEditing ? 'space-y-2' : 'flex items-center gap-3'
      }`}
    >
      {isEditing ? (
        // Edit Mode
        <>
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                COLOR_OPTIONS.find((c) => c.value === editColor)?.class || 'bg-gray-500'
              }`}
            />
            <input
              type="text"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onEditColorChange(c.value)}
                  className={`w-8 h-8 rounded-full ${c.class} transition-all ${
                    editColor === c.value
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105 opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
            <button
              onClick={() => onSaveEdit(status.id)}
              className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition flex-shrink-0"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="px-3 py-1 text-xs bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition flex-shrink-0"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        // View Mode with drag handle
        <>
          {/* Drag Handle */}
          {isOwner && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0"
              title="Drag to reorder"
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
          )}

          {/* Color Indicator */}
          <div
            className={`w-3 h-3 rounded-full flex-shrink-0 ${
              COLOR_OPTIONS.find((c) => c.value === status.color)?.class || 'bg-gray-500'
            }`}
          />

          {/* Status Name */}
          <span className="flex-1 min-w-0 font-medium text-gray-900 truncate">
            {status.name}
            {status.is_default && <span className="ml-2 text-xs text-gray-500">(default)</span>}
          </span>

          {/* Actions */}
          {isOwner && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onStartEdit(status)}
                className="p-1 hover:bg-gray-200 rounded transition"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              {!status.is_default && (
                <button
                  onClick={() => onDelete(status.id, status.name)}
                  className="p-1 hover:bg-red-100 text-red-600 rounded transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function BoardStatusManager({ boardId, isOwner }: BoardStatusManagerProps) {
  const { data: statuses = [], isLoading } = useBoardStatuses(boardId)
  const createMutation = useCreateBoardStatus()
  const updateMutation = useUpdateBoardStatus()
  const deleteMutation = useDeleteBoardStatus()
  const reorderMutation = useReorderBoardStatuses()

  const [isAdding, setIsAdding] = useState(false)
  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('gray')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleCreate = async () => {
    if (!newStatusName.trim()) return

    try {
      await createMutation.mutateAsync({
        boardId,
        name: newStatusName.trim(),
        color: newStatusColor,
        orderIndex: statuses.length,
      })
      setNewStatusName('')
      setNewStatusColor('gray')
      setIsAdding(false)
    } catch (error) {
      console.error('Failed to create status:', error)
      alert('Failed to create status')
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return

    try {
      await updateMutation.mutateAsync({
        id,
        boardId,
        name: editName.trim(),
        color: editColor,
      })
      setEditingId(null)
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update status')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete status "${name}"? All tasks with this status must be moved first.`)) return

    try {
      await deleteMutation.mutateAsync({ id, boardId })
    } catch (error) {
      console.error('Failed to delete status:', error)
      alert('Cannot delete status with existing tasks. Please move or delete tasks first.')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = statuses.findIndex((s) => s.id === active.id)
    const newIndex = statuses.findIndex((s) => s.id === over.id)

    const reordered = arrayMove(statuses, oldIndex, newIndex)

    try {
      await reorderMutation.mutateAsync({
        boardId,
        statusIds: reordered.map((s) => s.id),
      })
    } catch (error) {
      console.error('Failed to reorder:', error)
    }
  }

  if (isLoading) {
    return <div className="text-gray-500 text-sm">Loading statuses...</div>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Board Statuses</h3>
        {isOwner && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition"
          >
            + Add Status
          </button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={statuses.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {statuses.map((status) => (
              <SortableStatusItem
                key={status.id}
                status={status}
                isOwner={isOwner}
                isEditing={editingId === status.id}
                editName={editName}
                editColor={editColor}
                onStartEdit={(s) => {
                  setEditingId(s.id)
                  setEditName(s.name)
                  setEditColor(s.color)
                }}
                onSaveEdit={handleUpdate}
                onCancelEdit={() => setEditingId(null)}
                onDelete={handleDelete}
                onEditNameChange={setEditName}
                onEditColorChange={setEditColor}
              />
            ))}

            {/* Add New Status Form */}
            {isAdding && (
              <div className="space-y-3 p-3 rounded-lg border-2 border-blue-300 bg-blue-50">
                <input
                  type="text"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  placeholder="Status name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNewStatusColor(c.value)}
                        className={`w-8 h-8 rounded-full ${c.class} transition-all ${
                          newStatusColor === c.value
                            ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                            : 'hover:scale-105 opacity-70 hover:opacity-100'
                        }`}
                        title={c.label}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreate}
                      disabled={!newStatusName.trim()}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false)
                        setNewStatusName('')
                        setNewStatusColor('gray')
                      }}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition flex-shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {statuses.length === 0 && !isAdding && (
        <div className="text-center text-gray-400 text-sm py-8">
          No statuses yet. Add your first status to get started.
        </div>
      )}
    </div>
  )
}
