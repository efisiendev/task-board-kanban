import BoardStatusManager from './BoardStatusManager'
import { X } from '../lib/icons'

interface SettingsOverlayProps {
  isOpen: boolean
  boardId: string
  isOwner: boolean
  onClose: () => void
}

export function SettingsOverlay({ isOpen, boardId, isOwner, onClose }: SettingsOverlayProps) {
  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Board Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <BoardStatusManager boardId={boardId} isOwner={isOwner} />
        </div>
      </div>
    </>
  )
}
