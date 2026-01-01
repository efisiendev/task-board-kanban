import { useState } from 'react'
import { TaskPage } from '../types'
import {
  useTaskPages,
  useCreateTaskPage,
  useUpdateTaskPage,
  useDeleteTaskPage,
} from '../hooks/useTaskPages'
import { RichTextEditor } from './RichTextEditor'
import { MarkdownEditor } from './MarkdownEditor'

interface TaskPagesProps {
  taskId: string
}

export function TaskPages({ taskId }: TaskPagesProps) {
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [viewingPageId, setViewingPageId] = useState<string | null>(null)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [editingContent, setEditingContent] = useState<Record<string, string>>({})
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [editorMode, setEditorMode] = useState<'rich' | 'markdown'>('rich')

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

  const handleRenameStart = (page: TaskPage) => {
    setRenamingPageId(page.id)
    setRenameValue(page.title)
  }

  const handleRenameSubmit = (pageId: string) => {
    if (renameValue.trim()) {
      updatePage.mutate({
        id: pageId,
        taskId,
        title: renameValue.trim(),
      })
    }
    setRenamingPageId(null)
    setRenameValue('')
  }

  const handleRenameCancel = () => {
    setRenamingPageId(null)
    setRenameValue('')
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
        const isRenaming = renamingPageId === page.id

        return (
          <div key={page.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Page Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-lg">📄</span>
                {isRenaming ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(page.id)
                      if (e.key === 'Escape') handleRenameCancel()
                    }}
                    onBlur={() => handleRenameSubmit(page.id)}
                    autoFocus
                    className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
                  />
                ) : (
                  <h3
                    className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                    onDoubleClick={() => handleRenameStart(page)}
                  >
                    {page.title}
                  </h3>
                )}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    {/* Editor Mode Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded p-0.5 mr-2">
                      <button
                        onClick={() => setEditorMode('rich')}
                        className={`px-2 py-1 rounded text-xs font-medium transition ${
                          editorMode === 'rich'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        📝 Rich
                      </button>
                      <button
                        onClick={() => setEditorMode('markdown')}
                        className={`px-2 py-1 rounded text-xs font-medium transition ${
                          editorMode === 'markdown'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        🔤 MD
                      </button>
                    </div>

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
                    {/* Rename Button */}
                    <button
                      onClick={() => handleRenameStart(page)}
                      className="p-1.5 text-gray-600 hover:bg-blue-100 hover:text-blue-600 rounded"
                      title="Rename"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

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
            <div className="min-h-[200px]">
              {isEditing ? (
                editorMode === 'markdown' ? (
                  /* Markdown Mode - Textarea */
                  <textarea
                    value={editingContent[page.id] || page.content || ''}
                    onChange={(e) => setEditingContent({ ...editingContent, [page.id]: e.target.value })}
                    className="w-full min-h-[300px] p-4 text-base text-gray-700 border-none outline-none focus:ring-0 resize-none font-mono"
                    placeholder="Start writing... (Markdown supported: **bold**, *italic*, # heading, etc.)"
                  />
                ) : (
                  /* Rich Text Mode - WYSIWYG Editor */
                  <RichTextEditor
                    content={editingContent[page.id] || page.content || ''}
                    onChange={(newContent) => setEditingContent({ ...editingContent, [page.id]: newContent })}
                    placeholder="Start writing..."
                    editable={true}
                  />
                )
              ) : isViewing ? (
                /* View Mode - Always render as Rich Text */
                <RichTextEditor
                  content={page.content || ''}
                  onChange={() => {}}
                  placeholder=""
                  editable={false}
                />
              ) : (
                <div className="text-sm text-gray-500 py-8 px-4 text-center">
                  <p>Double-click title to rename, or click <span className="font-semibold text-blue-600 cursor-pointer" onClick={() => setViewingPageId(page.id)}>View</span> to read content.</p>
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
