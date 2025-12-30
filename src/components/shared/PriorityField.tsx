import { TaskPriority } from '../../types'

interface PriorityFieldProps {
  value: TaskPriority | null
  isEditing: boolean
  onEdit: () => void
  onChange: (value: TaskPriority | null) => void
  onBlur: () => void
}

const PRIORITY_OPTIONS: { value: TaskPriority | null; label: string; emoji: string; colorClass: string }[] = [
  { value: null, label: 'None', emoji: '', colorClass: 'text-gray-400' },
  { value: 'low', label: 'Low', emoji: '🔵', colorClass: 'text-blue-600' },
  { value: 'medium', label: 'Medium', emoji: '🟡', colorClass: 'text-yellow-600' },
  { value: 'high', label: 'High', emoji: '🟠', colorClass: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', emoji: '🔴', colorClass: 'text-red-600' },
]

export function PriorityField({ value, isEditing, onEdit, onChange, onBlur }: PriorityFieldProps) {
  const selectedOption = PRIORITY_OPTIONS.find((opt) => opt.value === value) || PRIORITY_OPTIONS[0]

  if (isEditing) {
    return (
      <select
        value={value || ''}
        onChange={(e) => {
          const newValue = e.target.value === '' ? null : (e.target.value as TaskPriority)
          onChange(newValue)
        }}
        onBlur={onBlur}
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        autoFocus
      >
        {PRIORITY_OPTIONS.map((option) => (
          <option key={option.label} value={option.value || ''}>
            {option.emoji} {option.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div onClick={onEdit} className="flex items-center gap-2 cursor-pointer">
      {value ? (
        <span className={`text-sm font-medium ${selectedOption.colorClass}`}>
          {selectedOption.emoji} {selectedOption.label}
        </span>
      ) : (
        <span className="text-sm text-gray-400">Empty</span>
      )}
    </div>
  )
}
