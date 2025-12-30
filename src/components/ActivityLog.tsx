import { useTaskActivity } from '../hooks/useTaskComments'
import { TaskActivityWithProfile } from '../types'

interface ActivityLogProps {
  taskId: string
}

interface ActivityItemProps {
  activity: TaskActivityWithProfile
}

function ActivityItem({ activity }: ActivityItemProps) {
  const userProfile = activity.user_profiles
  const userName = userProfile?.username || userProfile?.email || 'System'
  const userInitial = userName[0].toUpperCase()

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getActivityText = (action: string, details: Record<string, unknown> | null) => {
    switch (action) {
      case 'created':
        return 'created this task'
      case 'commented':
        return 'added a comment'
      case 'assigned':
        return details?.assigned_to ? 'assigned this task' : 'unassigned this task'
      case 'updated': {
        const changes: string[] = []
        const detailsObj = details as Record<string, { from?: string; to?: string }> | null
        if (detailsObj?.title) changes.push('changed title')
        if (detailsObj?.status) changes.push(`changed status to ${detailsObj.status.to}`)
        if (detailsObj?.priority) changes.push(`changed priority to ${detailsObj.priority.to}`)
        if (detailsObj?.due_date) changes.push('updated due date')
        return changes.length > 0 ? changes.join(', ') : 'updated this task'
      }
      case 'moved':
        return (details as { status?: string })?.status ? `moved to ${(details as { status: string }).status}` : 'moved this task'
      case 'completed':
        return 'completed this task'
      case 'reopened':
        return 'reopened this task'
      default:
        return action
    }
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created':
        return '✨'
      case 'commented':
        return '💬'
      case 'assigned':
        return '👤'
      case 'updated':
        return '📝'
      case 'moved':
        return '➡️'
      case 'completed':
        return '✅'
      case 'reopened':
        return '🔄'
      default:
        return '📌'
    }
  }

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
        {userInitial}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-700">
          <span className="font-medium">{userName}</span>{' '}
          <span className="text-gray-600">{getActivityText(activity.action, activity.details)}</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
          <span>{getActivityIcon(activity.action)}</span>
          <span>{formatTimestamp(activity.created_at)}</span>
        </div>

        {/* Show details if available */}
        {activity.details && Object.keys(activity.details).length > 0 && activity.action === 'updated' && (() => {
          const details = activity.details as Record<string, { from?: string; to?: string }>
          return (
            <div className="mt-1 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
              <div className="space-y-0.5">
                {details.title && (
                  <div>
                    <span className="font-medium">Title:</span> {String(details.title.from)} → {String(details.title.to)}
                  </div>
                )}
                {details.status && (
                  <div>
                    <span className="font-medium">Status:</span> {String(details.status.from)} → {String(details.status.to)}
                  </div>
                )}
                {details.priority && (
                  <div>
                    <span className="font-medium">Priority:</span> {details.priority.from || 'none'} → {String(details.priority.to)}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export function ActivityLog({ taskId }: ActivityLogProps) {
  const { data: activities = [], isLoading } = useTaskActivity(taskId)

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading activity...</div>
  }

  if (activities.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">No activity yet.</p>
  }

  return (
    <div className="space-y-4 max-h-64 overflow-y-auto">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  )
}
