import { useState } from 'react'
import { useUsers } from '../hooks/useUsers'

interface UserSelectorProps {
  value: string | null
  onChange: (userId: string) => void
  placeholder?: string
}

export default function UserSelector({ value, onChange, placeholder }: UserSelectorProps) {
  const { data: users = [], isLoading } = useUsers()
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const selectedUser = users.find((u) => u.user_id === value)

  const filteredUsers = users.filter((user) => {
    const search = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(search) ||
      user.username?.toLowerCase().includes(search) ||
      user.employee_number?.toLowerCase().includes(search) ||
      user.division?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer bg-white"
      >
        {selectedUser ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
              {selectedUser.email[0].toUpperCase()}
            </div>
            <div className="flex-1 text-sm">
              <span className="font-medium">{selectedUser.email}</span>
              {selectedUser.employee_number && (
                <span className="text-gray-500"> - {selectedUser.employee_number}</span>
              )}
              {selectedUser.division && (
                <span className="text-gray-500"> - {selectedUser.division}</span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder || 'Select user...'}</span>
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email, name, number, or division..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto max-h-48">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500 text-sm">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {searchQuery ? 'No users found' : 'No users available'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    onClick={() => {
                      onChange(user.user_id)
                      setIsOpen(false)
                      setSearchQuery('')
                    }}
                    className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      value === user.user_id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500 flex gap-2">
                          {user.username && <span>{user.username}</span>}
                          {user.employee_number && <span>#{user.employee_number}</span>}
                          {user.division && <span>• {user.division}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
