import { useState } from 'react'
import { useTaskComments, useCreateComment, useDeleteComment, useUpdateComment } from '../hooks/useTaskComments'
import { supabase } from '../lib/supabase'
import { TaskCommentWithProfile } from '../types'

interface TaskCommentsProps {
  taskId: string
}

interface CommentItemProps {
  comment: TaskCommentWithProfile
  isOwn: boolean
  onDelete: (id: string) => void
  onUpdate: (id: string, text: string) => void
}

function CommentItem({ comment, isOwn, onDelete, onUpdate }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(comment.comment)

  const handleSave = () => {
    if (editValue.trim() && editValue !== comment.comment) {
      onUpdate(comment.id, editValue.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(comment.comment)
    setIsEditing(false)
  }

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

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const userProfile = comment.user_profiles
  const userName = userProfile?.username || userProfile?.email || 'Unknown'
  const userInitial = userName[0].toUpperCase()

  return (
    <div className="flex gap-3 group">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
        {userInitial}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-gray-900">{userName}</span>
          <span className="text-xs text-gray-500">{formatTimestamp(comment.created_at)}</span>
        </div>

        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.comment}</p>
            {isOwn && (
              <div className="flex gap-3 mt-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-gray-500 hover:text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this comment?')) {
                      onDelete(comment.id)
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const { data: comments = [], isLoading } = useTaskComments(taskId)
  const createComment = useCreateComment()
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()

  // Get current user ID
  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null)
    })
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await createComment.mutateAsync({ taskId, comment: newComment.trim() })
      setNewComment('')
    } catch (error) {
      console.error('Failed to create comment:', error)
    }
  }

  const handleUpdate = (id: string, text: string) => {
    updateComment.mutate({ id, taskId, comment: text })
  }

  const handleDelete = (id: string) => {
    deleteComment.mutate({ id, taskId })
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading comments...</div>
  }

  return (
    <div className="space-y-4">
      {/* Comments list */}
      <div className="space-y-4 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOwn={comment.user_id === currentUserId}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="border-t pt-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!newComment.trim() || createComment.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createComment.isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  )
}
