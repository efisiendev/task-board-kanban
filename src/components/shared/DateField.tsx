interface DateFieldProps {
  value: string
  isEditing: boolean
  onEdit: () => void
  onChange: (value: string) => void
  onBlur: () => void
  placeholder?: string
}

export function DateField({ value, isEditing, onEdit, onChange, onBlur, placeholder = 'Empty' }: DateFieldProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (isEditing) {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        autoFocus
      />
    )
  }

  return (
    <div onClick={onEdit} className="cursor-pointer">
      {value ? (
        <span className="text-sm text-gray-900">{formatDate(value)}</span>
      ) : (
        <span className="text-sm text-gray-400">{placeholder}</span>
      )}
    </div>
  )
}
