import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { TaskRelation, TaskRelationType } from '../../../types'

export function useTaskRelations(taskId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['task-relations', taskId],
    queryFn: async () => {
      // Get relations where this task is the source
      const { data: outgoing, error: outgoingError } = await supabase
        .from('task_relations')
        .select(`
          *,
          to_task:tasks!task_relations_to_task_id_fkey(id, title, status_id, board_id)
        `)
        .eq('from_task_id', taskId)

      if (outgoingError) throw outgoingError

      // Get relations where this task is the target
      const { data: incoming, error: incomingError } = await supabase
        .from('task_relations')
        .select(`
          *,
          from_task:tasks!task_relations_from_task_id_fkey(id, title, status_id, board_id)
        `)
        .eq('to_task_id', taskId)

      if (incomingError) throw incomingError

      return {
        outgoing: (outgoing || []) as TaskRelation[],
        incoming: (incoming || []) as TaskRelation[],
      }
    },
    enabled: !!taskId, // Only run query if taskId is not empty
  })

  // Real-time subscription
  useEffect(() => {
    if (!taskId) return // Don't subscribe if taskId is empty

    const channel = supabase
      .channel(`task-relations:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_relations',
          filter: `from_task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['task-relations', taskId] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_relations',
          filter: `to_task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['task-relations', taskId] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [taskId, queryClient])

  return query
}

export function useCreateTaskRelation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      fromTaskId,
      toTaskId,
      relationType,
    }: {
      fromTaskId: string
      toTaskId: string
      relationType: TaskRelationType
    }) => {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('task_relations')
        .insert({
          from_task_id: fromTaskId,
          to_task_id: toTaskId,
          relation_type: relationType,
          created_by: user?.id || null,
        })
        .select()
        .single()

      if (error) throw error
      return data as TaskRelation
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-relations', variables.fromTaskId] })
      queryClient.invalidateQueries({ queryKey: ['task-relations', variables.toTaskId] })
    },
  })
}

export function useDeleteTaskRelation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; fromTaskId: string; toTaskId: string }) => {
      const { error } = await supabase
        .from('task_relations')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-relations', variables.fromTaskId] })
      queryClient.invalidateQueries({ queryKey: ['task-relations', variables.toTaskId] })
    },
  })
}
