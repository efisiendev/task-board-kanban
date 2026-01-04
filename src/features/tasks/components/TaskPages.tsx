import { useState } from 'react'
import { TaskPage } from '../../../types'
import {
  useTaskPages,
  useCreateTaskPage,
  useDeleteTaskPage,
} from '../hooks/useTaskPages'
import { TaskPageModal } from './TaskPageModal'
import { FileText, Trash2 } from 'lucide-react'

interface TaskPagesProps {
  taskId: string
}

export function TaskPages({ taskId }: TaskPagesProps) {
  const [selectedPage, setSelectedPage] = useState<TaskPage | null>(null)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [showMenuId, setShowMenuId] = useState<string | null>(null)

  const { data: pages = [], isLoading } = useTaskPages(taskId)
  const createPage = useCreateTaskPage()
  const deletePage = useDeleteTaskPage()

  const handleCreatePage = () => {
    if (!newPageTitle.trim()) return

    const maxOrder = pages.length > 0 ? Math.max(...pages.map((p) => p.order_index)) : 0

    createPage.mutate(
      {
        taskId,
        title: newPageTitle.trim(),
        content: '',
        orderIndex: maxOrder + 1,
      },
      {
        onSuccess: (data) => {
          setNewPageTitle('')
          setSelectedPage(data) // Open modal immediately
        },
      }
    )
  }

  const handleDeletePage = (page: TaskPage) => {
    if (confirm('Are you sure you want to delete this page?')) {
      deletePage.mutate({ id: page.id, taskId })
      setShowMenuId(null)
    }
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading pages...</div>
  }

  return (
    <>
      <div className="space-y-2">
        {/* Existing Pages */}
        {pages.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No pages yet. Create your first page below!</p>
          </div>
        )}

        {pages.map((page) => (
          <div key={page.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition group">
            <div className="px-4 py-3 flex items-center justify-between">
              <div
                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                onClick={() => setSelectedPage(page)}
              >
                <FileText className="w-4 h-4 flex-shrink-0 text-gray-600" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {page.title}
                  </h3>
                  {page.content && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {page.content.replace(/<[^>]*>/g, '').slice(0, 80)}...
                    </p>
                  )}
                </div>
              </div>

              {/* Three-dot Menu */}
              <div className="page-menu relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowMenuId(showMenuId === page.id ? null : page.id)}
                  className="p-1 hover:bg-gray-200 rounded transition opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                    <circle cx="8" cy="3" r="1.5"/>
                    <circle cx="8" cy="8" r="1.5"/>
                    <circle cx="8" cy="13" r="1.5"/>
                  </svg>
                </button>

                {showMenuId === page.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenuId(null)}
                    />
                    <div className="absolute right-0 top-6 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => handleDeletePage(page)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Add New Page */}
        <div className="border border-dashed border-gray-300 rounded-lg p-3 hover:border-gray-400 transition">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreatePage()
              }}
              placeholder="New page title..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
            />
            <button
              onClick={handleCreatePage}
              disabled={!newPageTitle.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 flex-shrink-0"
              title="Add Page"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline text-sm">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page Modal - Fullscreen Editor */}
      {selectedPage && (
        <TaskPageModal
          page={selectedPage}
          taskId={taskId}
          onClose={() => setSelectedPage(null)}
        />
      )}
    </>
  )
}
