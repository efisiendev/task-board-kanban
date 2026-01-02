import { useState, useRef, useEffect } from 'react'

interface LabelsFieldProps {
  labels: string[]
  labelInput: string
  isEditing: boolean
  onEdit: () => void
  onLabelInputChange: (value: string) => void
  onAddLabel: () => void
  onRemoveLabel: (label: string) => void
  onBlur: () => void
}

export function LabelsField({
  labels,
  labelInput,
  isEditing,
  onEdit,
  onLabelInputChange,
  onAddLabel,
  onRemoveLabel,
  onBlur,
}: LabelsFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-open when editing starts
  useEffect(() => {
    if (isEditing) {
      setIsOpen(true)
      // Focus input after a short delay to ensure it's rendered
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setIsOpen(false)
    }
  }, [isEditing])

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        onBlur()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onBlur])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onAddLabel()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      onBlur()
    }
  }

  if (isEditing && isOpen) {
    return (
      <div ref={containerRef} className="relative">
        {/* Mobile backdrop */}
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => { setIsOpen(false); onBlur(); }} />

        {/* Modal */}
        <div className="fixed md:absolute left-1/2 top-1/2 md:left-0 md:top-auto -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 z-50 md:mt-1 w-[90vw] max-w-sm md:w-96 md:max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 p-3 md:max-h-[80vh] overflow-y-auto">
          {/* Input */}
          <div className="flex gap-2 mb-3">
            <input
              ref={inputRef}
              type="text"
              value={labelInput}
              onChange={(e) => onLabelInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type and press Enter..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-w-0"
            />
            <button
              type="button"
              onClick={onAddLabel}
              disabled={!labelInput.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0"
            >
              Add
            </button>
          </div>

          {/* Labels List */}
          {labels.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Current Labels
              </div>
              <div className="flex flex-wrap gap-2 max-w-full">
                {labels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium group hover:bg-blue-100 transition break-all"
                  >
                    <span className="break-all">{label}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveLabel(label)}
                      className="text-blue-600 hover:text-red-600 transition flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {labels.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-400">
              No labels yet. Add one above!
            </div>
          )}

          {/* Close Button */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onBlur()
              }}
              className="w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onEdit}
      className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-50 transition min-h-[32px]"
    >
      {labels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium"
            >
              {label}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-sm text-gray-400">Empty</span>
      )}
    </div>
  )
}
