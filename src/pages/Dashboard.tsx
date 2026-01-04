import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoards, useCreateBoard, useUpdateBoard, useDeleteBoard } from '../hooks/useBoards'
import { useAuth } from '../hooks/useAuth'
import { MainLayout } from '../components/MainLayout'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { getRelativeTime } from '../utils/timeUtils'
import { useCalendarEventsByRange } from '../hooks/useCalendarEvents'
import { CalendarMonth } from '../components/CalendarMonth'
import { EventDetailSidebar } from '../components/EventDetailSidebar'
import { Edit } from 'lucide-react'
import { AlertTriangle } from '../lib/icons'
import { DEFAULTS } from '../constants/theme'
import { useToggle } from '../hooks/useToggle'
import { useCalendarSelection } from '../hooks/useCalendarSelection'
import { ColorPicker } from '../components/ui/ColorPicker'
import { Modal, ModalHeader, ModalContent, ModalFooter } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: boards = [], isLoading } = useBoards()
  const createBoardMutation = useCreateBoard()
  const updateBoardMutation = useUpdateBoard()
  const deleteBoardMutation = useDeleteBoard()
  const navigate = useNavigate()
  const [newBoardName, setNewBoardName] = useState('')
  const [newBoardDescription, setNewBoardDescription] = useState('')
  const [newBoardColor, setNewBoardColor] = useState<string>(DEFAULTS.boardColor)
  const showForm = useToggle()
  const [editingBoard, setEditingBoard] = useState<{ id: string; name: string; description: string | null; color: string } | null>(null)
  const [deletingBoard, setDeletingBoard] = useState<{ id: string; name: string } | null>(null)
  const [leavingBoard, setLeavingBoard] = useState<{ id: string; name: string; ownerEmail: string } | null>(null)

  // Calendar event states
  const calendar = useCalendarSelection()

  // Get current month events
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
  const { data: monthEvents = [] } = useCalendarEventsByRange(startOfMonth, endOfMonth)

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
      setNewBoardColor(DEFAULTS.boardColor)
      showForm.close()
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


  return (
    <MainLayout
      topBarContent={
        <div className="flex justify-between items-center w-full">
          <span className="text-sm text-gray-600 hidden md:inline">{user?.email}</span>
        </div>
      }
    >
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <main className="max-w-7xl mx-auto px-4 py-6 md:py-12 w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
          {!showForm.isOpen && (
            <button
              onClick={showForm.open}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
            >
              New Project
            </button>
          )}
        </div>

        {/* Current Month Calendar */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => navigate('/timeline')}
                className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View All Timeline
              </button>
            </div>
            <CalendarMonth
              monthName={new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long' })}
              year={currentYear}
              month={currentMonth}
              events={monthEvents}
              onDateClick={calendar.handleDateClick}
              onEventClick={calendar.handleEventClick}
              onCreateEvent={calendar.handleCreateEvent}
            />
          </div>
        </div>

        {/* New Project Form */}
        {showForm.isOpen && (
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
                <ColorPicker value={newBoardColor} onChange={setNewBoardColor} />
              </div>
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createBoardMutation.isPending}
                  variant="primary"
                  size="lg"
                >
                  Create Project
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    showForm.close()
                    setNewBoardName('')
                    setNewBoardDescription('')
                    setNewBoardColor(DEFAULTS.boardColor)
                  }}
                  variant="secondary"
                  size="lg"
                >
                  Cancel
                </Button>
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
                        <Edit className="w-4 h-4" />
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

        {/* Event Detail Sidebar */}
        {(calendar.selectedDate || calendar.selectedEvent) && (
          <EventDetailSidebar
            date={calendar.selectedDate}
            event={calendar.selectedEvent}
            isCreating={calendar.isCreatingEvent}
            events={monthEvents}
            onClose={calendar.handleClose}
            onEventClick={calendar.handleEventClick}
          />
        )}
      </div>

      {/* Delete Project Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingBoard}
        title="Delete Project?"
        icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
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
      <Modal isOpen={!!editingBoard} onClose={() => setEditingBoard(null)} size="lg">
        <ModalHeader title="Edit Project" onClose={() => setEditingBoard(null)} />
        <ModalContent>
          {editingBoard && (
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
                <ColorPicker
                  value={editingBoard.color}
                  onChange={(color) => setEditingBoard({ ...editingBoard, color })}
                />
              </div>
            </div>
          )}
        </ModalContent>
        <ModalFooter>
          <Button onClick={() => setEditingBoard(null)} variant="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleUpdateBoard}
            disabled={updateBoardMutation.isPending}
            variant="primary"
          >
            Save Changes
          </Button>
        </ModalFooter>
      </Modal>
    </MainLayout>
  )
}
