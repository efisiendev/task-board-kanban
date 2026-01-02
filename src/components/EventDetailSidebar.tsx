import { useState, useEffect } from 'react'
import { CalendarEvent, CalendarEventCoordinationType } from '../types'
import {
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
} from '../hooks/useCalendarEvents'
import { COLOR_PALETTE, DEFAULTS } from '../constants/theme'
import { CloseIcon } from './ui/Icons'

interface EventDetailSidebarProps {
  date: Date | null
  event: CalendarEvent | null
  isCreating: boolean
  events: CalendarEvent[]
  onClose: () => void
}

export function EventDetailSidebar({
  date,
  event,
  isCreating,
  events,
  onClose,
}: EventDetailSidebarProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [coordinationType, setCoordinationType] = useState<CalendarEventCoordinationType | ''>('')
  const [color, setColor] = useState<string>(DEFAULTS.eventColor)

  const createEvent = useCreateCalendarEvent()
  const updateEvent = useUpdateCalendarEvent()
  const deleteEvent = useDeleteCalendarEvent()

  // Initialize form when creating new event
  useEffect(() => {
    if (isCreating && date) {
      const dateStr = date.toISOString().split('T')[0]
      setTitle('')
      setDescription('')
      setStartDate(dateStr)
      setEndDate(dateStr)
      setCoordinationType('')
      setColor(DEFAULTS.eventColor)
    }
  }, [isCreating, date])

  // Initialize form when viewing existing event
  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description || '')
      setStartDate(event.start_date)
      setEndDate(event.end_date)
      setCoordinationType(event.coordination_type || '')
      setColor(event.color)
    }
  }, [event])

  const handleSave = async () => {
    if (!title.trim()) return

    try {
      if (isCreating) {
        await createEvent.mutateAsync({
          title,
          description,
          startDate,
          endDate,
          coordinationType: coordinationType || undefined,
          color,
        })
      } else if (event) {
        await updateEvent.mutateAsync({
          id: event.id,
          title,
          description,
          startDate,
          endDate,
          coordinationType: coordinationType || null,
          color,
        })
      }
      onClose()
    } catch (error) {
      console.error('Error saving event:', error)
    }
  }

  const handleDelete = async () => {
    if (!event) return
    if (!confirm('Delete this event?')) return

    try {
      await deleteEvent.mutateAsync(event.id)
      onClose()
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  // Get events for the selected date
  const dateEvents = date
    ? events.filter((e) => {
        const dateStr = date.toISOString().split('T')[0]
        return dateStr >= e.start_date && dateStr <= e.end_date
      })
    : []

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {isCreating ? 'New Event' : event ? 'Edit Event' : 'Events'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Creating or Editing Event */}
        {(isCreating || event) && (
          <div className="space-y-4">
            {/* Title (Konteks) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konteks (Title)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Coordination Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Koordinasi
              </label>
              <select
                value={coordinationType}
                onChange={(e) => setCoordinationType(e.target.value as CalendarEventCoordinationType | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select type...</option>
                <option value="synchronous">Synchronous</option>
                <option value="asynchronous">Asynchronous</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex gap-2">
                {COLOR_PALETTE.slice(0, 6).map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    className={`w-8 h-8 rounded-full transition ${
                      color === c.hex ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Description (Isi) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Isi (Description)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Event details..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              {event && (
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                >
                  Delete
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Viewing Date Events */}
        {!isCreating && !event && date && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
            </div>

            {dateEvents.length > 0 ? (
              <div className="space-y-3">
                {dateEvents.map((e) => (
                  <div
                    key={e.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => {
                      // Switch to edit mode for this event
                      // You can implement this by calling a prop function
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: e.color }}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{e.title}</h4>
                        {e.coordination_type && (
                          <span className="text-xs text-gray-500 capitalize">
                            {e.coordination_type}
                          </span>
                        )}
                        {e.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {e.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No events on this date.</p>
                <p className="text-sm mt-1">Double-click a date to create one!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
