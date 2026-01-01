import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { TaskPage } from '../types'

export function useTaskPages(taskId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['task-pages', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_pages')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index', { ascending: true })

      if (error) throw error
      return data as TaskPage[]
    },
  })

  // Real-time subscription for pages
  useEffect(() => {

    const channel = supabase
      .channel(`task-pages:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_pages',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['task-pages', taskId] })
        }
      )
      .subscribe((status) => {
      })

    return () => {
      channel.unsubscribe()
    }
  }, [taskId, queryClient])

  return query
}

export function useCreateTaskPage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      title,
      content,
      orderIndex,
    }: {
      taskId: string
      title: string
      content?: string
      orderIndex: number
    }) => {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('task_pages')
        .insert({
          task_id: taskId,
          title,
          content: content || '',
          order_index: orderIndex,
          created_by: user?.id || null,
        })
        .select()
        .single()

      if (error) throw error
      return data as TaskPage
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-pages', variables.taskId] })
    },
  })
}

export function useUpdateTaskPage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      taskId,
      title,
      content,
      orderIndex,
    }: {
      id: string
      taskId: string
      title?: string
      content?: string
      orderIndex?: number
    }) => {
      const updates: Record<string, unknown> = {}
      if (title !== undefined) updates.title = title
      if (content !== undefined) updates.content = content
      if (orderIndex !== undefined) updates.order_index = orderIndex

      const { data, error } = await supabase
        .from('task_pages')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as TaskPage
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-pages', variables.taskId] })
    },
  })
}

export function useDeleteTaskPage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase.from('task_pages').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-pages', variables.taskId] })
    },
  })
}

export function useReorderTaskPages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      pages,
    }: {
      taskId: string
      pages: { id: string; order_index: number }[]
    }) => {
      const promises = pages.map((page) =>
        supabase
          .from('task_pages')
          .update({ order_index: page.order_index })
          .eq('id', page.id)
      )

      const results = await Promise.all(promises)
      const error = results.find((r) => r.error)?.error
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-pages', variables.taskId] })
    },
  })
}
