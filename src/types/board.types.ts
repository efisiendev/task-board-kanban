import { UserProfile } from './user.types'

export interface Board {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
  user_profiles?: {
    email: string
  }
}

export type BoardMemberRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface BoardMember {
  id: string
  board_id: string
  user_id: string
  role: BoardMemberRole
  created_at: string
  updated_at: string
}

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

export type BoardPageType = 'folder' | 'page' | 'file'

export interface BoardPage {
  id: string
  board_id: string
  parent_id: string | null
  title: string
  content: string | null
  type: BoardPageType
  position: number
  created_by: string | null
  created_at: string
  updated_at: string
  // File-specific fields (only for type='file')
  storage_path?: string | null
  mime_type?: string | null
  file_size?: number | null
}

// Extended types with joined data
export interface BoardMemberWithProfile extends BoardMember {
  user_profiles?: UserProfile | null
}
