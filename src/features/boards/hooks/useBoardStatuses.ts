import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { BoardStatus } from '../../../types'

// Query: Get all statuses for a board
export function useBoardStatuses(boardId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['board-statuses', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_statuses')
        .select('*')
        .eq('board_id', boardId)
        .order('order_index', { ascending: true })

      if (error) throw error
      return (data || []) as BoardStatus[]
    },
    enabled: !!boardId,
  })

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`board-statuses:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_statuses',
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['board-statuses', boardId] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [boardId, queryClient])

  return query
}

// Mutation: Create a new status
export function useCreateBoardStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      boardId: string
      name: string
      color?: string
      orderIndex?: number
    }) => {
      const { data: result, error } = await supabase
        .from('board_statuses')
        .insert({
          board_id: data.boardId,
          name: data.name,
          color: data.color || 'gray',
          order_index: data.orderIndex ?? 999,
          is_default: false,
        })
        .select()
        .single()

      if (error) throw error
      return result as BoardStatus
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board-statuses', variables.boardId] })
    },
  })
}

// Mutation: Update a status
export function useUpdateBoardStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      id: string
      boardId: string
      name?: string
      color?: string
      orderIndex?: number
    }) => {
      const updates: Record<string, string | number> = {}
      if (data.name !== undefined) updates.name = data.name
      if (data.color !== undefined) updates.color = data.color
      if (data.orderIndex !== undefined) updates.order_index = data.orderIndex

      const { data: result, error } = await supabase
        .from('board_statuses')
        .update(updates)
        .eq('id', data.id)
        .select()
        .single()

      if (error) throw error
      return result as BoardStatus
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board-statuses', variables.boardId] })
    },
  })
}

// Mutation: Delete a status
export function useDeleteBoardStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { id: string; boardId: string }) => {
      const { error } = await supabase.from('board_statuses').delete().eq('id', data.id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board-statuses', variables.boardId] })
    },
  })
}

// Mutation: Reorder statuses
export function useReorderBoardStatuses() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { boardId: string; statusIds: string[] }) => {
      // Update order_index for each status
      const updates = data.statusIds.map((id, index) =>
        supabase.from('board_statuses').update({ order_index: index }).eq('id', id)
      )

      const results = await Promise.all(updates)
      const error = results.find((r) => r.error)?.error
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board-statuses', variables.boardId] })
    },
  })
}
