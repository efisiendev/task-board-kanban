import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { useAuth } from '../hooks/useAuth'
import { useBoards } from '../hooks/useBoards'
import { useBoardMembers } from '../hooks/useBoardMembers'
import { useBoardStatuses } from '../hooks/useBoardStatuses'
import { useBatchUserProfiles } from '../hooks/useBatchUserProfiles'
import KanbanBoard from '../components/KanbanBoard'
import { TableView } from '../components/TableView'
import { ListView } from '../components/ListView'
import { CalendarView } from '../components/CalendarView'
import { FolderTree } from '../components/FolderTree'
import { PageModal } from '../components/PageModal'
import { FilePreviewModal } from '../components/FilePreviewModal'
import TaskModal, { TaskFormData } from '../components/TaskModal'
import BoardMembers from '../components/BoardMembers'
import BoardStatusManager from '../components/BoardStatusManager'
import { FilterSidebar, TaskFilters } from '../components/FilterSidebar'
import { Sidebar } from '../components/Sidebar'
import { Task, BoardPage } from '../types'
import { useBoardPages, useCreateBoardPage, useUpdateBoardPage, useDeleteBoardPage } from '../hooks/useBoardPages'

type ViewType = 'kanban' | 'table' | 'list' | 'calendar'

const DEFAULT_FILTERS: TaskFilters = {
  status: [],
  priority: [],
  assignee: [],
  hasLabels: null,
  isOverdue: null,
}

export default function Board() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { data: boards = [] } = useBoards()
  const { data: tasks = [], isLoading } = useTasks(boardId!)
  useBoardMembers(boardId!) // Keep data in cache
  const { data: statuses = [] } = useBoardStatuses(boardId!)
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()
  const { data: pages = [] } = useBoardPages(boardId!)
  const createPageMutation = useCreateBoardPage()
  const updatePageMutation = useUpdateBoardPage()
  const deletePageMutation = useDeleteBoardPage()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedPage, setSelectedPage] = useState<BoardPage | null>(null)
  const [selectedFile, setSelectedFile] = useState<BoardPage | null>(null)
  const [initialStatusId, setInitialStatusId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showStatuses, setShowStatuses] = useState(false)
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showPages, setShowPages] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('kanban')
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)

  // Batch fetch all user profiles for tasks (prevents N+1 queries)
  const assigneeIds = useMemo(() => tasks.map(t => t.assigned_to), [tasks])
  const { data: userProfiles = [] } = useBatchUserProfiles(assigneeIds)

  // Check if current user is board owner
  const currentBoard = boards.find((b) => b.id === boardId)
  const isOwner = currentBoard?.user_id === user?.id

  // Sync editingTask with updated tasks array (for Realtime updates)
  useEffect(() => {
    if (editingTask && tasks.length > 0) {
      const updatedTask = tasks.find((t) => t.id === editingTask.id)
      if (updatedTask) {
        setEditingTask(updatedTask)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks])

  // Apply search and filters (memoized for performance)
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

      // Status filter (using status_id)
      const matchesStatus = filters.status.length === 0 || filters.status.includes(task.status_id)

      // Priority filter
      const matchesPriority = filters.priority.length === 0 || (task.priority && filters.priority.includes(task.priority))

      // Assignee filter
      const matchesAssignee =
        filters.assignee.length === 0 ||
        (filters.assignee.includes('unassigned') && !task.assigned_to) ||
        (task.assigned_to && filters.assignee.includes(task.assigned_to))

      // Has labels filter
      const matchesHasLabels =
        filters.hasLabels === null ||
        (filters.hasLabels === true && task.labels && task.labels.length > 0)

      // Overdue filter
      const matchesOverdue =
        filters.isOverdue === null ||
        (filters.isOverdue === true && task.due_date && new Date(task.due_date) < new Date() && task.board_status?.name !== 'Done')

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesHasLabels && matchesOverdue
    })
  }, [tasks, searchQuery, filters])

  const handleCreateTask = async (data: TaskFormData) => {
    try {
      await createTaskMutation.mutateAsync({
        boardId: boardId!,
        status_id: initialStatusId || undefined,
        ...data,
      })
      setIsModalOpen(false)
      setInitialStatusId(null)
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleAddTaskFromColumn = (statusId: string) => {
    setInitialStatusId(statusId)
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const handleDeleteTaskFromCard = async (taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync({ id: taskId, boardId: boardId! })
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleQuickEditTask = async (taskId: string, newTitle: string) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        boardId: boardId!,
        title: newTitle,
      })
    } catch (error) {
      console.error('Failed to update task title:', error)
    }
  }

  const handleUpdateTask = async (data: TaskFormData) => {
    if (!editingTask) return
    try {
      await updateTaskMutation.mutateAsync({
        id: editingTask.id,
        boardId: boardId!,
        ...data,
      })
      setEditingTask(null)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDeleteTask = async () => {
    if (!editingTask || !confirm('Delete this task?')) return
    try {
      await deleteTaskMutation.mutateAsync({ id: editingTask.id, boardId: boardId! })
      setEditingTask(null)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        currentBoardId={boardId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-4">
                {/* Hamburger Menu Button - Visible on all screens */}
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  aria-label="Toggle sidebar"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-xl md:text-3xl font-bold text-gray-900 hover:text-blue-600 transition"
                >
                  TaskFlow
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition text-sm md:text-base"
              >
                Logout
              </button>
            </div>

          <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-stretch md:items-center">
            {/* View Switcher - Responsive */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
              <button
                onClick={() => setCurrentView('kanban')}
                className={`px-2 md:px-3 py-1.5 rounded text-xs md:text-sm font-medium transition whitespace-nowrap ${
                  currentView === 'kanban'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="hidden sm:inline">📊 Kanban</span>
                <span className="sm:hidden">📊</span>
              </button>
              <button
                onClick={() => setCurrentView('table')}
                className={`px-2 md:px-3 py-1.5 rounded text-xs md:text-sm font-medium transition whitespace-nowrap ${
                  currentView === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="hidden sm:inline">📋 Table</span>
                <span className="sm:hidden">📋</span>
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`px-2 md:px-3 py-1.5 rounded text-xs md:text-sm font-medium transition whitespace-nowrap ${
                  currentView === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="hidden sm:inline">📝 List</span>
                <span className="sm:hidden">📝</span>
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-2 md:px-3 py-1.5 rounded text-xs md:text-sm font-medium transition whitespace-nowrap ${
                  currentView === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="hidden sm:inline">📅 Calendar</span>
                <span className="sm:hidden">📅</span>
              </button>
            </div>

            {/* Search - full width on mobile */}
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 w-full md:w-auto px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
            />
            
            {/* Action buttons - compact on mobile */}
            <div className="flex gap-2 md:gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 md:px-4 py-2 rounded-lg font-medium transition text-sm md:text-base ${
                  showFilters
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                <span className="md:hidden">🔍</span>
                <span className="hidden md:inline">🔍 Filter</span>
              </button>
              <button
                onClick={() => setShowMembers(!showMembers)}
                className={`px-3 md:px-4 py-2 rounded-lg font-medium transition text-sm md:text-base ${
                  showMembers
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                <span className="md:hidden">👥</span>
                <span className="hidden md:inline">👥 Members</span>
              </button>
              <button
                onClick={() => setShowPages(!showPages)}
                className={`px-3 md:px-4 py-2 rounded-lg font-medium transition text-sm md:text-base ${
                  showPages
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                <span className="md:hidden">📄</span>
                <span className="hidden md:inline">📄 Pages</span>
              </button>
              {/* New Dropdown Menu */}
              <div className="relative">
              <button
                onClick={() => setShowNewMenu(!showNewMenu)}
                className="px-4 md:px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition flex items-center gap-1 md:gap-2 text-sm md:text-base"
              >
                <span className="md:hidden">+</span>
                <span className="hidden md:inline">New</span>
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showNewMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowNewMenu(false)}
                  />
                  <div className="fixed md:absolute right-4 md:right-0 top-auto md:top-auto mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => {
                        setEditingTask(null)
                        setInitialStatusId(null)
                        setIsModalOpen(true)
                        setShowNewMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                    >
                      <span className="text-lg">📝</span>
                      New Task
                    </button>
                    {isOwner && (
                      <>
                        <div className="border-t border-gray-200 my-1" />
                        <button
                          onClick={() => {
                            setShowStatuses(true)
                            setShowNewMenu(false)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                        >
                          <span className="text-lg">⚙️</span>
                          Board Settings
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full py-6 md:py-12">
        <div className="flex gap-6">
          {/* Filter Sidebar - Fixed overlay on mobile, sidebar on desktop */}
          {showFilters && (
            <>
              {/* Mobile backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-20 z-40 md:hidden"
                onClick={() => setShowFilters(false)}
              />
              {/* Sidebar */}
              <div className="fixed md:static inset-y-0 left-0 z-50 md:z-auto w-80 md:w-auto md:pl-4 bg-white md:bg-transparent shadow-2xl md:shadow-none">
                <div className="h-full overflow-y-auto p-4 md:p-0">
                  {/* Close button - mobile only */}
                  <button
                    onClick={() => setShowFilters(false)}
                    className="md:hidden mb-4 text-gray-400 hover:text-gray-600"
                  >
                    ✕ Close
                  </button>
                  <FilterSidebar
                    filters={filters}
                    statuses={statuses}
                    onChange={setFilters}
                    onClear={() => setFilters(DEFAULT_FILTERS)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Pages Sidebar - Fixed overlay on mobile, sidebar on desktop */}
          {showPages && (
            <>
              {/* Mobile backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-20 z-40 md:hidden"
                onClick={() => setShowPages(false)}
              />
              {/* Sidebar */}
              <div className="fixed md:static inset-y-0 left-0 z-50 md:z-auto w-80 md:w-96 md:pl-4 bg-white md:bg-transparent shadow-2xl md:shadow-none">
                <div className="h-full overflow-hidden p-4 md:p-0">
                  {/* Close button - mobile only */}
                  <button
                    onClick={() => setShowPages(false)}
                    className="md:hidden mb-4 text-gray-400 hover:text-gray-600"
                  >
                    ✕ Close
                  </button>
                  <div className="h-[calc(100%-2rem)] md:h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <FolderTree
                      pages={pages}
                      selectedPageId={selectedPage?.id || null}
                      onSelectPage={(page) => {
                        if (page?.type === 'page') {
                          setSelectedPage(page)
                          setShowPages(false) // Close sidebar on mobile
                        }
                      }}
                      onCreatePage={async (parentId) => {
                        try {
                          await createPageMutation.mutateAsync({
                            board_id: boardId!,
                            parent_id: parentId,
                            title: 'Untitled',
                            type: 'page',
                            content: '',
                          })
                        } catch (error) {
                          console.error('Failed to create page:', error)
                        }
                      }}
                      onCreateFolder={async (parentId, folderName) => {
                        try {
                          await createPageMutation.mutateAsync({
                            board_id: boardId!,
                            parent_id: parentId,
                            title: folderName,
                            type: 'folder',
                          })
                        } catch (error) {
                          console.error('Failed to create folder:', error)
                        }
                      }}
                      onCreateFile={async (parentId, fileName, driveUrl, mimeType) => {
                        try {
                          await createPageMutation.mutateAsync({
                            board_id: boardId!,
                            parent_id: parentId,
                            title: fileName,
                            type: 'file',
                            storage_path: driveUrl,
                            mime_type: mimeType,
                          })
                        } catch (error) {
                          console.error('Failed to create file:', error)
                        }
                      }}
                      onDeletePage={async (page) => {
                        try {
                          await deletePageMutation.mutateAsync({
                            id: page.id,
                            board_id: boardId!,
                          })
                        } catch (error) {
                          console.error('Failed to delete page:', error)
                        }
                      }}
                      onRenamePage={async (pageId, newTitle) => {
                        try {
                          await updatePageMutation.mutateAsync({
                            id: pageId,
                            board_id: boardId!,
                            title: newTitle,
                          })
                        } catch (error) {
                          console.error('Failed to rename page:', error)
                        }
                      }}
                      onFileClick={(file) => {
                        setSelectedFile(file)
                        setShowPages(false) // Close sidebar on mobile
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Board Views */}
          <div className="flex-1 min-w-0 px-2 md:px-0">
            {isLoading ? (
              <div className="text-center text-gray-600 px-4">Loading tasks...</div>
            ) : currentView === 'kanban' ? (
              <div className={showFilters || showMembers || showPages ? '' : 'px-4'}>
                <KanbanBoard
                  tasks={filteredTasks}
                  statuses={statuses}
                  userProfiles={userProfiles}
                  onTaskClick={(task) => {
                    setEditingTask(task)
                    setIsModalOpen(true)
                  }}
                  onTaskMoved={async (taskId, newStatusId, newOrderIndex) => {
                    try {
                      await updateTaskMutation.mutateAsync({
                        id: taskId,
                        boardId: boardId!,
                        status_id: newStatusId,
                        order_index: newOrderIndex,
                      })
                    } catch (error) {
                      console.error('Failed to move task:', error)
                    }
                  }}
                  onAddTask={handleAddTaskFromColumn}
                  onDeleteTask={handleDeleteTaskFromCard}
                  onQuickEditTask={handleQuickEditTask}
                />
              </div>
            ) : currentView === 'calendar' ? (
              <div className="px-4">
                <CalendarView
                  tasks={filteredTasks}
                  onTaskClick={(task) => {
                    setEditingTask(task)
                    setIsModalOpen(true)
                  }}
                />
              </div>
            ) : (
              <div className="px-4">
                {currentView === 'table' ? (
                  <TableView
                    tasks={filteredTasks}
                    userProfiles={userProfiles}
                    onTaskClick={(task) => {
                      setEditingTask(task)
                      setIsModalOpen(true)
                    }}
                  />
                ) : (
                  <ListView
                    tasks={filteredTasks}
                    statuses={statuses}
                    userProfiles={userProfiles}
                    onTaskClick={(task) => {
                      setEditingTask(task)
                      setIsModalOpen(true)
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Members Sidebar - Fixed overlay on mobile, sidebar on desktop */}
          {showMembers && (
            <>
              {/* Mobile backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-20 z-40 md:hidden"
                onClick={() => setShowMembers(false)}
              />
              {/* Sidebar */}
              <div className="fixed md:static inset-y-0 right-0 z-50 md:z-auto w-80 md:pr-4 bg-white md:bg-transparent shadow-2xl md:shadow-none">
                <div className="h-full overflow-y-auto p-4 md:p-0">
                  {/* Close button - mobile only */}
                  <button
                    onClick={() => setShowMembers(false)}
                    className="md:hidden mb-4 text-gray-400 hover:text-gray-600"
                  >
                    ✕ Close
                  </button>
                  <BoardMembers boardId={boardId!} isOwner={isOwner} />
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Settings Sidebar (Overlay) */}
      {showStatuses && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-20 z-40"
            onClick={() => setShowStatuses(false)}
          />
          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Board Settings</h2>
              <button
                onClick={() => setShowStatuses(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <BoardStatusManager boardId={boardId!} isOwner={isOwner} />
            </div>
          </div>
        </>
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          task={editingTask}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingTask(null)
            setInitialStatusId(null)
          }}
          onCreate={handleCreateTask}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Page Modal */}
      {selectedPage && (
        <PageModal
          pageId={selectedPage.id}
          boardId={boardId!}
          onClose={() => setSelectedPage(null)}
        />
      )}

      {/* File Preview Modal */}
      {selectedFile && (
        <FilePreviewModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
      </div>
    </div>
  )
}
