import { useParams, useNavigate } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import { TaskPage } from '../types'
import { RichTextEditor } from '../shared/components/form/RichTextEditor'
import { useTaskPages, useUpdateTaskPage } from '../features/tasks/hooks/useTaskPages'
import { useAutoSave } from '../shared/hooks/useAutoSave'
import { MainLayout } from '../shared/components/layout/MainLayout'
import { ArrowLeft, Edit, Eye } from 'lucide-react'

export default function TaskPageDetailPage() {
  const { pageId, taskId } = useParams<{ pageId: string; taskId: string }>()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState('')
  const updatePageMutation = useUpdateTaskPage()

  // Fetch task pages
  const { data: pages = [] } = useTaskPages(taskId || '')

  // Find current page
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
      if (!page || !taskId) return
      await updatePageMutation.mutateAsync({
        id: page.id,
        taskId,
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

  const handleClose = () => {
    navigate(`/task/${taskId}`)
  }

  if (!page) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h2>
            <button
              onClick={handleClose}
              className="text-blue-600 hover:text-blue-700"
            >
              Go back to task
            </button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
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
                Back to Task
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
          {/* Page title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{page.title}</h1>
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
