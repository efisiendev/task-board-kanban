import { useState } from 'react'

export type AdditionalProperty = 'subtasks' | 'pages' | 'relations'

interface AddPropertyButtonProps {
  onAddProperty: (property: AdditionalProperty) => void
  availableProperties: AdditionalProperty[]
}

const PROPERTY_LABELS: Record<AdditionalProperty, { label: string; emoji: string }> = {
  subtasks: { label: 'Subtasks', emoji: '☑️' },
  pages: { label: 'Pages', emoji: '📄' },
  relations: { label: 'Relations', emoji: '🔗' },
}

export function AddPropertyButton({ onAddProperty, availableProperties }: AddPropertyButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (availableProperties.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded transition flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add property...
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown - compact width */}
          <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-20 py-1">
            {availableProperties.map((property) => {
              const { label, emoji } = PROPERTY_LABELS[property]
              return (
                <button
                  key={property}
                  type="button"
                  onClick={() => {
                    onAddProperty(property)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
