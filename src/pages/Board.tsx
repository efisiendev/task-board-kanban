import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { useAuth } from '../hooks/useAuth'
import { useBoards } from '../hooks/useBoards'
import { useBoardMembers } from '../hooks/useBoardMembers'
import KanbanBoard from '../components/KanbanBoard'
import { TableView } from '../components/TableView'
import { ListView } from '../components/ListView'
import TaskModal, { TaskFormData } from '../components/TaskModal'
import BoardMembers from '../components/BoardMembers'
import { FilterSidebar, TaskFilters } from '../components/FilterSidebar'
import { Task } from '../types'

type ViewType = 'kanban' | 'table' | 'list'

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
  const { data: members = [] } = useBoardMembers(boardId!)
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('kanban')
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)

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

  // Apply search and filters
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

    // Status filter
    const matchesStatus = filters.status.length === 0 || filters.status.includes(task.status)

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
      (filters.isOverdue === true && task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done')

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesHasLabels && matchesOverdue
  })

  const handleCreateTask = async (data: TaskFormData) => {
    try {
      await createTaskMutation.mutateAsync({
        boardId: boardId!,
        ...data,
      })
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to create task:', error)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/boards')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Boards
              </button>
              <h1 className="text-3xl font-bold text-gray-900">TaskFlow</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition"
            >
              Logout
            </button>
          </div>

          <div className="flex gap-4 items-center">
            {/* View Switcher */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setCurrentView('kanban')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  currentView === 'kanban'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Kanban
              </button>
              <button
                onClick={() => setCurrentView('table')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  currentView === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 Table
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  currentView === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📝 List
              </button>
            </div>

            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition"
            >
              🔍 Filters
            </button>
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition"
            >
              👥 Members ({members.length})
            </button>
            <button
              onClick={() => {
                setEditingTask(null)
                setIsModalOpen(true)
              }}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
            >
              New Task
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          {showFilters && (
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters(DEFAULT_FILTERS)}
            />
          )}

          {/* Board Views */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center text-gray-600">Loading tasks...</div>
            ) : currentView === 'kanban' ? (
              <KanbanBoard
                tasks={filteredTasks}
                onTaskClick={(task) => {
                  setEditingTask(task)
                  setIsModalOpen(true)
                }}
                onTaskMoved={async (taskId, newStatus, newOrderIndex) => {
                  try {
                    await updateTaskMutation.mutateAsync({
                      id: taskId,
                      boardId: boardId!,
                      status: newStatus as 'to_do' | 'in_progress' | 'done',
                      order_index: newOrderIndex,
                    })
                  } catch (error) {
                    console.error('Failed to move task:', error)
                  }
                }}
              />
            ) : currentView === 'table' ? (
              <TableView
                tasks={filteredTasks}
                onTaskClick={(task) => {
                  setEditingTask(task)
                  setIsModalOpen(true)
                }}
              />
            ) : (
              <ListView
                tasks={filteredTasks}
                onTaskClick={(task) => {
                  setEditingTask(task)
                  setIsModalOpen(true)
                }}
              />
            )}
          </div>

          {/* Members Sidebar */}
          {showMembers && (
            <div className="w-80">
              <BoardMembers boardId={boardId!} isOwner={isOwner} />
            </div>
          )}
        </div>
      </main>

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          task={editingTask}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingTask(null)
          }}
          onCreate={handleCreateTask}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  )
}
