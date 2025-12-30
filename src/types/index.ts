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

export interface Task {
  id: string
  board_id: string
  title: string
  description: string | null
  status: 'to_do' | 'in_progress' | 'done'
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
