export interface Board {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  board_id: string
  title: string
  description: string | null
  status: 'to_do' | 'in_progress' | 'done'
  order_index: number
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
}
