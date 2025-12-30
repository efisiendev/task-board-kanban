import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { UserProfile } from '../types'

export interface UserWithEmail {
  user_id: string
  email: string
  username: string | null
  employee_number: string | null
  division: string | null
  department: string | null
  position: string | null
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // First, get all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('username', { ascending: true })

      if (profilesError) throw profilesError

      // Get user emails from auth.users
      // Note: We need to fetch this via a function or edge function
      // For now, we'll return profiles with a placeholder for email
      // In production, you'd create a database function or use Supabase Admin API

      return (profiles || []) as UserProfile[]
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // Return null if profile doesn't exist yet
        if (error.code === 'PGRST116') return null
        throw error
      }

      return data as UserProfile
    },
    enabled: !!userId,
  })
}
