interface NewTaskDropdownProps {
  isOpen: boolean
  isOwner: boolean
  onClose: () => void
  onNewTask: () => void
  onSettings: () => void
}

export function NewTaskDropdown({ isOpen, isOwner, onClose, onNewTask, onSettings }: NewTaskDropdownProps) {
  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
      />
      <div className="fixed md:absolute right-4 md:right-0 top-auto md:top-auto mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
        <button
          onClick={onNewTask}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-700"
        >
          <span className="text-lg">📝</span>
          New Task
        </button>
        {isOwner && (
          <>
            <div className="border-t border-gray-200 my-1" />
            <button
              onClick={onSettings}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-700"
            >
              <span className="text-lg">⚙️</span>
              Board Settings
            </button>
          </>
        )}
      </div>
    </>
  )
}
