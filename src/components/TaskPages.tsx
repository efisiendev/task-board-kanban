import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TaskPage } from '../types'
import {
  useTaskPages,
  useCreateTaskPage,
  useUpdateTaskPage,
  useDeleteTaskPage,
} from '../hooks/useTaskPages'

interface TaskPagesProps {
  taskId: string
}

export function TaskPages({ taskId }: TaskPagesProps) {
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [viewingPageId, setViewingPageId] = useState<string | null>(null)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [editingContent, setEditingContent] = useState<Record<string, string>>({})

  const { data: pages = [], isLoading } = useTaskPages(taskId)
  const createPage = useCreateTaskPage()
  const updatePage = useUpdateTaskPage()
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
          setEditingPageId(data.id)
          setEditingContent({ [data.id]: '' })
        },
      }
    )
  }

  const handleSavePage = (page: TaskPage) => {
    const content = editingContent[page.id] || page.content || ''

    updatePage.mutate({
      id: page.id,
      taskId,
      content,
    })

    setEditingPageId(null)
  }

  const handleDeletePage = (id: string) => {
    if (confirm('Are you sure you want to delete this page?')) {
      deletePage.mutate({ id, taskId })
    }
  }

  const handleEditClick = (page: TaskPage) => {
    setEditingPageId(page.id)
    setEditingContent({ [page.id]: page.content || '' })
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading pages...</div>
  }

  return (
    <div className="space-y-4">
      {/* Existing Pages */}
      {pages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">No pages yet. Create your first page!</p>
        </div>
      )}

      {pages.map((page) => {
        const isEditing = editingPageId === page.id
        const isViewing = viewingPageId === page.id

        return (
          <div key={page.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Page Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📄</span>
                <h3 className="font-semibold text-gray-900">{page.title}</h3>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleSavePage(page)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingPageId(null)
                        setViewingPageId(page.id)
                      }}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {/* View/Edit Toggle */}
                    {isViewing && (
                      <button
                        onClick={() => {
                          setViewingPageId(null)
                          handleEditClick(page)
                        }}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        ✏️ Edit
                      </button>
                    )}
                    {!isViewing && (
                      <button
                        onClick={() => setViewingPageId(page.id)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        👁️ View
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePage(page.id)}
                      className="p-1.5 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Page Content */}
            <div className="p-4">
              {isEditing ? (
                <textarea
                  value={editingContent[page.id] || page.content || ''}
                  onChange={(e) => setEditingContent({ ...editingContent, [page.id]: e.target.value })}
                  placeholder="Start writing... (Markdown supported)"
                  className="w-full min-h-[300px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-y"
                />
              ) : isViewing ? (
                <div className="prose prose-sm prose-slate max-w-none">
                  {page.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {page.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-gray-400 text-center py-8">
                      <p className="text-sm">No content yet.</p>
                      <button
                        onClick={() => {
                          setViewingPageId(null)
                          handleEditClick(page)
                        }}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Click to start editing
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 py-2">
                  Click <span className="font-semibold text-blue-600 cursor-pointer" onClick={() => setViewingPageId(page.id)}>View</span> to read content or <span className="font-semibold text-blue-600 cursor-pointer" onClick={() => handleEditClick(page)}>Edit</span> to make changes.
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Add New Page */}
      <div className="border border-dashed border-gray-300 rounded-lg p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreatePage()
            }}
            placeholder="New page title..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreatePage}
            disabled={!newPageTitle.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Page
          </button>
        </div>
      </div>
    </div>
  )
}
