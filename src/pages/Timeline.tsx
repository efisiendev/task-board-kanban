import { useState } from 'react'
import { useCalendarEvents } from '../features/calendar/hooks/useCalendarEvents'
import { CalendarYearView } from '../features/calendar/components/CalendarYearView'
import { EventDetailSidebar } from '../features/calendar/components/EventDetailSidebar'
import { CalendarEvent } from '../types'
import { MainLayout } from '../components/MainLayout'

export default function Timeline() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)

  const { data: events = [], isLoading } = useCalendarEvents(selectedYear)

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    setIsCreatingEvent(false)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setSelectedDate(null)
    setIsCreatingEvent(false)
  }

  const handleCreateEvent = (date: Date) => {
    setSelectedDate(date)
    setIsCreatingEvent(true)
    setSelectedEvent(null)
  }

  const handleCloseSidebar = () => {
    setSelectedDate(null)
    setSelectedEvent(null)
    setIsCreatingEvent(false)
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading timeline...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      topBarContent={
        <div className="flex justify-between items-center w-full">
          {/* Year Selector */}
          <div className="flex items-center gap-2 md:gap-3 ml-auto">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg md:text-xl font-semibold text-gray-900 w-16 md:w-20 text-center flex-shrink-0">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedYear(currentYear)}
              className="ml-1 md:ml-2 px-3 md:px-4 py-2 text-xs md:text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex-shrink-0 whitespace-nowrap"
            >
              Today
            </button>
          </div>
        </div>
      }
    >
      <div className="flex h-full overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Calendar Area */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Timeline {selectedYear}</h2>
              <p className="text-gray-600">
                Plan and manage your events, projects, and agendas throughout the year.
              </p>
            </div>

            <CalendarYearView
              year={selectedYear}
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              onCreateEvent={handleCreateEvent}
            />
          </div>
        </div>

        {/* Event Detail Sidebar */}
        {(selectedDate || selectedEvent) && (
          <EventDetailSidebar
            date={selectedDate}
            event={selectedEvent}
            isCreating={isCreatingEvent}
            events={events}
            onClose={handleCloseSidebar}
            onEventClick={handleEventClick}
          />
        )}
      </div>
    </MainLayout>
  )
}
