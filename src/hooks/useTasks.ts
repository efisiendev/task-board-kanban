import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Task } from '../types'

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
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
        }
      )
      .subscribe()

    return () => {
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
    }: {
      boardId: string
      title: string
      description?: string
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          board_id: boardId,
          title,
          description: description || null,
          status: 'to_do',
          order_index: 0,
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
      }
    ) => {
      const { id, ...updates } = variables
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
