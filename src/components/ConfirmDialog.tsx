import { useState } from 'react'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  confirmButtonClass?: string
  icon?: string
  requireTextConfirm?: boolean
  textToConfirm?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-blue-600 hover:bg-blue-700',
  icon,
  requireTextConfirm = false,
  textToConfirm = '',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [inputText, setInputText] = useState('')

  if (!isOpen) return null

  const canConfirm = requireTextConfirm ? inputText === textToConfirm : true

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm()
      setInputText('')
    }
  }

  const handleCancel = () => {
    onCancel()
    setInputText('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          {icon && <span className="text-2xl">{icon}</span>}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Message */}
        <div className="mb-6 text-sm text-gray-700">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>

        {/* Text confirmation input (optional) */}
        {requireTextConfirm && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <strong>{textToConfirm}</strong> to confirm:
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canConfirm) handleConfirm()
                if (e.key === 'Escape') handleCancel()
              }}
              placeholder="Enter text..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
