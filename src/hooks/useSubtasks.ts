import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Subtask } from '../types'

export function useSubtasks(taskId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_task_id', taskId)
        .order('order_index', { ascending: true })

      if (error) throw error
      return data as Subtask[]
    },
    enabled: !!taskId, // Only run query if taskId is not empty
  })

  // Real-time subscription for subtasks (from tasks table where parent_task_id is set)
  useEffect(() => {
    if (!taskId) return // Don't subscribe if taskId is empty

    const channel = supabase
      .channel(`task-subtasks:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `parent_task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [taskId, queryClient])

  return query
}

export function useCreateSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      boardId,
      title,
      description,
      orderIndex,
      statusId,
      priority,
      assignedTo,
      dueDate,
      startDate,
      labels,
      estimatedTime,
      actualTime,
    }: {
      taskId: string
      boardId: string
      title: string
      description?: string
      orderIndex: number
      statusId?: string
      priority?: Subtask['priority']
      assignedTo?: string | null
      dueDate?: string | null
      startDate?: string | null
      labels?: string[] | null
      estimatedTime?: number | null
      actualTime?: number | null
    }) => {
      // Get first status for this board if not provided
      let finalStatusId = statusId
      if (!finalStatusId) {
        const { data: firstStatus } = await supabase
          .from('board_statuses')
          .select('id')
          .eq('board_id', boardId)
          .order('order_index', { ascending: true })
          .limit(1)
          .single()

        if (firstStatus) {
          finalStatusId = firstStatus.id
        }
      }

      // Get current user for created_by
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          parent_task_id: taskId,
          board_id: boardId,
          title,
          description: description || null,
          order_index: orderIndex,
          status_id: finalStatusId,
          depth_level: 1,
          priority: priority || null,
          assigned_to: assignedTo || null,
          due_date: dueDate || null,
          start_date: startDate || null,
          labels: labels || null,
          estimated_time: estimatedTime || null,
          actual_time: actualTime || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as Subtask
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', variables.taskId] })
    },
  })
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      taskId,
      title,
      isCompleted,
      status_id,
      orderIndex,
      priority,
      assigned_to,
      due_date,
      labels,
      estimated_time,
      actual_time,
    }: {
      id: string
      taskId: string
      title?: string
      isCompleted?: boolean
      status_id?: string
      orderIndex?: number
      priority?: Subtask['priority']
      assigned_to?: string | null
      due_date?: string | null
      labels?: string[] | null
      estimated_time?: number | null
      actual_time?: number | null
    }) => {
      const updates: Record<string, unknown> = {}
      if (title !== undefined) updates.title = title
      if (isCompleted !== undefined) updates.is_completed = isCompleted
      if (status_id !== undefined) updates.status_id = status_id
      if (orderIndex !== undefined) updates.order_index = orderIndex
      if (priority !== undefined) updates.priority = priority
      if (assigned_to !== undefined) updates.assigned_to = assigned_to
      if (due_date !== undefined) updates.due_date = due_date
      if (labels !== undefined) updates.labels = labels
      if (estimated_time !== undefined) updates.estimated_time = estimated_time
      if (actual_time !== undefined) updates.actual_time = actual_time

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Subtask
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', variables.taskId] })
    },
  })
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', variables.taskId] })
    },
  })
}

export function useReorderSubtasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      items,
    }: {
      taskId: string
      items: { id: string; order_index: number; status_id?: string }[]
    }) => {
      // Update all items in a transaction-like manner
      const promises = items.map((item) => {
        const updates: Record<string, unknown> = { order_index: item.order_index }
        if (item.status_id !== undefined) {
          updates.status_id = item.status_id
        }
        return supabase.from('tasks').update(updates).eq('id', item.id)
      })

      const results = await Promise.all(promises)
      const error = results.find((r) => r.error)?.error
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', variables.taskId] })
    },
  })
}
