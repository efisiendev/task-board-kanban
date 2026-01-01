import { useState, useEffect, useRef } from 'react'
import { BoardPage } from '../types'
import { useUpdateBoardPage } from '../hooks/useBoardPages'
import { RichTextEditor } from './RichTextEditor'
import { MarkdownEditor } from './MarkdownEditor'

interface PageModalProps {
  page: BoardPage
  pages: BoardPage[] // For breadcrumb
  onClose: () => void
}

export function PageModal({ page, pages, onClose }: PageModalProps) {
  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState(page.content || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editorMode, setEditorMode] = useState<'rich' | 'markdown'>('rich')
  const updateMutation = useUpdateBoardPage()
  const lastEditTimeRef = useRef(Date.now())
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Build breadcrumb path
  const buildBreadcrumb = () => {
    const path: BoardPage[] = []
    let currentPage: BoardPage | undefined = page

    while (currentPage) {
      path.unshift(currentPage)
      currentPage = pages.find(p => p.id === currentPage!.parent_id)
    }

    return path
  }

  const breadcrumb = buildBreadcrumb()

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
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Page' : 'View Page'}
                </h2>
                {isSaving && <p className="text-xs text-gray-400">Saving...</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Editor Mode Toggle (only in edit mode) */}
              {isEditing && (
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setEditorMode('rich')}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      editorMode === 'rich'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📝 Rich Text
                  </button>
                  <button
                    onClick={() => setEditorMode('markdown')}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      editorMode === 'markdown'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🔤 Markdown
                  </button>
                </div>
              )}

              {/* View/Edit Toggle */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isEditing
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isEditing ? '👁️ View' : '✏️ Edit'}
              </button>
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
          </div>

          {/* Breadcrumb */}
          {breadcrumb.length > 1 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {breadcrumb.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}
                  <span className={index === breadcrumb.length - 1 ? 'text-gray-900 font-medium' : ''}>
                    {item.type === 'folder' ? '📁' : '📄'} {item.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Title */}
          <div className="px-8 py-6 border-b border-gray-100">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full text-3xl md:text-4xl font-bold border-none outline-none focus:ring-0 p-0"
                placeholder="Untitled"
                maxLength={200}
              />
            ) : (
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {title || 'Untitled'}
              </h1>
            )}
          </div>

          {/* Content Editor */}
          <div className="min-h-[400px]">
            {isEditing ? (
              editorMode === 'markdown' ? (
                /* Markdown Mode - Split View with Live Preview */
                <MarkdownEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder="Start writing markdown... (Supports: **bold**, *italic*, # heading, - lists, [links](url))"
                />
              ) : (
                /* Rich Text Mode - WYSIWYG Editor with Markdown Paste Support */
                <RichTextEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder="Start writing... (Tip: Paste markdown for auto-formatting!)"
                  editable={true}
                />
              )
            ) : (
              /* View Mode - Always render as Rich Text */
              content ? (
                <RichTextEditor
                  content={content}
                  onChange={() => {}}
                  placeholder=""
                  editable={false}
                />
              ) : (
                <div className="text-gray-400 text-center py-12">
                  <p>No content yet.</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-2 text-blue-600 hover:text-blue-700"
                  >
                    Click to start editing
                  </button>
                </div>
              )
            )}
          </div>
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
