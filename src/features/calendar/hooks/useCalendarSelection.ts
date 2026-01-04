import { useState, useCallback } from 'react'
import { CalendarEvent } from '../../../types'

export function useCalendarSelection() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    setIsCreatingEvent(false)
  }, [])

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
    setSelectedDate(null)
    setIsCreatingEvent(false)
  }, [])

  const handleCreateEvent = useCallback((date: Date) => {
    setSelectedDate(date)
    setIsCreatingEvent(true)
    setSelectedEvent(null)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedDate(null)
    setSelectedEvent(null)
    setIsCreatingEvent(false)
  }, [])

  return {
    selectedDate,
    selectedEvent,
    isCreatingEvent,
    handleDateClick,
    handleEventClick,
    handleCreateEvent,
    handleClose,
  }
}
