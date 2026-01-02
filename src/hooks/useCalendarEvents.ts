import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { CalendarEvent, CalendarEventCoordinationType } from '../types'

// Fetch all calendar events for a specific year
export function useCalendarEvents(year: number) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['calendar-events', year],
    queryFn: async () => {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*, board:boards(id, name, color)')
        .or(`start_date.gte.${startDate},end_date.lte.${endDate}`)
        .order('start_date', { ascending: true })

      if (error) throw error
      return data as CalendarEvent[]
    },
  })

  // Real-time subscription for calendar events
  useEffect(() => {
    const channel = supabase
      .channel(`calendar-events:${year}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['calendar-events', year] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [year, queryClient])

  return query
}

// Fetch events for a specific date range (for month view)
export function useCalendarEventsByRange(startDate: string, endDate: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['calendar-events-range', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*, board:boards(id, name, color)')
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)
        .order('start_date', { ascending: true })

      if (error) throw error
      return data as CalendarEvent[]
    },
  })

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`calendar-events-range:${startDate}:${endDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['calendar-events-range', startDate, endDate] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [startDate, endDate, queryClient])

  return query
}

// Create calendar event
export function useCreateCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      title,
      description,
      startDate,
      endDate,
      coordinationType,
      boardId,
      taskId,
      color,
    }: {
      title: string
      description?: string
      startDate: string
      endDate: string
      coordinationType?: CalendarEventCoordinationType
      boardId?: string
      taskId?: string
      color?: string
    }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title,
          description: description || null,
          start_date: startDate,
          end_date: endDate,
          coordination_type: coordinationType || null,
          board_id: boardId || null,
          task_id: taskId || null,
          color: color || '#3B82F6',
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as CalendarEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events-range'] })
    },
  })
}

// Update calendar event
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      startDate,
      endDate,
      coordinationType,
      boardId,
      taskId,
      color,
    }: {
      id: string
      title?: string
      description?: string
      startDate?: string
      endDate?: string
      coordinationType?: CalendarEventCoordinationType | null
      boardId?: string | null
      taskId?: string | null
      color?: string
    }) => {
      const updates: Record<string, unknown> = {}
      if (title !== undefined) updates.title = title
      if (description !== undefined) updates.description = description
      if (startDate !== undefined) updates.start_date = startDate
      if (endDate !== undefined) updates.end_date = endDate
      if (coordinationType !== undefined) updates.coordination_type = coordinationType
      if (boardId !== undefined) updates.board_id = boardId
      if (taskId !== undefined) updates.task_id = taskId
      if (color !== undefined) updates.color = color

      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as CalendarEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events-range'] })
    },
  })
}

// Delete calendar event
export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events-range'] })
    },
  })
}
