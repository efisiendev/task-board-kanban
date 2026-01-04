import { useState, useMemo } from 'react'
import { BoardPage } from '../../../types'
import { RichTextEditor } from '../../../components/RichTextEditor'
import { PageEditorModal } from './PageEditorModal'
import { useBoardPages } from '../hooks/useBoardPages'
import { FileText, Folder, Edit } from 'lucide-react'

interface PageModalProps {
  pageId: string
  boardId: string
  onClose: () => void
}

export function PageModal({ pageId, boardId, onClose }: PageModalProps) {
  const [showEditor, setShowEditor] = useState(false)

  // Query pages with Realtime subscription
  const { data: pages = [] } = useBoardPages(boardId)

  // Find current page (will update when Realtime triggers)
  const page = useMemo(() => pages.find(p => p.id === pageId), [pages, pageId])

  if (!page) {
    return null
  }

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
      <div className="fixed top-0 right-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-[51] flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">View Page</h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Edit Button - Opens Fullscreen Editor */}
              <button
                onClick={() => setShowEditor(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" /> Edit
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
                  <span className={`flex items-center gap-1 ${index === breadcrumb.length - 1 ? 'text-gray-900 font-medium' : ''}`}>
                    {item.type === 'folder' ? <Folder className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />} {item.title}
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {page.title || 'Untitled'}
            </h1>
          </div>

          {/* Content - Read Only */}
          <div className="min-h-[400px]">
            {page.content ? (
              <RichTextEditor
                content={page.content}
                onChange={() => {}}
                placeholder=""
                editable={false}
              />
            ) : (
              <div className="text-gray-400 text-center py-12">
                <p>No content yet.</p>
                <button
                  onClick={() => setShowEditor(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Click to start editing
                </button>
              </div>
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

      {/* Fullscreen Editor Modal */}
      {showEditor && (
        <PageEditorModal
          page={page}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  )
}
