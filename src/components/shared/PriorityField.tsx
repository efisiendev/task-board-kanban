import { useState, useRef, useEffect } from 'react'
import { TaskPriority } from '../../types'

interface PriorityFieldProps {
  value: TaskPriority | null
  isEditing: boolean
  onEdit: () => void
  onChange: (value: TaskPriority | null) => void
  onBlur: () => void
}

const PRIORITY_OPTIONS: {
  value: TaskPriority | null
  label: string
  emoji: string
  bgClass: string
  textClass: string
  hoverClass: string
}[] = [
  {
    value: null,
    label: 'None',
    emoji: '⚪',
    bgClass: 'bg-gray-50',
    textClass: 'text-gray-600',
    hoverClass: 'hover:bg-gray-100'
  },
  {
    value: 'low',
    label: 'Low',
    emoji: '🔵',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    hoverClass: 'hover:bg-blue-100'
  },
  {
    value: 'medium',
    label: 'Medium',
    emoji: '🟡',
    bgClass: 'bg-yellow-50',
    textClass: 'text-yellow-700',
    hoverClass: 'hover:bg-yellow-100'
  },
  {
    value: 'high',
    label: 'High',
    emoji: '🟠',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    hoverClass: 'hover:bg-orange-100'
  },
  {
    value: 'urgent',
    label: 'Urgent',
    emoji: '🔴',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    hoverClass: 'hover:bg-red-100'
  },
]

export function PriorityField({ value, isEditing, onEdit, onChange, onBlur }: PriorityFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedOption = PRIORITY_OPTIONS.find((opt) => opt.value === value) || PRIORITY_OPTIONS[0]

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

  const handleSelect = (option: typeof PRIORITY_OPTIONS[0]) => {
    onChange(option.value)
    setIsOpen(false)
  }

  if (isEditing && isOpen) {
    return (
      <div ref={dropdownRef} className="relative">
        <div className="absolute z-50 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          {PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition ${option.hoverClass} ${
                value === option.value ? option.bgClass : ''
              }`}
            >
              <span className="text-base">{option.emoji}</span>
              <span className={`font-medium ${option.textClass}`}>{option.label}</span>
              {value === option.value && (
                <svg className="ml-auto w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onEdit}
      className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-50 transition"
    >
      {value ? (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${selectedOption.bgClass}`}>
          <span className="text-base">{selectedOption.emoji}</span>
          <span className={`text-sm font-medium ${selectedOption.textClass}`}>
            {selectedOption.label}
          </span>
        </div>
      ) : (
        <span className="text-sm text-gray-400">Empty</span>
      )}
    </div>
  )
}
