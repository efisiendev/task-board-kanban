import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { useAuth } from '../hooks/useAuth'
import KanbanBoard from '../components/KanbanBoard'
import TaskModal from '../components/TaskModal'
import { Task } from '../types'

export default function Board() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { data: tasks = [], isLoading } = useTasks(boardId!)
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleCreateTask = async (title: string, description: string) => {
    try {
      await createTaskMutation.mutateAsync({ boardId: boardId!, title, description })
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleUpdateTask = async (title: string, description: string) => {
    if (!editingTask) return
    try {
      await updateTaskMutation.mutateAsync({
        id: editingTask.id,
        boardId: boardId!,
        title,
        description,
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

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
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
        {isLoading ? (
          <div className="text-center text-gray-600">Loading tasks...</div>
        ) : (
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
        )}
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
