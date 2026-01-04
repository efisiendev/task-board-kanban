import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { TaskAssignee } from '../types'

// Fetch assignees for a specific task
export function useTaskAssignees(taskId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['task-assignees', taskId],
    queryFn: async () => {
      if (!taskId) return []

      const { data, error } = await supabase
        .from('task_assignees')
        .select('*')
        .eq('task_id', taskId)
        .order('assigned_at', { ascending: true })

      if (error) throw error
      return data as TaskAssignee[]
    },
    enabled: !!taskId,
  })

  // Real-time subscription
  useEffect(() => {
    if (!taskId) return

    const channel = supabase
      .channel(`task-assignees:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_assignees',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['task-assignees', taskId] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [taskId, queryClient])

  return query
}

// Add assignee to task
export function useAddTaskAssignee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, userId, boardId }: {
      taskId: string
      userId: string
      boardId: string
    }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      // Auto-add user to board if not already a member
      const { data: existing } = await supabase
        .from('board_members')
        .select('id')
        .eq('board_id', boardId)
        .eq('user_id', userId)
        .maybeSingle()

      if (!existing) {
        await supabase.from('board_members').insert({
          board_id: boardId,
          user_id: userId,
          role: 'member',
        })
      }

      // Add assignee
      const { data, error } = await supabase
        .from('task_assignees')
        .insert({
          task_id: taskId,
          user_id: userId,
          assigned_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as TaskAssignee
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignees', variables.taskId] })
    },
  })
}

// Remove assignee from task
export function useRemoveTaskAssignee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const { error } = await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignees', variables.taskId] })
    },
  })
}

// Replace all assignees for a task (bulk update)
export function useUpdateTaskAssignees() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      userIds,
      boardId,
    }: {
      taskId: string
      userIds: string[]
      boardId: string
    }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      // Auto-add all users to board if not already members
      for (const userId of userIds) {
        const { data: existing } = await supabase
          .from('board_members')
          .select('id')
          .eq('board_id', boardId)
          .eq('user_id', userId)
          .maybeSingle()

        if (!existing) {
          await supabase.from('board_members').insert({
            board_id: boardId,
            user_id: userId,
            role: 'member',
          })
        }
      }

      // Remove all existing assignees
      await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', taskId)

      // Add new assignees
      if (userIds.length > 0) {
        const assignees = userIds.map(userId => ({
          task_id: taskId,
          user_id: userId,
          assigned_by: user.id,
        }))

        const { error } = await supabase
          .from('task_assignees')
          .insert(assignees)

        if (error) throw error
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignees', variables.taskId] })
    },
  })
}
