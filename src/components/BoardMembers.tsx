import { useState } from 'react'
import { useBoardMembers, useAddBoardMember, useRemoveBoardMember } from '../hooks/useBoardMembers'
import UserSelector from './UserSelector'
import { BoardMemberRole } from '../types'

interface BoardMembersProps {
  boardId: string
  isOwner: boolean
}

export default function BoardMembers({ boardId, isOwner }: BoardMembersProps) {
  const { data: members = [], isLoading } = useBoardMembers(boardId)
  const addMemberMutation = useAddBoardMember()
  const removeMemberMutation = useRemoveBoardMember()
  const [showInvite, setShowInvite] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<BoardMemberRole>('member')

  const handleAddMember = async () => {
    if (!selectedUserId) return

    try {
      await addMemberMutation.mutateAsync({
        boardId,
        userId: selectedUserId,
        role: selectedRole,
      })
      setSelectedUserId('')
      setShowInvite(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add member'
      alert(errorMessage)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member from the board?')) return

    try {
      await removeMemberMutation.mutateAsync({ boardId, memberId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove member'
      alert(errorMessage)
    }
  }

  // Note: UserSelector handles filtering of already-added members internally

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Board Members ({members.length})</h3>
        {isOwner && (
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition"
          >
            + Invite Member
          </button>
        )}
      </div>

      {/* Invite Form */}
      {showInvite && isOwner && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
              <UserSelector
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="Choose a user to invite..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as BoardMemberRole)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="admin">Admin - Full access</option>
                <option value="member">Member - Can edit tasks</option>
                <option value="viewer">Viewer - Read only</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddMember}
                disabled={!selectedUserId || addMemberMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50"
              >
                {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
              </button>
              <button
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center text-gray-500 py-4">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No members yet</div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">
                  {member.user_profiles?.email[0].toUpperCase() || '?'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {member.user_profiles?.email || 'Unknown User'}
                  </div>
                  <div className="text-sm text-gray-500 flex gap-2">
                    {member.user_profiles?.employee_number && (
                      <span>#{member.user_profiles.employee_number}</span>
                    )}
                    {member.user_profiles?.division && (
                      <span>• {member.user_profiles.division}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    member.role === 'owner'
                      ? 'bg-purple-100 text-purple-800'
                      : member.role === 'admin'
                      ? 'bg-blue-100 text-blue-800'
                      : member.role === 'member'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {member.role}
                </span>
                {isOwner && member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={removeMemberMutation.isPending}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
