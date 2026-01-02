import { ReactNode } from 'react'
import { CloseIcon } from './Icons'

interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
  side: 'left' | 'right'
  title?: string
  children: ReactNode
  width?: string
}

export function SidePanel({
  isOpen,
  onClose,
  side,
  title,
  children,
  width = 'w-80'
}: SidePanelProps) {
  if (!isOpen) return null

  const sideClasses = side === 'left' ? 'left-0' : 'right-0'

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40 md:hidden"
        onClick={onClose}
      />
      <div className={`fixed md:static inset-y-0 ${sideClasses} z-50 md:z-auto ${width}`}>
        <div className="h-full overflow-y-auto p-4 md:p-0 bg-white md:bg-transparent shadow-2xl md:shadow-none">
          <div className="flex items-center justify-between mb-4 md:hidden">
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <CloseIcon />
            </button>
          </div>
          {title && <h3 className="hidden md:block text-lg font-semibold mb-4">{title}</h3>}
          {children}
        </div>
      </div>
    </>
  )
}
