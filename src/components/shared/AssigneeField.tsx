import { useState, useRef, useEffect } from 'react'
import { useUserProfile } from '../../hooks/useUsers'
import UserSelector from '../UserSelector'

interface AssigneeFieldProps {
  value: string | null
  isEditing: boolean
  onEdit: () => void
  onChange: (value: string | null) => void
  onBlur: () => void
}

export function AssigneeField({ value, isEditing, onEdit, onChange, onBlur }: AssigneeFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: assigneeProfile } = useUserProfile(value || null)

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

  const handleChange = (userId: string | null) => {
    onChange(userId)
    setIsOpen(false)
  }

  if (isEditing && isOpen) {
    return (
      <div ref={dropdownRef} className="relative">
        <div className="absolute z-50 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <UserSelector
            value={value}
            onChange={handleChange}
            placeholder="Select user..."
          />
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onEdit}
      className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-50 transition"
    >
      {assigneeProfile ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
            {assigneeProfile.email[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-900 font-medium">
              {assigneeProfile.email}
            </span>
            {assigneeProfile.employee_number && (
              <span className="text-xs text-gray-500">
                {assigneeProfile.employee_number}
              </span>
            )}
          </div>
        </div>
      ) : (
        <span className="text-sm text-gray-400">Empty</span>
      )}
    </div>
  )
}
