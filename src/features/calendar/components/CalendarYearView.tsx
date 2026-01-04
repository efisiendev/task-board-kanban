import { CalendarEvent } from '../../../types'
import { CalendarMonth } from './CalendarMonth'

interface CalendarYearViewProps {
  year: number
  events: CalendarEvent[]
  onDateClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onCreateEvent: (date: Date) => void
}

export function CalendarYearView({
  year,
  events,
  onDateClick,
  onEventClick,
  onCreateEvent,
}: CalendarYearViewProps) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {months.map((monthName, monthIndex) => (
        <CalendarMonth
          key={monthIndex}
          year={year}
          month={monthIndex}
          monthName={monthName}
          events={events}
          onDateClick={onDateClick}
          onEventClick={onEventClick}
          onCreateEvent={onCreateEvent}
        />
      ))}
    </div>
  )
}
