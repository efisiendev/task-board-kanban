import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { TaskChecklistItem } from '../types'

export function useTaskChecklist(taskId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['task-checklist', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_checklist')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index', { ascending: true })

      if (error) throw error
      return data as TaskChecklistItem[]
    },
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
    }: {
      taskId: string
      title: string
      orderIndex: number
    }) => {
      const { data, error } = await supabase
        .from('task_checklist')
        .insert({
          task_id: taskId,
          title,
          order_index: orderIndex,
          is_completed: false,
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
      orderIndex,
    }: {
      id: string
      taskId: string
      title?: string
      isCompleted?: boolean
      orderIndex?: number
    }) => {
      const updates: Record<string, unknown> = {}
      if (title !== undefined) updates.title = title
      if (isCompleted !== undefined) updates.is_completed = isCompleted
      if (orderIndex !== undefined) updates.order_index = orderIndex

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
      items: { id: string; order_index: number }[]
    }) => {
      // Update all items in a transaction-like manner
      const promises = items.map((item) =>
        supabase
          .from('task_checklist')
          .update({ order_index: item.order_index })
          .eq('id', item.id)
      )

      const results = await Promise.all(promises)
      const error = results.find((r) => r.error)?.error
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.taskId] })
    },
  })
}
