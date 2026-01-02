import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { TaskComment, TaskActivity } from '../types'

// ============================================
// TASK COMMENTS HOOKS
// ============================================

export function useTaskComments(taskId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*, user_profiles(email, username, employee_number, avatar_url)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as TaskComment[]
    },
  })

  // Real-time subscription
  useEffect(() => {

    const channel = supabase
      .channel(`task-comments:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [taskId, queryClient])

  return query
}

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, comment }: { taskId: string; comment: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: user.id,
          comment,
        })
        .select()
        .single()

      if (error) throw error
      return data as TaskComment
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', variables.taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-activity', variables.taskId] })
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, taskId, comment }: { id: string; taskId: string; comment: string }) => {
      const { data, error } = await supabase
        .from('task_comments')
        .update({ comment })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as TaskComment
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', variables.taskId] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase.from('task_comments').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', variables.taskId] })
    },
  })
}

// ============================================
// TASK ACTIVITY HOOKS
// ============================================

export function useTaskActivity(taskId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['task-activity', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_activity_log')
        .select('*, user_profiles(email, username, employee_number, avatar_url)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(50) // Limit to last 50 activities

      if (error) throw error
      return data as TaskActivity[]
    },
  })

  // Real-time subscription
  useEffect(() => {

    const channel = supabase
      .channel(`task-activity:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_activity_log',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['task-activity', taskId] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [taskId, queryClient])

  return query
}
