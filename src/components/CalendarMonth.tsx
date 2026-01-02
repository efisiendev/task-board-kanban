import { useMemo } from 'react'
import { CalendarEvent } from '../types'

interface CalendarMonthProps {
  year: number
  month: number // 0-11
  monthName: string
  events: CalendarEvent[]
  onDateClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onCreateEvent: (date: Date) => void
}

export function CalendarMonth({
  year,
  month,
  monthName,
  events,
  onDateClick,
  onCreateEvent,
}: CalendarMonthProps) {
  const { days, startDay } = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDay = firstDay.getDay() // 0 = Sunday

    const days: (number | null)[] = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return { days, startDay }
  }, [year, month])

  // Get events for a specific date
  const getEventsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter((event) => {
      const start = event.start_date
      const end = event.end_date
      return dateStr >= start && dateStr <= end
    })
  }

  const handleDayClick = (day: number | null) => {
    if (day === null) return
    const date = new Date(year, month, day)
    const dayEvents = getEventsForDate(day)

    // Always show form - either view existing events or create new
    if (dayEvents.length > 0) {
      // Has events - show first event or date detail
      onDateClick(date)
    } else {
      // No events - show create form
      onCreateEvent(date)
    }
  }

  const isToday = (day: number | null) => {
    if (day === null) return false
    const today = new Date()
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
      {/* Month Header */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{monthName}</h3>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
          <div
            key={dayName}
            className="text-center text-[10px] font-medium text-gray-500 uppercase py-1"
          >
            {dayName}
          </div>
        ))}

        {/* Day Cells */}
        {days.map((day, index) => {
          const dayEvents = day !== null ? getEventsForDate(day) : []
          const hasEvents = dayEvents.length > 0

          return (
            <div
              key={index}
              onClick={() => handleDayClick(day)}
              className={`
                relative py-4 md:py-6 flex flex-col items-center justify-center text-xs rounded
                ${day === null ? 'bg-transparent cursor-default' : 'cursor-pointer hover:bg-gray-50'}
                ${isToday(day) ? 'bg-blue-50 border border-blue-500 font-semibold text-blue-700' : ''}
                ${hasEvents ? 'font-medium' : ''}
              `}
            >
              {day !== null && (
                <>
                  <span className={isToday(day) ? 'text-blue-700' : 'text-gray-900'}>
                    {day}
                  </span>

                  {/* Event Indicators - Line through date */}
                  {hasEvents && (
                    <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={event.id}
                          className="h-0.5 w-full rounded-full"
                          style={{ backgroundColor: event.color }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Events Count */}
      {events.filter((e) => {
        const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
        const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-31`
        return e.start_date <= monthEnd && e.end_date >= monthStart
      }).length > 0 && (
        <div className="mt-2 text-[10px] text-gray-500 text-center">
          {events.filter((e) => {
            const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
            const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-31`
            return e.start_date <= monthEnd && e.end_date >= monthStart
          }).length} event(s)
        </div>
      )}
    </div>
  )
}
