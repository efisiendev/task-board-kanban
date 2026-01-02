import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Task, TaskPriority } from '../types'

// Helper function: Auto-add assigned user to board if not already a member
async function ensureUserIsBoardMember(boardId: string, userId: string) {
  if (!userId) return

  // Check if user is already a board member
  const { data: existingMember } = await supabase
    .from('board_members')
    .select('id')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .single()

  // If not a member, add them
  if (!existingMember) {
    await supabase.from('board_members').insert({
      board_id: boardId,
      user_id: userId,
      role: 'member',
    })
  }
}

export function useTasks(boardId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['tasks', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          board_status:board_statuses!tasks_status_id_fkey(id, name, color, order_index)
        `)
        .eq('board_id', boardId)
        .is('parent_task_id', null)
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
        (payload) => {
          // Invalidate tasks for this board
          queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
          
          // If it's a DELETE event, also invalidate all related queries for the deleted task
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            const taskId = payload.old.id
            queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
            queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
            queryClient.invalidateQueries({ queryKey: ['task-relations', taskId] })
            queryClient.invalidateQueries({ queryKey: ['task-pages', taskId] })
            queryClient.invalidateQueries({ queryKey: ['activity-log', taskId] })
          }
          
          // If it's an INSERT or UPDATE, invalidate queries for the affected task
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new?.id) {
            const taskId = payload.new.id
            queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
            queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
            queryClient.invalidateQueries({ queryKey: ['task-relations', taskId] })
            queryClient.invalidateQueries({ queryKey: ['task-pages', taskId] })
            queryClient.invalidateQueries({ queryKey: ['activity-log', taskId] })
          }
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
      priority,
      assigned_to,
      due_date,
      start_date,
      labels,
      estimated_time,
      status_id,
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
      status_id?: string
    }) => {
      // Get current user for created_by
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      // Auto-add assigned user to board if needed
      if (assigned_to) {
        await ensureUserIsBoardMember(boardId, assigned_to)
      }

      // Use provided status_id or get first status for this board (To Do)
      let targetStatusId = status_id
      if (!targetStatusId) {
        const { data: firstStatus } = await supabase
          .from('board_statuses')
          .select('id')
          .eq('board_id', boardId)
          .order('order_index', { ascending: true })
          .limit(1)
          .single()

        if (!firstStatus) {
          throw new Error('No statuses found for this board')
        }
        targetStatusId = firstStatus.id
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          board_id: boardId,
          title,
          description: description || null,
          status_id: targetStatusId,
          order_index: 0,
          priority: priority || null,
          assigned_to: assigned_to || null,
          due_date: due_date || null,
          start_date: start_date || null,
          labels: labels || null,
          created_by: user.id,
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
        status?: string // Legacy field, kept for backward compatibility
        status_id?: string
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

      // Auto-add assigned user to board if needed (when assignment changes)
      if (updates.assigned_to) {
        await ensureUserIsBoardMember(boardId, updates.assigned_to)
      }

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
      // Invalidate all related queries to ensure realtime sync everywhere
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.boardId] })
      queryClient.invalidateQueries({ queryKey: ['subtasks', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['task-comments', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['task-relations', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['task-pages', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['activity-log', variables.id] })
    },
  })
}
