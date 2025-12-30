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
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false })

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
    mutationFn: async (name: string) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      console.log('🔍 Debug - User ID:', user.id)
      console.log('🔍 Debug - User Email:', user.email)
      console.log('🔍 Debug - Inserting:', { name, user_id: user.id })

      const { data, error } = await supabase
        .from('boards')
        .insert({ name, user_id: user.id })
        .select()
        .single()

      console.log('🔍 Debug - Insert Result:', data)
      console.log('🔍 Debug - Insert Error:', error)

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
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('boards')
        .update({ name })
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
