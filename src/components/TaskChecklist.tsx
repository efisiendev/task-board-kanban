
import { TaskChecklistItem } from '../types'
import { useTaskChecklist } from '../hooks/useTaskChecklist'
import { useBoardStatuses } from '../hooks/useBoardStatuses'

interface TaskChecklistProps {
  taskId: string
  boardId: string
}

export function TaskChecklist({ taskId, boardId }: TaskChecklistProps) {
  const { data: items = [], isLoading } = useTaskChecklist(taskId)
  const { data: boardStatuses = [] } = useBoardStatuses(boardId)

  if (isLoading) {
    return <div className="p-4 text-gray-500">Loading...</div>
  }

  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>No subtasks yet.</p>
        <p className="text-xs mt-2">Add subtasks to break down this task into smaller pieces</p>
      </div>
    )
  }

  // Group items by status_id
  const itemsByStatusId = items.reduce((acc, item) => {
    const statusId = item.status_id
    if (!acc[statusId]) acc[statusId] = []
    acc[statusId].push(item)
    return acc
  }, {} as Record<string, TaskChecklistItem[]>)

  return (
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Subtasks ({items.length})</h3>

      {/* Render columns for each board status */}
      <div className="grid grid-cols-3 gap-4">
        {boardStatuses.map((status) => {
          const statusItems = itemsByStatusId[status.id] || []
          const colorClass = status.color.startsWith('bg-') ? status.color : ''
          const colorStyle = status.color.startsWith('#') ? { backgroundColor: status.color } : {}

          return (
            <div key={status.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-3 h-3 rounded-full ${colorClass}`}
                  style={colorStyle}
                />
                <h4 className="font-medium text-sm text-gray-700">{status.name}</h4>
                <span className="text-xs text-gray-500">({statusItems.length})</span>
              </div>

              <div className="space-y-2">
                {statusItems.map((item) => (
                  <div key={item.id} className="bg-white p-2 rounded border border-gray-200 text-sm">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        readOnly
                        className="mt-0.5 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.title}</div>
                        {item.priority && (
                          <div className="text-xs text-gray-500 mt-1">
                            Priority: {item.priority}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {statusItems.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-4">No items</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
