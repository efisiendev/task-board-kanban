import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Task, TaskPriority } from '../types'

export function useTasks(boardId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['tasks', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('board_id', boardId)
        .order('order_index', { ascending: true })

      if (error) throw error
      return data as Task[]
    },
  })

  // Subscribe to real-time updates
  useEffect(() => {
    console.log('🔔 Setting up Realtime subscription for board:', boardId)

    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          console.log('✅ Realtime event received:', payload)
          queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status)
      })

    return () => {
      console.log('🔕 Unsubscribing from board:', boardId)
      channel.unsubscribe()
    }
  }, [boardId, queryClient])

  return query
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      boardId,
      title,
      description,
      priority,
      assigned_to,
      due_date,
      start_date,
      labels,
      estimated_time,
    }: {
      boardId: string
      title: string
      description?: string
      priority?: TaskPriority | null
      assigned_to?: string | null
      due_date?: string | null
      start_date?: string | null
      labels?: string[] | null
      estimated_time?: number | null
    }) => {
      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          board_id: boardId,
          title,
          description: description || null,
          status: 'to_do',
          order_index: 0,
          priority: priority || null,
          assigned_to: assigned_to || null,
          due_date: due_date || null,
          start_date: start_date || null,
          labels: labels || null,
          created_by: user?.id || null,
          estimated_time: estimated_time || null,
        })
        .select()
        .single()

      if (error) throw error
      return data as Task
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.boardId] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      variables: {
        id: string
        boardId: string
        title?: string
        description?: string
        status?: string
        order_index?: number
        priority?: TaskPriority | null
        assigned_to?: string | null
        due_date?: string | null
        start_date?: string | null
        labels?: string[] | null
        estimated_time?: number | null
        actual_time?: number | null
      }
    ) => {
      const { id, boardId, ...updates } = variables
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Task
    },
    onSuccess: (_data: Task, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.boardId] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: { id: string; boardId: string }) => {
      const { id } = variables
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data: unknown, variables: { id: string; boardId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.boardId] })
    },
  })
}
