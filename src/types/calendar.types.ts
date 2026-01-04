import { Board } from './board.types'
import { Task } from './task.types'

export type CalendarEventCoordinationType = 'synchronous' | 'asynchronous'

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  start_date: string // ISO date string
  end_date: string // ISO date string
  coordination_type: CalendarEventCoordinationType | null
  board_id: string | null
  task_id: string | null
  color: string
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined data (optional)
  board?: Board
  task?: Task
}
