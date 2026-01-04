import { useUserProfile } from '../../hooks/useUsers'

interface CreatorFieldProps {
  value: string | null
}

export function CreatorField({ value }: CreatorFieldProps) {
  const { data: creatorProfile } = useUserProfile(value || null)

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      {creatorProfile ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
            {creatorProfile.email[0].toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-900 font-medium">
              {creatorProfile.email}
            </span>
            {creatorProfile.employee_number && (
              <span className="text-xs text-gray-500">
                {creatorProfile.employee_number}
              </span>
            )}
          </div>
        </div>
      ) : (
        <span className="text-sm text-gray-400">Unknown</span>
      )}
    </div>
  )
}
