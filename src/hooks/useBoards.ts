import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Board } from '../types'

export function useBoards() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      // Query all boards - RLS will automatically filter to show:
      // 1. Boards owned by user (user_id = auth.uid())
      // 2. Boards where user is a member (via board_members table)
      // Join with user_profiles to get owner email
      const { data, error } = await supabase
        .from('boards')
        .select(`
          *,
          user_profiles!boards_user_id_fkey(email)
        `)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data as Board[]
    },
    staleTime: 0, // Always refetch to ensure fresh data per user
  })

  // Real-time subscription for boards
  useEffect(() => {
    const channel = supabase
      .channel('boards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boards',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['boards'] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [queryClient])

  // Real-time subscription for board_members (affects which boards user can see)
  useEffect(() => {
    const channel = supabase
      .channel('board-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_members',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['boards'] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [queryClient])

  return query
}

export function useCreateBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { name: string; description?: string; color: string }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('boards')
        .insert({ 
          name: params.name, 
          description: params.description || null,
          color: params.color, 
          user_id: user.id 
        })
        .select()
        .single()

      if (error) throw error
      return data as Board
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}

export function useUpdateBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name, description, color }: { 
      id: string
      name?: string
      description?: string | null
      color?: string
    }) => {
      const updateData: Partial<Board> = {}
      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (color !== undefined) updateData.color = color

      const { data, error } = await supabase
        .from('boards')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Board
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}

export function useDeleteBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('boards').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}
