import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { BoardMember, BoardMemberRole, BoardMemberWithProfile } from '../../../types'

export function useBoardMembers(boardId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['board-members', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_members')
        .select(`
          *,
          user_profiles(email, username, employee_number, full_name, avatar_url)
        `)
        .eq('board_id', boardId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as BoardMemberWithProfile[]
    },
  })

  // Real-time subscription for board members
  useEffect(() => {
    const channel = supabase
      .channel(`board-members:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_members',
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['board-members', boardId] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [boardId, queryClient])

  return query
}

export function useAddBoardMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      boardId,
      userId,
      role,
    }: {
      boardId: string
      userId: string
      role: BoardMemberRole
    }) => {
      const { data, error } = await supabase
        .from('board_members')
        .insert({
          board_id: boardId,
          user_id: userId,
          role: role || 'member',
        })
        .select()
        .single()

      if (error) throw error
      return data as BoardMember
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board-members', variables.boardId] })
    },
  })
}

export function useRemoveBoardMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId }: { boardId: string; memberId: string }) => {
      const { error } = await supabase
        .from('board_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board-members', variables.boardId] })
    },
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      boardId: string
      memberId: string
      role: BoardMemberRole
    }) => {
      const { data, error } = await supabase
        .from('board_members')
        .update({ role })
        .eq('id', memberId)
        .select()
        .single()

      if (error) throw error
      return data as BoardMember
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board-members', variables.boardId] })
    },
  })
}
