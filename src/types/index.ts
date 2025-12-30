export interface Board {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export type BoardMemberRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface BoardMember {
  id: string
  board_id: string
  user_id: string
  role: BoardMemberRole
  invited_by: string | null
  joined_at: string
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface BoardStatus {
  id: string
  board_id: string
  name: string
  color: string
  order_index: number
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  board_id: string
  title: string
  description: string | null
  status: 'to_do' | 'in_progress' | 'done' // Legacy field, kept for backward compatibility
  status_id: string
  board_status?: BoardStatus // Joined from board_statuses
  order_index: number
  // New properties
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

export interface User {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
}

export interface UserProfile {
  user_id: string
  email: string
  username: string
  employee_number: string
  division: string | null
  department: string | null
  position: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UserWithProfile extends User {
  profile?: UserProfile
}

export type SubtaskStatus = 'todo' | 'in_progress' | 'done'

export interface TaskChecklistItem {
  id: string
  task_id: string
  title: string
  is_completed: boolean
  status: SubtaskStatus
  order_index: number
  // Properties (same as Task)
  priority: TaskPriority | null
  assigned_to: string | null
  due_date: string | null
  labels: string[] | null
  estimated_time: number | null // in minutes
  actual_time: number | null // in minutes
  created_at: string
  updated_at: string
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
  content: string | null
  content_type: 'html' | 'json'
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
