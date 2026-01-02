import { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  position?: 'center' | 'right' | 'left'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const positionClasses = {
  center: 'items-center justify-center',
  right: 'justify-end',
  left: 'justify-start',
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'w-full',
}

export function Modal({ isOpen, onClose, children, position = 'center', size = 'md' }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 flex ${positionClasses[position]}`}>
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className={`relative bg-white shadow-2xl ${position === 'center' ? 'rounded-lg' : ''} ${position === 'center' ? sizeClasses[size] : ''} ${position !== 'center' ? 'h-full' : ''}`}>
        {children}
      </div>
    </div>
  )
}

interface ModalHeaderProps {
  title: string
  onClose: () => void
}

export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

interface ModalContentProps {
  children: ReactNode
}

export function ModalContent({ children }: ModalContentProps) {
  return (
    <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-200px)]">
      {children}
    </div>
  )
}

interface ModalFooterProps {
  children: ReactNode
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
      {children}
    </div>
  )
}
