import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoards, useCreateBoard, useDeleteBoard } from '../hooks/useBoards'
import { useAuth } from '../hooks/useAuth'
import { Sidebar } from '../components/Sidebar'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { data: boards = [], isLoading } = useBoards()
  const createBoardMutation = useCreateBoard()
  const deleteBoardMutation = useDeleteBoard()
  const navigate = useNavigate()
  const [newBoardName, setNewBoardName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardName.trim()) return

    try {
      await createBoardMutation.mutateAsync(newBoardName)
      setNewBoardName('')
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create board:', error)
    }
  }

  const handleDeleteBoard = async (id: string) => {
    if (confirm('Are you sure you want to delete this board? All tasks will be deleted.')) {
      try {
        await deleteBoardMutation.mutateAsync(id)
      } catch (error) {
        console.error('Failed to delete board:', error)
      }
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 md:gap-4">
                {/* Hamburger Menu Button - Visible on all screens */}
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  aria-label="Toggle sidebar"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-xl md:text-3xl font-bold text-gray-900 hover:text-blue-600 transition"
                >
                  TaskFlow
                </button>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <span className="hidden md:inline text-sm md:text-base text-gray-600">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition text-sm md:text-base"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6 md:py-12 w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
            >
              New Board
            </button>
          )}
        </div>

        {/* New Board Form */}
        {showForm && (
          <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200">
            <form onSubmit={handleCreateBoard} className="flex gap-4">
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Board name..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={createBoardMutation.isPending}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Boards Grid */}
        {isLoading ? (
          <div className="text-center text-gray-600">Loading boards...</div>
        ) : boards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">No boards yet — create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => navigate(`/board/${board.id}`)}
                className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition cursor-pointer"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{board.name}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(board.created_at).toLocaleDateString()}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteBoard(board.id)
                  }}
                  className="mt-4 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
        </main>
      </div>
    </div>
  )
}
