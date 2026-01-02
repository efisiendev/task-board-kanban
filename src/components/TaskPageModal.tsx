import { useState, useEffect } from 'react'
import { TaskPage } from '../types'
import { useUpdateTaskPage } from '../hooks/useTaskPages'
import { RichTextEditor } from './RichTextEditor'

interface TaskPageModalProps {
  page: TaskPage
  taskId: string
  onClose: () => void
}

export function TaskPageModal({ page, taskId, onClose }: TaskPageModalProps) {
  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState(page.content || '')
  const [editorMode, setEditorMode] = useState<'rich' | 'markdown'>('rich')
  const [isSaving, setIsSaving] = useState(false)

  const updatePage = useUpdateTaskPage()

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title !== page.title || content !== page.content) {
        setIsSaving(true)
        updatePage.mutate(
          {
            id: page.id,
            taskId,
            title: title.trim() || 'Untitled',
            content,
          },
          {
            onSettled: () => {
              setIsSaving(false)
            },
          }
        )
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [title, content]) // eslint-disable-line react-hooks/exhaustive-deps

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
              onChange={(e) => setTitle(e.target.value)}
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
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-4 md:p-6 text-sm md:text-base text-gray-700 border-none outline-none focus:ring-0 resize-none font-mono"
              placeholder="Start writing... (Markdown supported: **bold**, *italic*, # heading, etc.)"
            />
          ) : (
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing..."
              editable={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}
