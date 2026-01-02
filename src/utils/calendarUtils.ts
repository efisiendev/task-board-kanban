import { CalendarEvent } from '../types'

export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function formatDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function isEventOnDate(event: CalendarEvent, dateStr: string): boolean {
  return dateStr >= event.start_date && dateStr <= event.end_date
}

export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dateStr = formatDateToISO(date)
  return events.filter(event => isEventOnDate(event, dateStr))
}

export function getEventsForMonth(events: CalendarEvent[], year: number, month: number): CalendarEvent[] {
  const monthStart = formatDateString(year, month, 1)
  const lastDay = new Date(year, month + 1, 0).getDate()
  const monthEnd = formatDateString(year, month, lastDay)

  return events.filter(event =>
    event.start_date <= monthEnd && event.end_date >= monthStart
  )
}

export function getCurrentMonthRange() {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]

  return { startOfMonth, endOfMonth, currentYear, currentMonth }
}
