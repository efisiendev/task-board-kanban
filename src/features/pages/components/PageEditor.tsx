import { useState } from 'react'
import { TaskPage } from '../../../types'
import { useUpdateTaskPage, useDeleteTaskPage } from '../../tasks/hooks/useTaskPages'
import { RichTextEditor } from '../../../components/RichTextEditor'
import { FileText, Edit3, Type, Trash2 } from 'lucide-react'

interface PageEditorProps {
  page: TaskPage
  taskId: string
  onClose: () => void
}

export function PageEditor({ page, taskId, onClose }: PageEditorProps) {
  const [content, setContent] = useState(page.content || '')
  const [title, setTitle] = useState(page.title)
  const [editorMode, setEditorMode] = useState<'rich' | 'markdown'>('rich')
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  const updatePage = useUpdateTaskPage()
  const deletePage = useDeleteTaskPage()

  const handleSave = () => {
    updatePage.mutate(
      {
        id: page.id,
        taskId,
        title: title.trim(),
        content,
      },
      {
        onSuccess: () => onClose(),
      }
    )
  }

  const handleDelete = () => {
    if (confirm('Delete this page?')) {
      deletePage.mutate(
        { id: page.id, taskId },
        {
          onSuccess: () => onClose(),
        }
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 flex-1">
            <FileText className="w-6 h-6 text-gray-600" />
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false)
                  if (e.key === 'Escape') {
                    setTitle(page.title)
                    setIsEditingTitle(false)
                  }
                }}
                onBlur={() => setIsEditingTitle(false)}
                autoFocus
                className="flex-1 text-xl font-bold border-none outline-none focus:ring-0 px-2 py-1 border-b-2 border-blue-500"
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-bold cursor-pointer hover:text-blue-600"
              >
                {title}
              </h2>
            )}
          </div>

          {/* Editor Mode Toggle */}
          <div className="flex items-center gap-2 mr-4">
            <div className="flex items-center gap-1 bg-gray-100 rounded p-0.5">
              <button
                onClick={() => setEditorMode('rich')}
                className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                  editorMode === 'rich'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Rich
              </button>
              <button
                onClick={() => setEditorMode('markdown')}
                className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 ${
                  editorMode === 'markdown'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Type className="w-3.5 h-3.5" /> MD
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {editorMode === 'markdown' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[400px] p-4 text-base text-gray-700 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
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

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete page
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || updatePage.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {updatePage.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
