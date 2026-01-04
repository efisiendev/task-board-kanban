import { useState, useRef, useEffect } from 'react'
import { useBatchUserProfiles } from '../../hooks/useBatchUserProfiles'
import UserSelector from '../UserSelector'

interface MultiAssigneeFieldProps {
  taskId: string
  boardId: string
  assigneeIds: string[]
  isEditing: boolean
  onEdit: () => void
  onAdd: (userId: string) => void
  onRemove: (userId: string) => void
  onBlur: () => void
}

export function MultiAssigneeField({
  taskId,
  boardId,
  assigneeIds,
  isEditing,
  onEdit,
  onAdd,
  onRemove,
  onBlur,
}: MultiAssigneeFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: assigneeProfiles = [] } = useBatchUserProfiles(assigneeIds)

  // Auto-open dropdown when editing starts
  useEffect(() => {
    if (isEditing) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [isEditing])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        onBlur()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onBlur])

  const handleAddAssignee = (userId: string | null) => {
    if (userId && !assigneeIds.includes(userId)) {
      onAdd(userId)
    }
    setIsOpen(false)
  }

  const handleRemoveAssignee = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove(userId)
  }

  if (isEditing && isOpen) {
    return (
      <div ref={dropdownRef} className="relative">
        <div className="absolute z-50 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <UserSelector
            value={null}
            onChange={handleAddAssignee}
            placeholder="Add assignee..."
          />
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onEdit}
      className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-50 transition min-h-[32px]"
    >
      {assigneeProfiles.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {assigneeProfiles.map((profile) => (
            <div
              key={profile.user_id}
              className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 rounded-full border border-blue-200 group hover:bg-blue-100 transition"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                {profile.email[0].toUpperCase()}
              </div>
              <span className="text-xs text-gray-900 font-medium max-w-[100px] truncate">
                {profile.email}
              </span>
              <button
                onClick={(e) => handleRemoveAssignee(profile.user_id, e)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition"
                title="Remove assignee"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <span className="text-sm text-gray-400">Empty</span>
      )}
    </div>
  )
}
