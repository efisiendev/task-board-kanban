import { useState } from 'react'
import { useBoardStatuses, useCreateBoardStatus, useUpdateBoardStatus, useDeleteBoardStatus, useReorderBoardStatuses } from '../hooks/useBoardStatuses'

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

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const reordered = [...statuses]
    const temp = reordered[index]
    reordered[index] = reordered[index - 1]
    reordered[index - 1] = temp

    try {
      await reorderMutation.mutateAsync({
        boardId,
        statusIds: reordered.map((s) => s.id),
      })
    } catch (error) {
      console.error('Failed to reorder:', error)
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index === statuses.length - 1) return
    const reordered = [...statuses]
    const temp = reordered[index]
    reordered[index] = reordered[index + 1]
    reordered[index + 1] = temp

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

      <div className="space-y-2">
        {statuses.map((status, index) => (
          <div
            key={status.id}
            className={`p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition ${
              editingId === status.id ? 'space-y-2' : 'flex items-center gap-3'
            }`}
          >
            {editingId === status.id ? (
              // Edit Mode (vertical layout)
              <>
                <div className="flex items-center gap-3">
                  {/* Color Indicator */}
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      COLOR_OPTIONS.find((c) => c.value === editColor)?.class || 'bg-gray-500'
                    }`}
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleUpdate(status.id)}
                    className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition flex-shrink-0"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 text-xs bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition flex-shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              // View Mode (horizontal layout)
              <>
                {/* Color Indicator */}
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    COLOR_OPTIONS.find((c) => c.value === status.color)?.class || 'bg-gray-500'
                  }`}
                />

                {/* Status Name */}
                <span className="flex-1 min-w-0 font-medium text-gray-900 truncate">
                  {status.name}
                  {status.is_default && (
                    <span className="ml-2 text-xs text-gray-500">(default)</span>
                  )}
                </span>

                {/* Actions */}
                {isOwner && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Reorder buttons */}
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === statuses.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Move down"
                    >
                      ↓
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setEditingId(status.id)
                        setEditName(status.name)
                        setEditColor(status.color)
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition"
                      title="Edit"
                    >
                      ✏️
                    </button>

                    {/* Delete button */}
                    {!status.is_default && (
                      <button
                        onClick={() => handleDelete(status.id, status.name)}
                        className="p-1 hover:bg-red-100 text-red-600 rounded transition"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
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
            <div className="flex items-center gap-2">
              <select
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
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
        )}
      </div>

      {statuses.length === 0 && !isAdding && (
        <div className="text-center text-gray-400 text-sm py-8">
          No statuses yet. Add your first status to get started.
        </div>
      )}
    </div>
  )
}
