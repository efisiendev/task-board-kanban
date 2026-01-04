import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { Task } from '../../../types'
import { Circle } from '../../../lib/icons'
import 'react-big-calendar/lib/css/react-big-calendar.css'

interface CalendarEvent extends Event {
  resource: Task
}

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  // Convert tasks to calendar events
  const events: CalendarEvent[] = tasks
    .filter((task) => task.due_date) // Only show tasks with due dates
    .map((task) => ({
      id: task.id,
      title: task.title,
      start: new Date(task.due_date!),
      end: new Date(task.due_date!),
      resource: task,
    }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2 md:p-4 h-[calc(100vh-240px)] md:h-[calc(100vh-280px)] min-h-[400px] md:min-h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onSelectEvent={(event: CalendarEvent) => onTaskClick(event.resource)}
        views={['month', 'week', 'day']}
        defaultView="month"
        popup
        eventPropGetter={(event: CalendarEvent) => {
          const task = event.resource
          const isPastDue = new Date(task.due_date!) < new Date() && task.board_status?.name !== 'Done'
          const isMobile = window.innerWidth < 768

          return {
            style: {
              backgroundColor: isPastDue
                ? '#ef4444' // red for overdue
                : task.priority === 'urgent'
                ? '#dc2626'
                : task.priority === 'high'
                ? '#f59e0b'
                : task.priority === 'medium'
                ? '#3b82f6'
                : '#6b7280',
              borderRadius: '4px',
              border: 'none',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              padding: isMobile ? '1px 4px' : '2px 6px',
            },
          }
        }}
        components={{
          event: ({ event }: { event: CalendarEvent }) => {
            const task = event.resource
            const isMobile = window.innerWidth < 768
            return (
              <div className="flex items-center gap-1 text-xs">
                <span className="truncate">{event.title}</span>
                {task.priority && !isMobile && (
                  <>
                    {task.priority === 'urgent' && <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" />}
                    {task.priority === 'high' && <Circle className="w-2.5 h-2.5 fill-orange-500 text-orange-500" />}
                    {task.priority === 'medium' && <Circle className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />}
                    {task.priority === 'low' && <Circle className="w-2.5 h-2.5 fill-blue-500 text-blue-500" />}
                  </>
                )}
              </div>
            )
          },
        }}
      />
    </div>
  )
}
