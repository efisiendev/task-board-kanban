import { UserProfile } from './user.types'
import { BoardStatus } from './board.types'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  board_id: string
  title: string
  description: string | null
  status_id: string
  board_status?: BoardStatus // Joined from board_statuses
  order_index: number
  priority: TaskPriority | null
  assigned_to: string | null
  due_date: string | null
  start_date: string | null
  labels: string[] | null
  created_by: string | null
  estimated_time: number | null // in minutes
  actual_time: number | null // in minutes
  created_at: string
  updated_at: string
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  is_completed: boolean
  status_id: string
  order_index: number
  priority: TaskPriority | null
  assigned_to: string | null
  due_date: string | null
  labels: string[] | null
  estimated_time: number | null // in minutes
  actual_time: number | null // in minutes
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TaskAssignee {
  task_id: string
  user_id: string
  assigned_at: string
  assigned_by: string | null
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string | null
  comment: string
  created_at: string
  updated_at: string
}

export type TaskActivityAction =
  | 'created'
  | 'updated'
  | 'moved'
  | 'commented'
  | 'assigned'
  | 'completed'
  | 'reopened'

export interface TaskActivity {
  id: string
  task_id: string
  user_id: string | null
  action: TaskActivityAction
  details: Record<string, unknown> | null
  created_at: string
}

export interface TaskPage {
  id: string
  task_id: string
  title: string
  content: string | null // Markdown content
  order_index: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export type TaskRelationType = 'blocks' | 'blocked_by' | 'relates_to' | 'duplicates' | 'duplicate_of'

export interface TaskRelation {
  id: string
  from_task_id: string
  to_task_id: string
  relation_type: TaskRelationType
  created_by: string | null
  created_at: string
  from_task?: Task
  to_task?: Task
}

// Extended types with joined data
export interface TaskCommentWithProfile extends TaskComment {
  user_profiles?: UserProfile | null
}

export interface TaskActivityWithProfile extends TaskActivity {
  user_profiles?: UserProfile | null
}
