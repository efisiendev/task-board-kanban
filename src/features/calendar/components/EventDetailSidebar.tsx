import { useState, useEffect } from 'react'
import { CalendarEvent, CalendarEventCoordinationType } from '../../../types'
import {
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
} from '../hooks/useCalendarEvents'
import { useBoards } from '../../boards/hooks/useBoards'
import { useAuth } from '../../../shared/hooks/useAuth'
import { DEFAULTS } from '../../../constants/theme'
import { Folder } from 'lucide-react'
import { Globe } from '../../../lib/icons'
import { CloseIcon } from '../../../shared/components/ui/Icons'
import { ColorPicker } from '../../../shared/components/ui/ColorPicker'
import { Button } from '../../../shared/components/ui/Button'

interface EventDetailSidebarProps {
  date: Date | null
  event: CalendarEvent | null
  isCreating: boolean
  events: CalendarEvent[]
  onClose: () => void
  onEventClick: (event: CalendarEvent) => void
}

export function EventDetailSidebar({
  date,
  event,
  isCreating,
  events,
  onClose,
  onEventClick,
}: EventDetailSidebarProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [coordinationType, setCoordinationType] = useState<CalendarEventCoordinationType | ''>('')
  const [color, setColor] = useState<string>(DEFAULTS.eventColor)
  const [boardId, setBoardId] = useState<string>('')

  const { data: boards = [] } = useBoards()
  const { user } = useAuth()
  const createEvent = useCreateCalendarEvent()
  const updateEvent = useUpdateCalendarEvent()
  const deleteEvent = useDeleteCalendarEvent()

  // Check if current user is owner of the event
  const isOwner = event ? event.created_by === user?.id : true

  // Initialize form when creating new event
  useEffect(() => {
    if (isCreating && date) {
      // Use local date to avoid timezone issues
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      setTitle('')
      setDescription('')
      setStartDate(dateStr)
      setEndDate(dateStr)
      setCoordinationType('')
      setColor(DEFAULTS.eventColor)
      setBoardId('') // Default to public event
    }
  }, [isCreating, date])

  // Initialize form when viewing date (not creating, not editing event)
  useEffect(() => {
    if (!isCreating && !event && date) {
      // Set default dates to the clicked date
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      setStartDate(dateStr)
      setEndDate(dateStr)
    }
  }, [date, isCreating, event])

  // Initialize form when viewing existing event
  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description || '')
      setStartDate(event.start_date)
      setEndDate(event.end_date)
      setCoordinationType(event.coordination_type || '')
      setColor(event.color)
      setBoardId(event.board_id || '')
    }
  }, [event])

  const handleSave = async () => {
    if (!title.trim()) return

    console.log('Saving event...', { title, startDate, endDate, boardId, coordinationType })

    try {
      if (event) {
        // Editing existing event
        console.log('Updating existing event:', event.id)
        await updateEvent.mutateAsync({
          id: event.id,
          title,
          description,
          startDate,
          endDate,
          coordinationType: coordinationType || null,
          boardId: boardId || null,
          color,
        })
        console.log('Event updated successfully')
        onClose()
      } else {
        // Creating new event (works in both isCreating mode and viewing mode)
        console.log('Creating new event...')
        const result = await createEvent.mutateAsync({
          title,
          description,
          startDate,
          endDate,
          coordinationType: coordinationType || undefined,
          boardId: boardId || undefined, // null = public event, value = board-specific
          color,
        })
        console.log('Event created successfully:', result)
        // Reset form after create (don't close sidebar)
        setTitle('')
        setDescription('')
        setCoordinationType('')
        setColor(DEFAULTS.eventColor)
        setBoardId('')
        // Keep the dates as-is so user can create another event on same date
      }
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
        // Use local date components to avoid timezone issues
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        
        // Check if the selected date falls within the event's date range
        const matches = e.start_date <= dateStr && dateStr <= e.end_date
        console.log('Filter debug:', {
          eventTitle: e.title,
          eventStartDate: e.start_date,
          eventEndDate: e.end_date,
          selectedDate: dateStr,
          matches,
        })
        return matches
      })
    : []

  // Format date for logging
  const logDateStr = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : null
  console.log('Date events for', logDateStr, ':', dateEvents.length, 'events')

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {isCreating ? 'New Event' : event ? (isOwner ? 'Edit Event' : 'View Event') : 'Events'}
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
                disabled={!!(event && !isOwner)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={!!(event && !isOwner)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select type...</option>
                <option value="synchronous">Synchronous</option>
                <option value="asynchronous">Asynchronous</option>
              </select>
            </div>

            {/* Visibility - Link to Board */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
                disabled={!!(event && !isOwner)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Public (visible to all users)</option>
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name} (members only)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {boardId ? 'Only board members can see this event' : 'All users can see this event'}
              </p>
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
                  onChange={(e) => {
                    const newStartDate = e.target.value
                    setStartDate(newStartDate)
                    // Auto-adjust end date if it's before the new start date
                    if (endDate && newStartDate > endDate) {
                      setEndDate(newStartDate)
                    }
                  }}
                  disabled={!!(event && !isOwner)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  min={startDate}
                  disabled={!!(event && !isOwner)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <ColorPicker value={color} onChange={setColor} size="sm" disabled={!!(event && !isOwner)} />
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
                disabled={!!(event && !isOwner)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Actions */}
            {/* Actions */}
            {isOwner && (
              <div className="flex gap-2 pt-4">
                {event && (
                  <Button onClick={handleDelete} variant="danger" className="flex-1">
                    Delete
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={!title.trim()}
                  variant="primary"
                  className="flex-1"
                >
                  {isCreating ? 'Create' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Viewing Date Events with Create Form */}
        {!isCreating && !event && date && (
          <div className="space-y-6">
            {/* Date Header */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
            </div>

            {/* Existing Events List */}
            {dateEvents.length > 0 && (
              <div className="space-y-3 pb-6 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">Events on this date:</h4>
                {dateEvents.map((e) => (
                  <div
                    key={e.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => onEventClick(e)}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: e.color }}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{e.title}</h4>
                        {e.board && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Folder className="w-3 h-3" /> {e.board.name}
                          </span>
                        )}
                        {!e.board_id && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Public
                          </span>
                        )}
                        {e.coordination_type && (
                          <span className="text-xs text-gray-500 capitalize ml-2">
                            • {e.coordination_type}
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
            )}

            {/* Create New Event Form - Always visible at bottom */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Create New Event</h4>

              {/* Title */}
              <div>
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
                <select
                  value={coordinationType}
                  onChange={(e) => setCoordinationType(e.target.value as CalendarEventCoordinationType | '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Coordination type...</option>
                  <option value="synchronous">Synchronous</option>
                  <option value="asynchronous">Asynchronous</option>
                </select>
              </div>

              {/* Visibility - Link to Board */}
              <div>
                <select
                  value={boardId}
                  onChange={(e) => setBoardId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Public (visible to all users)</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name} (members only)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const newStartDate = e.target.value
                    setStartDate(newStartDate)
                    // Auto-adjust end date if it's before the new start date
                    if (endDate && newStartDate > endDate) {
                      setEndDate(newStartDate)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Color */}
              <div>
                <ColorPicker value={color} onChange={setColor} size="sm" />
              </div>

              {/* Description */}
              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event details..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Create Button */}
              <Button
                onClick={handleSave}
                disabled={!title.trim()}
                variant="primary"
                className="w-full"
              >
                Create Event
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  )
}
