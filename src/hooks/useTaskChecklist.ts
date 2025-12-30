import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { TaskChecklistItem, SubtaskStatus } from '../types'

export function useTaskChecklist(taskId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['task-checklist', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_checklist')
        .select('*')
        .eq('task_id', taskId)
        .order('status, order_index', { ascending: true })

      if (error) throw error
      return data as TaskChecklistItem[]
    },
    refetchInterval: 2000, // Auto-refresh every 2s (temporary for debug)
  })

  // Real-time subscription for checklist items
  useEffect(() => {
    console.log('🔔 Setting up checklist Realtime subscription for task:', taskId)

    const channel = supabase
      .channel(`task-checklist:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_checklist',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          console.log('✅ Checklist Realtime event:', payload)
          queryClient.invalidateQueries({ queryKey: ['task-checklist', taskId] })
        }
      )
      .subscribe((status) => {
        console.log('📡 Checklist subscription status:', status)
      })

    return () => {
      console.log('🔕 Unsubscribing from task checklist:', taskId)
      channel.unsubscribe()
    }
  }, [taskId, queryClient])

  return query
}

export function useCreateChecklistItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      title,
      orderIndex,
      status = 'todo',
      priority,
      dueDate,
      estimatedTime,
    }: {
      taskId: string
      title: string
      orderIndex: number
      status?: SubtaskStatus
      priority?: TaskChecklistItem['priority']
      dueDate?: string | null
      estimatedTime?: number | null
    }) => {
      const { data, error } = await supabase
        .from('task_checklist')
        .insert({
          task_id: taskId,
          title,
          order_index: orderIndex,
          status,
          is_completed: false,
          priority: priority || null,
          due_date: dueDate || null,
          estimated_time: estimatedTime || null,
        })
        .select()
        .single()

      if (error) throw error
      return data as TaskChecklistItem
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.taskId] })
    },
  })
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      taskId,
      title,
      isCompleted,
      status,
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
      status?: SubtaskStatus
      orderIndex?: number
      priority?: TaskChecklistItem['priority']
      assigned_to?: string | null
      due_date?: string | null
      labels?: string[] | null
      estimated_time?: number | null
      actual_time?: number | null
    }) => {
      const updates: Record<string, unknown> = {}
      if (title !== undefined) updates.title = title
      if (isCompleted !== undefined) updates.is_completed = isCompleted
      if (status !== undefined) updates.status = status
      if (orderIndex !== undefined) updates.order_index = orderIndex
      if (priority !== undefined) updates.priority = priority
      if (assigned_to !== undefined) updates.assigned_to = assigned_to
      if (due_date !== undefined) updates.due_date = due_date
      if (labels !== undefined) updates.labels = labels
      if (estimated_time !== undefined) updates.estimated_time = estimated_time
      if (actual_time !== undefined) updates.actual_time = actual_time

      const { data, error } = await supabase
        .from('task_checklist')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as TaskChecklistItem
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.taskId] })
    },
  })
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase.from('task_checklist').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.taskId] })
    },
  })
}

export function useReorderChecklistItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      items,
    }: {
      taskId: string
      items: { id: string; order_index: number; status?: SubtaskStatus }[]
    }) => {
      // Update all items in a transaction-like manner
      const promises = items.map((item) => {
        const updates: Record<string, unknown> = { order_index: item.order_index }
        if (item.status !== undefined) {
          updates.status = item.status
        }
        return supabase.from('task_checklist').update(updates).eq('id', item.id)
      })

      const results = await Promise.all(promises)
      const error = results.find((r) => r.error)?.error
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.taskId] })
    },
  })
}
