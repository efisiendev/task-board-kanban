import { useParams, useNavigate } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import { BoardPage } from '../types'
import { RichTextEditor } from '../shared/components/form/RichTextEditor'
import { useBoardPages, useUpdateBoardPage } from '../features/pages/hooks/useBoardPages'
import { useAutoSave } from '../shared/hooks/useAutoSave'
import { MainLayout } from '../shared/components/layout/MainLayout'
import { ArrowLeft, FileText, Folder, Edit, Eye } from 'lucide-react'

export default function PageDetailPage() {
  const { pageId, boardId } = useParams<{ pageId: string; boardId: string }>()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState('')
  const updatePageMutation = useUpdateBoardPage()

  // Use useBoardPages hook for Realtime updates
  const { data: pages = [] } = useBoardPages(boardId || '')

  // Find current page from pages array
  const page = useMemo(() => pages.find(p => p.id === pageId), [pages, pageId])

  // Sync content with page data
  useEffect(() => {
    if (page) {
      setContent(page.content || '')
    }
  }, [page])

  // Auto-save hook
  const { isSaving, debouncedAutoSave } = useAutoSave<{
    content: string
  }>({
    onSave: async (data) => {
      if (!page || !boardId) return
      await updatePageMutation.mutateAsync({
        id: page.id,
        board_id: boardId,
        content: data.content,
      })
    },
    delay: 500,
  })

  // Handle content change
  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    debouncedAutoSave({ content: newContent })
  }

  // Build breadcrumb path
  const buildBreadcrumb = () => {
    if (!page) return []
    const path: BoardPage[] = []
    let currentPage: BoardPage | undefined = page

    while (currentPage) {
      path.unshift(currentPage)
      currentPage = pages.find(p => p.id === currentPage!.parent_id)
    }

    return path
  }

  const breadcrumb = buildBreadcrumb()
  const isLoading = !boardId || pages.length === 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-4">The page you're looking for doesn't exist</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (page.type === 'folder') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cannot View Folder</h2>
          <p className="text-gray-600 mb-4">Folders cannot be opened directly</p>
          <button
            onClick={() => navigate(`/board/${boardId}`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Board
          </button>
        </div>
      </div>
    )
  }

  if (!boardId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid URL</h2>
          <p className="text-gray-600 mb-4">Board ID is required</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const handleClose = () => {
    navigate(`/board/${boardId}`)
  }

  return (
    <MainLayout currentBoardId={boardId}>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - Not Sticky */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              {/* Back button */}
              <button
                onClick={handleClose}
                className="inline-flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {/* Edit/View toggle & Save indicator */}
              <div className="flex items-center gap-2">
                {isSaving && (
                  <span className="text-xs text-gray-400">Saving...</span>
                )}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    isEditing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <Eye className="w-4 h-4" /> View
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" /> Edit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

      {/* Page Header - Scrollable */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        {breadcrumb.length > 1 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            {breadcrumb.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                <span className={`flex items-center gap-1 ${index === breadcrumb.length - 1 ? 'text-gray-900 font-medium' : ''}`}>
                  {item.type === 'folder' ? (
                    <Folder className="w-3.5 h-3.5" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Page content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
          <div className="min-h-[500px]">
            {content || isEditing ? (
              <RichTextEditor
                content={content}
                onChange={handleContentChange}
                placeholder={isEditing ? "Start typing..." : ""}
                editable={isEditing}
              />
            ) : (
              <div className="text-gray-400 text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No content yet. Click Edit to start writing.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Last updated: {new Date(page.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      </div>
    </MainLayout>
  )
}
