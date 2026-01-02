import { useState, useEffect } from 'react'
import { TaskPage } from '../types'
import { useUpdateTaskPage } from '../hooks/useTaskPages'
import { RichTextEditor } from './RichTextEditor'
import { useAutoSave } from '../hooks/useAutoSave'

interface TaskPageModalProps {
  page: TaskPage
  taskId: string
  onClose: () => void
}

export function TaskPageModal({ page, taskId, onClose }: TaskPageModalProps) {
  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState(page.content || '')
  const [editorMode, setEditorMode] = useState<'rich' | 'markdown'>('rich')

  const updatePage = useUpdateTaskPage()

  // Auto-save handler with conflict protection
  const handleAutoSave = async (data: { title: string; content: string }) => {
    if (!data.title.trim()) return

    try {
      await updatePage.mutateAsync({
        id: page.id,
        taskId,
        title: data.title.trim() || 'Untitled',
        content: data.content,
      })
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }

  // Use shared auto-save hook with Realtime protection
  const { isSaving, debouncedAutoSave, lastEditTimeRef } = useAutoSave({
    onSave: handleAutoSave,
    delay: 500,
  })

  // Sync with Realtime updates (protect against overwriting user edits)
  useEffect(() => {
    if (page) {
      const timeSinceLastEdit = Date.now() - lastEditTimeRef.current
      // Only sync if user hasn't edited recently (2 seconds)
      if (timeSinceLastEdit > 2000) {
        setTitle(page.title)
        setContent(page.content || '')
      }
    }
  }, [page, lastEditTimeRef])

  // Auto-save on title or content change
  useEffect(() => {
    const timeSinceLastEdit = Date.now() - lastEditTimeRef.current
    // Only trigger autosave if user just edited (within 2 seconds)
    // This prevents autosave on initial load or Realtime sync
    if (timeSinceLastEdit < 2000) {
      debouncedAutoSave({ title, content })
    }
  }, [title, content, debouncedAutoSave, lastEditTimeRef])

  // Update lastEditTime when user edits
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    lastEditTimeRef.current = Date.now()
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    lastEditTimeRef.current = Date.now()
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 md:inset-4 bg-white shadow-2xl flex flex-col md:rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="flex-1 text-lg md:text-xl font-bold border-none outline-none focus:ring-0 p-0 min-w-0"
              placeholder="Untitled"
            />
            {isSaving && (
              <span className="text-xs text-gray-400 flex-shrink-0">Saving...</span>
            )}
          </div>

          {/* Editor Mode Toggle */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 bg-gray-100 rounded p-0.5">
              <button
                onClick={() => setEditorMode('rich')}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  editorMode === 'rich'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="hidden sm:inline">📝 Rich</span>
                <span className="sm:hidden">📝</span>
              </button>
              <button
                onClick={() => setEditorMode('markdown')}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  editorMode === 'markdown'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="hidden sm:inline">🔤 MD</span>
                <span className="sm:hidden">🔤</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition p-1"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {editorMode === 'markdown' ? (
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full p-4 md:p-6 text-sm md:text-base text-gray-700 border-none outline-none focus:ring-0 resize-none font-mono"
              placeholder="Start writing... (Markdown supported: **bold**, *italic*, # heading, etc.)"
            />
          ) : (
            <RichTextEditor
              content={content}
              onChange={handleContentChange}
              placeholder="Start writing..."
              editable={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}
