import { useCreateTask, useUpdateTask, useDeleteTask } from './useTasks'
import { Task } from '../types'
import { TaskFormData } from '../components/TaskModal'

interface UseTaskOperationsParams {
  boardId: string
  editingTask: Task | null
  setEditingTask: (task: Task | null) => void
  setIsModalOpen: (isOpen: boolean) => void
  initialStatusId: string | null
  setInitialStatusId: (statusId: string | null) => void
}

export function useTaskOperations({
  boardId,
  editingTask,
  setEditingTask,
  setIsModalOpen,
  initialStatusId,
  setInitialStatusId,
}: UseTaskOperationsParams) {
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()

  const handleCreateTask = async (data: TaskFormData) => {
    try {
      await createTaskMutation.mutateAsync({
        boardId,
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
      await deleteTaskMutation.mutateAsync({ id: taskId, boardId })
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleQuickEditTask = async (taskId: string, newTitle: string) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        boardId,
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
        boardId,
        ...data,
      })
      setEditingTask(null)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDeleteTask = async () => {
    if (!editingTask) return
    try {
      await deleteTaskMutation.mutateAsync({ id: editingTask.id, boardId })
      setEditingTask(null)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  return {
    handleCreateTask,
    handleAddTaskFromColumn,
    handleDeleteTaskFromCard,
    handleQuickEditTask,
    handleUpdateTask,
    handleDeleteTask,
  }
}
