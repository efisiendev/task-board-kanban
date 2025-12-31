import { useState, useEffect, useRef } from 'react'
import { BoardPage } from '../types'
import { useUpdateBoardPage } from '../hooks/useBoardPages'

interface PageModalProps {
  page: BoardPage
  onClose: () => void
}

export function PageModal({ page, onClose }: PageModalProps) {
  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState(page.content || '')
  const [isSaving, setIsSaving] = useState(false)
  const updateMutation = useUpdateBoardPage()
  const lastEditTimeRef = useRef(Date.now())
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Sync with page changes (Realtime updates)
  useEffect(() => {
    if (page) {
      const timeSinceLastEdit = Date.now() - lastEditTimeRef.current
      if (timeSinceLastEdit > 2000) {
        setTitle(page.title)
        setContent(page.content || '')
      }
    }
  }, [page])

  // Auto-save with debouncing
  const debouncedSave = (newTitle: string, newContent: string) => {
    if (!page || page.type === 'folder') return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        await updateMutation.mutateAsync({
          id: page.id,
          board_id: page.board_id,
          title: newTitle.trim() || 'Untitled',
          content: newContent,
        })
      } catch (error) {
        console.error('Failed to save page:', error)
      } finally {
        setIsSaving(false)
      }
    }, 500)
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    lastEditTimeRef.current = Date.now()
    debouncedSave(newTitle, content)
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    lastEditTimeRef.current = Date.now()
    debouncedSave(title, newContent)
  }

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  if (page.type === 'folder') {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Sidebar from right */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[600px] lg:w-[700px] bg-white shadow-2xl z-[51] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Page Editor</h2>
              {isSaving && <p className="text-xs text-gray-400">Saving...</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full text-3xl md:text-4xl font-bold border-none outline-none focus:ring-0 p-0 mb-6"
            placeholder="Untitled"
            maxLength={200}
          />

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full min-h-[400px] text-base text-gray-700 border-none outline-none focus:ring-0 p-0 resize-none font-mono"
            placeholder="Start writing... (Markdown supported)"
          />
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Last updated: {new Date(page.updated_at).toLocaleString()}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}
