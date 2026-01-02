import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoards, useCreateBoard, useUpdateBoard, useDeleteBoard } from '../hooks/useBoards'
import { useAuth } from '../hooks/useAuth'
import { Sidebar } from '../components/Sidebar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { getRelativeTime } from '../utils/timeUtils'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { data: boards = [], isLoading } = useBoards()
  const createBoardMutation = useCreateBoard()
  const updateBoardMutation = useUpdateBoard()
  const deleteBoardMutation = useDeleteBoard()
  const navigate = useNavigate()
  const [newBoardName, setNewBoardName] = useState('')
  const [newBoardDescription, setNewBoardDescription] = useState('')
  const [newBoardColor, setNewBoardColor] = useState('#3B82F6') // Default blue
  const [showForm, setShowForm] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [editingBoard, setEditingBoard] = useState<{ id: string; name: string; description: string | null; color: string } | null>(null)
  const [deletingBoard, setDeletingBoard] = useState<{ id: string; name: string } | null>(null)
  const [leavingBoard, setLeavingBoard] = useState<{ id: string; name: string; ownerEmail: string } | null>(null)

  // Predefined color options
  const colorOptions = [
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Purple', hex: '#8B5CF6' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Orange', hex: '#F59E0B' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Indigo', hex: '#6366F1' },
    { name: 'Teal', hex: '#14B8A6' },
  ]

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBoardName.trim()) return

    try {
      await createBoardMutation.mutateAsync({ 
        name: newBoardName, 
        description: newBoardDescription.trim() || undefined,
        color: newBoardColor 
      })
      setNewBoardName('')
      setNewBoardDescription('')
      setNewBoardColor('#3B82F6')
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const handleUpdateBoard = async () => {
    if (!editingBoard) return
    try {
      await updateBoardMutation.mutateAsync({
        id: editingBoard.id,
        name: editingBoard.name,
        description: editingBoard.description,
        color: editingBoard.color,
      })
      setEditingBoard(null)
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const handleDeleteBoard = async () => {
    if (!deletingBoard) return
    try {
      await deleteBoardMutation.mutateAsync(deletingBoard.id)
      setDeletingBoard(null)
    } catch (error) {
      console.error('Failed to delete board:', error)
    }
  }

  const handleLeaveBoard = async () => {
    if (!leavingBoard) return
    try {
      // TODO: Implement leave board API
      alert('Leave board functionality will be implemented soon')
      setLeavingBoard(null)
    } catch (error) {
      console.error('Failed to leave board:', error)
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
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
            >
              New Project
            </button>
          )}
        </div>

        {/* New Project Form */}
        {showForm && (
          <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200">
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Knowledge</label>
                <textarea
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  placeholder="Project documentation, notes, or knowledge base..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Color</label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setNewBoardColor(color.hex)}
                      className={`w-10 h-10 rounded-lg transition ${
                        newBoardColor === color.hex
                          ? 'ring-2 ring-offset-2 ring-gray-900'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={createBoardMutation.isPending}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setNewBoardName('')
                    setNewBoardDescription('')
                    setNewBoardColor('#3B82F6')
                  }}
                  className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center text-gray-600">Loading projects...</div>
        ) : boards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">No projects yet — create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => {
              const isOwner = board.user_id === user?.id
              return (
                <div
                  key={board.id}
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="group relative p-6 bg-white rounded-lg border-2 hover:shadow-lg transition cursor-pointer overflow-hidden"
                  style={{ borderColor: board.color }}
                >
                  {/* Color indicator bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: board.color }}
                  />

                  <div className="flex items-start gap-3 mb-3">
                    {/* Color dot */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: board.color }}
                    />
                    <h3 className="text-xl font-semibold text-gray-900 flex-1">{board.name}</h3>
                    {/* Edit icon - only show for owners */}
                    {isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingBoard({
                            id: board.id,
                            name: board.name,
                            description: board.description,
                            color: board.color
                          })
                        }}
                        className="text-gray-400 hover:text-blue-600 transition"
                        title="Edit project"
                      >
                        ✏️
                      </button>
                    )}
                  </div>

                  {/* Knowledge snippet */}
                  {board.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {board.description}
                    </p>
                  )}

                  {/* Owner/Member badge */}
                  <p className="text-sm text-gray-600 mb-2">
                    {isOwner ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">Owner:</span> You
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">Shared by:</span> {board.user_profiles?.email || 'Unknown'}
                      </span>
                    )}
                  </p>

                  {/* Last updated */}
                  <p className="text-sm text-gray-500 mb-4">
                    Updated {getRelativeTime(board.updated_at)}
                  </p>

                  {/* Action button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isOwner) {
                        setDeletingBoard({ id: board.id, name: board.name })
                      } else {
                        setLeavingBoard({
                          id: board.id,
                          name: board.name,
                          ownerEmail: board.user_profiles?.email || 'Unknown'
                        })
                      }
                    }}
                    className={`text-sm font-medium ${
                      isOwner
                        ? 'text-red-600 hover:text-red-800'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {isOwner ? 'Delete' : 'Leave'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
        </main>
      </div>

      {/* Delete Project Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingBoard}
        title="Delete Project?"
        icon="⚠️"
        message={
          <div className="space-y-2">
            <p>This will <strong>permanently delete</strong>:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Project "<strong>{deletingBoard?.name}</strong>"</li>
              <li>All tasks and subtasks</li>
              <li>All files & folders</li>
              <li>All comments and activity history</li>
            </ul>
            <p className="text-red-600 font-medium mt-3">
              This action cannot be undone.
            </p>
          </div>
        }
        confirmText="Delete Project"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        requireTextConfirm={true}
        textToConfirm={deletingBoard?.name || ''}
        onConfirm={handleDeleteBoard}
        onCancel={() => setDeletingBoard(null)}
      />

      {/* Leave Project Confirmation */}
      <ConfirmDialog
        isOpen={!!leavingBoard}
        title="Leave Project?"
        message={
          <div className="space-y-3">
            <p>You will lose access to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Project "<strong>{leavingBoard?.name}</strong>"</li>
              <li>All tasks and discussions</li>
              <li>All files & folders</li>
            </ul>
            <p className="text-gray-600 mt-3">
              The owner (<strong>{leavingBoard?.ownerEmail}</strong>) can re-invite you later.
            </p>
          </div>
        }
        confirmText="Leave Project"
        confirmButtonClass="bg-gray-600 hover:bg-gray-700"
        onConfirm={handleLeaveBoard}
        onCancel={() => setLeavingBoard(null)}
      />

      {/* Edit Project Modal */}
      {editingBoard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={editingBoard.name}
                  onChange={(e) => setEditingBoard({ ...editingBoard, name: e.target.value })}
                  placeholder="Enter project name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Knowledge</label>
                <textarea
                  value={editingBoard.description || ''}
                  onChange={(e) => setEditingBoard({ ...editingBoard, description: e.target.value })}
                  placeholder="Project documentation, notes, or knowledge base..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Color</label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setEditingBoard({ ...editingBoard, color: color.hex })}
                      className={`w-10 h-10 rounded-lg transition ${
                        editingBoard.color === color.hex
                          ? 'ring-2 ring-offset-2 ring-gray-900'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setEditingBoard(null)}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateBoard}
                  disabled={updateBoardMutation.isPending}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
