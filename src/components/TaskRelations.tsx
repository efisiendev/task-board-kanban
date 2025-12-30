import { useState } from 'react'
import { TaskRelationType } from '../types'
import { useTaskRelations, useCreateTaskRelation, useDeleteTaskRelation } from '../hooks/useTaskRelations'
import { useTasks } from '../hooks/useTasks'

interface TaskRelationsProps {
  taskId: string
  boardId: string
}

const RELATION_TYPES: { value: TaskRelationType; label: string; emoji: string }[] = [
  { value: 'blocks', label: 'Blocks', emoji: '🚫' },
  { value: 'blocked_by', label: 'Blocked by', emoji: '⛔' },
  { value: 'relates_to', label: 'Relates to', emoji: '🔗' },
  { value: 'duplicates', label: 'Duplicates', emoji: '📋' },
  { value: 'duplicate_of', label: 'Duplicate of', emoji: '📄' },
]

export function TaskRelations({ taskId, boardId }: TaskRelationsProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [selectedRelationType, setSelectedRelationType] = useState<TaskRelationType>('relates_to')

  const { data: relationsData, isLoading } = useTaskRelations(taskId)
  const { data: allTasks = [] } = useTasks(boardId)
  const createRelation = useCreateTaskRelation()
  const deleteRelation = useDeleteTaskRelation()

  const availableTasks = allTasks.filter((t) => t.id !== taskId)

  const handleAddRelation = async () => {
    if (!selectedTaskId) return

    try {
      await createRelation.mutateAsync({
        fromTaskId: taskId,
        toTaskId: selectedTaskId,
        relationType: selectedRelationType,
      })
      setSelectedTaskId('')
      setIsAdding(false)
    } catch (error) {
      console.error('Failed to create relation:', error)
    }
  }

  const handleDeleteRelation = async (relationId: string, fromTaskId: string, toTaskId: string) => {
    try {
      await deleteRelation.mutateAsync({ id: relationId, fromTaskId, toTaskId })
    } catch (error) {
      console.error('Failed to delete relation:', error)
    }
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading relations...</div>
  }

  const { outgoing = [], incoming = [] } = relationsData || {}

  return (
    <div className="space-y-4">
      {/* Existing Relations */}
      {(outgoing.length > 0 || incoming.length > 0) && (
        <div className="space-y-2">
          {/* Outgoing relations */}
          {outgoing.map((relation) => {
            const relationType = RELATION_TYPES.find((rt) => rt.value === relation.relation_type)
            return (
              <div
                key={relation.id}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm">{relationType?.emoji}</span>
                  <span className="text-xs text-gray-500">{relationType?.label}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {relation.to_task?.title || 'Unknown task'}
                  </span>
                  {relation.to_task?.status && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        relation.to_task.status === 'done'
                          ? 'bg-green-100 text-green-700'
                          : relation.to_task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {relation.to_task.status.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteRelation(relation.id, relation.from_task_id, relation.to_task_id)}
                  className="text-gray-400 hover:text-red-600 transition"
                  title="Remove relation"
                >
                  ×
                </button>
              </div>
            )
          })}

          {/* Incoming relations */}
          {incoming.map((relation) => {
            const relationType = RELATION_TYPES.find((rt) => rt.value === relation.relation_type)
            return (
              <div
                key={relation.id}
                className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm">{relationType?.emoji}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {relation.from_task?.title || 'Unknown task'}
                  </span>
                  <span className="text-xs text-gray-500">{relationType?.label} this task</span>
                  {relation.from_task?.status && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        relation.from_task.status === 'done'
                          ? 'bg-green-100 text-green-700'
                          : relation.from_task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {relation.from_task.status.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteRelation(relation.id, relation.from_task_id, relation.to_task_id)}
                  className="text-gray-400 hover:text-red-600 transition"
                  title="Remove relation"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {outgoing.length === 0 && incoming.length === 0 && !isAdding && (
        <div className="text-center py-6 text-gray-400 text-sm">
          <svg
            className="w-12 h-12 mx-auto mb-2 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          No linked tasks yet
        </div>
      )}

      {/* Add relation form */}
      {isAdding ? (
        <div className="border border-gray-200 rounded-lg p-3 space-y-3">
          <div className="flex gap-2">
            <select
              value={selectedRelationType}
              onChange={(e) => setSelectedRelationType(e.target.value as TaskRelationType)}
              className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RELATION_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.emoji} {rt.label}
                </option>
              ))}
            </select>

            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a task...</option>
              {availableTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setIsAdding(false)
                setSelectedTaskId('')
              }}
              className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRelation}
              disabled={!selectedTaskId || createRelation.isPending}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {createRelation.isPending ? 'Adding...' : 'Add Link'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full px-3 py-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-700 transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add linked task
        </button>
      )}
    </div>
  )
}
