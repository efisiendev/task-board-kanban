interface TimeFieldProps {
  value: string
  isEditing: boolean
  onEdit: () => void
  onChange: (value: string) => void
  onBlur: () => void
  placeholder?: string
}

export function TimeField({ value, isEditing, onEdit, onChange, onBlur, placeholder = 'Empty' }: TimeFieldProps) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="0"
          min="0"
          autoFocus
        />
        <span className="text-sm text-gray-600">min</span>
      </div>
    )
  }

  return (
    <div onClick={onEdit} className="cursor-pointer">
      {value ? (
        <span className="text-sm text-gray-900">{value} min</span>
      ) : (
        <span className="text-sm text-gray-400">{placeholder}</span>
      )}
    </div>
  )
}
