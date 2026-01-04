import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { UserProfile } from '../../types'

/**
 * Batch fetch user profiles for multiple user IDs
 * This prevents N+1 queries when rendering lists of tasks with assignees
 */
export function useBatchUserProfiles(userIds: (string | null)[]) {
  // Filter out nulls and duplicates
  const uniqueUserIds = Array.from(new Set(userIds.filter((id): id is string => id !== null)))

  return useQuery({
    queryKey: ['user-profiles-batch', uniqueUserIds.sort().join(',')],
    queryFn: async () => {
      if (uniqueUserIds.length === 0) {
        return []
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', uniqueUserIds)

      if (error) throw error
      return data as UserProfile[]
    },
    enabled: uniqueUserIds.length > 0,
    staleTime: 1000 * 60 * 5, // User profiles rarely change - 5 minutes
  })
}

/**
 * Helper hook to get a single profile from batched data
 * Use this in individual components after prefetching batch at parent level
 */
export function useProfileFromBatch(userId: string | null, batchedProfiles: UserProfile[] | undefined) {
  if (!userId || !batchedProfiles) return null
  return batchedProfiles.find(p => p.user_id === userId) || null
}
