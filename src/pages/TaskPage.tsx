import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Task } from '../types'
import TaskModal, { TaskFormData } from '../features/tasks/components/TaskModal'
import { ArrowLeft } from 'lucide-react'

export default function TaskPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch task with board info for breadcrumb
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          board:boards(id, name)
        `)
        .eq('id', taskId!)
        .single()

      if (error) throw error
      return data as Task & { board: { id: string; name: string } }
    },
    enabled: !!taskId,
  })

  // Realtime subscription for task updates
  useEffect(() => {
    if (!taskId) return

    const channel = supabase
      .channel(`task:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['task', taskId] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [taskId, queryClient])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading task...</div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Task not found</h2>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  const handleClose = () => {
    // Navigate back to board if available, otherwise dashboard
    if (task.board?.id) {
      navigate(`/board/${task.board.id}`)
    } else {
      navigate('/')
    }
  }

  const handleUpdate = async (data: TaskFormData) => {
    if (!task) return

    const { error } = await supabase
      .from('tasks')
      .update({
        title: data.title,
        description: data.description,
        priority: data.priority,
        due_date: data.due_date,
        estimated_time: data.estimated_time,
        assigned_to: data.assigned_to,
        labels: data.labels,
      })
      .eq('id', task.id)

    if (error) throw error

    queryClient.invalidateQueries({ queryKey: ['task', taskId] })
  }

  const handleDelete = async () => {
    if (!task) return

    const { error } = await supabase.from('tasks').delete().eq('id', task.id)

    if (error) throw error

    // Navigate back after delete
    if (task.board?.id) {
      navigate(`/board/${task.board.id}`)
    } else {
      navigate('/')
    }
  }

  const handleCreate = async () => {
    // Not used in standalone mode
    throw new Error('Create not supported in standalone task view')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button
              onClick={() => navigate('/')}
              className="hover:text-gray-900 transition"
            >
              🏠 Boards
            </button>
            {task.board && (
              <>
                <span>/</span>
                <button
                  onClick={() => navigate(`/board/${task.board.id}`)}
                  className="hover:text-gray-900 transition"
                >
                  {task.board.name}
                </button>
              </>
            )}
            <span>/</span>
            <span className="text-gray-900 font-medium">{task.title}</span>
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <button
          onClick={handleClose}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to board
        </button>
      </div>

      {/* Task content - render TaskModal */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <TaskModal
          isOpen={true}
          onClose={handleClose}
          task={task}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
