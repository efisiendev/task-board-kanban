import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTasks, useUpdateTask } from '../hooks/useTasks'
import { useAuth } from '../hooks/useAuth'
import { useBoards } from '../hooks/useBoards'
import { useBoardMembers } from '../hooks/useBoardMembers'
import { useBoardStatuses } from '../hooks/useBoardStatuses'
import { useBatchUserProfiles } from '../hooks/useBatchUserProfiles'
import { useTaskFiltering } from '../hooks/useTaskFiltering'
import { useTaskOperations } from '../hooks/useTaskOperations'
import KanbanBoard from '../components/KanbanBoard'
import { TableView } from '../components/TableView'
import { ListView } from '../components/ListView'
import { CalendarView } from '../components/CalendarView'
import { FolderTree } from '../components/FolderTree'
import { PageModal } from '../components/PageModal'
import { FilePreviewModal } from '../components/FilePreviewModal'
import TaskModal from '../components/TaskModal'
import BoardMembers from '../components/BoardMembers'
import { FilterSidebar, TaskFilters } from '../components/FilterSidebar'
import { ViewSwitcher } from '../components/ViewSwitcher'
import { HeaderActionButtons } from '../components/HeaderActionButtons'
import { NewTaskDropdown } from '../components/NewTaskDropdown'
import { SettingsOverlay } from '../components/SettingsOverlay'
import { MainLayout } from '../components/MainLayout'
import { Task, BoardPage } from '../types'
import { useBoardPages, useCreateBoardPage, useUpdateBoardPage, useDeleteBoardPage } from '../hooks/useBoardPages'
import { useToggle } from '../hooks/useToggle'
import { SidePanel } from '../components/ui/SidePanel'

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
  const { user } = useAuth()
  const { data: boards = [] } = useBoards()
  const { data: tasks = [], isLoading } = useTasks(boardId!)
  useBoardMembers(boardId!) // Keep data in cache
  const { data: statuses = [] } = useBoardStatuses(boardId!)
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
  const showMembers = useToggle()
  const showFilters = useToggle()
  const showStatuses = useToggle()
  const showNewMenu = useToggle()
  const showPages = useToggle()
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

  // Use extracted filtering hook
  const filteredTasks = useTaskFiltering(tasks, searchQuery, filters)

  // Use extracted task operations hook
  const {
    handleCreateTask,
    handleAddTaskFromColumn,
    handleDeleteTaskFromCard,
    handleQuickEditTask,
    handleUpdateTask,
    handleDeleteTask,
  } = useTaskOperations({
    boardId: boardId!,
    editingTask,
    setEditingTask,
    setIsModalOpen,
    initialStatusId,
    setInitialStatusId,
  })

  // For drag-and-drop task moves (used in KanbanBoard)
  const updateTaskMutation = useUpdateTask()

  return (
    <MainLayout currentBoardId={boardId}>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">

          <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-stretch md:items-center">
            {/* View Switcher */}
            <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />

            {/* Search - full width on mobile */}
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 w-full md:w-auto px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
            />
            
            {/* Action buttons */}
            <HeaderActionButtons
              showFilters={showFilters}
              showMembers={showMembers}
              showPages={showPages}
            />

            {/* New Dropdown Menu */}
            <div className="relative">
              <button
                onClick={showNewMenu.toggle}
                className="px-4 md:px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition flex items-center gap-1 md:gap-2 text-sm md:text-base"
              >
                <span className="md:hidden">+</span>
                <span className="hidden md:inline">New</span>
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <NewTaskDropdown
                isOpen={showNewMenu.isOpen}
                isOwner={isOwner}
                onClose={showNewMenu.close}
                onNewTask={() => {
                  setEditingTask(null)
                  setInitialStatusId(null)
                  setIsModalOpen(true)
                  showNewMenu.close()
                }}
                onSettings={() => {
                  showStatuses.open()
                  showNewMenu.close()
                }}
              />
            </div>
          </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="w-full py-6 md:py-12">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <SidePanel
            isOpen={showFilters.isOpen}
            onClose={showFilters.close}
            side="left"
            width="w-80 md:w-auto md:pl-4"
          >
            <FilterSidebar
              filters={filters}
              statuses={statuses}
              onChange={setFilters}
              onClear={() => setFilters(DEFAULT_FILTERS)}
            />
          </SidePanel>

          {/* Pages Sidebar */}
          <SidePanel
            isOpen={showPages.isOpen}
            onClose={showPages.close}
            side="left"
            width="w-80 md:w-96 md:pl-4"
          >
                <div className="h-[calc(100vh-8rem)] md:h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <FolderTree
                    pages={pages}
                    selectedPageId={selectedPage?.id || null}
                    onSelectPage={(page) => {
                      if (page?.type === 'page') {
                        setSelectedPage(page)
                        showPages.close()
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
                      showPages.close()
                    }}
                  />
                </div>
          </SidePanel>

          {/* Board Views */}
          <div className="flex-1 min-w-0 px-2 md:px-0">
            {isLoading ? (
              <div className="text-center text-gray-600 px-4">Loading tasks...</div>
            ) : currentView === 'kanban' ? (
              <div className={showFilters.isOpen || showMembers.isOpen || showPages.isOpen ? '' : 'px-4'}>
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

          {/* Members Sidebar */}
          <SidePanel
            isOpen={showMembers.isOpen}
            onClose={showMembers.close}
            side="right"
            width="w-80 md:pr-4"
          >
            <BoardMembers boardId={boardId!} isOwner={isOwner} />
          </SidePanel>

        </div>
      </main>

      {/* Settings Sidebar (Full Overlay) */}
      <SettingsOverlay
        isOpen={showStatuses.isOpen}
        boardId={boardId!}
        isOwner={isOwner}
        onClose={showStatuses.close}
      />

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
    </MainLayout>
  )
}
