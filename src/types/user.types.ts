export interface User {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
}

export interface UserProfile {
  user_id: string
  email: string
  username: string | null
  employee_number: string
  full_name: string | null
  department: string | null
  position: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UserWithProfile extends User {
  profile?: UserProfile
}
