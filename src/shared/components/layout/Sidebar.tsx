import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useBoards } from '../../../features/boards/hooks/useBoards'
import { Board } from '../../../types'
import { Kanban, LogOut } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  currentBoardId?: string
}

export function Sidebar({ isOpen, onClose, currentBoardId }: SidebarProps) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { data: boards = [] } = useBoards()

  const handleNavigate = (path: string) => {
    navigate(path)
    onClose() // Close sidebar on mobile after navigation
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
    onClose()
  }

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <>
      {/* Backdrop - Close on click outside */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold text-sm">
              {user?.email ? getUserInitials(user.email) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            {/* Close button (mobile only) */}
            <button
              onClick={onClose}
              className="md:hidden text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Timeline */}
          <div className="mb-4">
            <button
              onClick={() => handleNavigate('/timeline')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                window.location.pathname === '/timeline'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Timeline</span>
            </button>
          </div>

          {/* Boards Section */}
          <div className="mb-4">
            <div className="mb-2 px-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                My Projects
              </h3>
            </div>
            <nav className="space-y-1">
              {boards.length === 0 ? (
                <p className="text-sm text-gray-400 px-2 py-2">No projects yet</p>
              ) : (
                boards.map((board: Board) => (
                  <button
                    key={board.id}
                    onClick={() => handleNavigate(`/board/${board.id}`)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentBoardId === board.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 pl-2'
                        : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent pl-2'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Kanban className="w-4 h-4" />
                      <span className="truncate flex-1">{board.name}</span>
                    </div>
                  </button>
                ))
              )}
            </nav>
          </div>

          {/* Quick Actions */}
          <div className="mb-4">
            <button
              onClick={() => handleNavigate('/dashboard')}
              className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span>
              New Project
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
