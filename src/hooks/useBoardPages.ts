import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { BoardPage, BoardPageType } from '../types'
import { useEffect } from 'react'

// Fetch all pages for a board
export function useBoardPages(boardId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['board-pages', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_pages')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true })

      if (error) throw error
      return data as BoardPage[]
    },
    enabled: !!boardId,
  })

  // Realtime subscription for live updates
  useEffect(() => {
    if (!boardId) return

    const channel = supabase
      .channel(`board-pages:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_pages',
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            queryClient.setQueryData<BoardPage[]>(['board-pages', boardId], (old = []) => [
              ...old,
              payload.new as BoardPage,
            ])
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData<BoardPage[]>(['board-pages', boardId], (old = []) =>
              old.map((page) => (page.id === payload.new.id ? (payload.new as BoardPage) : page))
            )
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData<BoardPage[]>(['board-pages', boardId], (old = []) =>
              old.filter((page) => page.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [boardId, queryClient])

  return query
}

// Create a new page or folder
export function useCreateBoardPage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      board_id: string
      parent_id?: string | null
      title: string
      type: BoardPageType
      content?: string | null
    }) => {
      // Get max position for ordering
      const { data: pages } = await supabase
        .from('board_pages')
        .select('position')
        .eq('board_id', params.board_id)
        .eq('parent_id', params.parent_id || null)
        .order('position', { ascending: false })
        .limit(1)

      const maxPosition = pages && pages.length > 0 ? pages[0].position : -1

      const { data, error } = await supabase
        .from('board_pages')
        .insert({
          board_id: params.board_id,
          parent_id: params.parent_id || null,
          title: params.title,
          type: params.type,
          content: params.content || null,
          position: maxPosition + 1,
        })
        .select()
        .single()

      if (error) throw error
      return data as BoardPage
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['board-pages', data.board_id] })
    },
  })
}

// Update a page
export function useUpdateBoardPage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      board_id: string
      title?: string
      content?: string | null
      parent_id?: string | null
      position?: number
    }) => {
      const updateData: Partial<BoardPage> = {}
      if (params.title !== undefined) updateData.title = params.title
      if (params.content !== undefined) updateData.content = params.content
      if (params.parent_id !== undefined) updateData.parent_id = params.parent_id
      if (params.position !== undefined) updateData.position = params.position

      const { data, error } = await supabase
        .from('board_pages')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error
      return data as BoardPage
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['board-pages', data.board_id] })
    },
  })
}

// Delete a page (will cascade delete children)
export function useDeleteBoardPage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: string; board_id: string }) => {
      const { error } = await supabase.from('board_pages').delete().eq('id', params.id)

      if (error) throw error
      return params
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: ['board-pages', params.board_id] })
    },
  })
}

// Move page to different parent or position
export function useMoveBoardPage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      board_id: string
      new_parent_id: string | null
      new_position: number
    }) => {
      const { data, error } = await supabase
        .from('board_pages')
        .update({
          parent_id: params.new_parent_id,
          position: params.new_position,
        })
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error
      return data as BoardPage
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['board-pages', data.board_id] })
    },
  })
}
