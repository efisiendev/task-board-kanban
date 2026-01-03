import { useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'

interface MainLayoutProps {
  children: ReactNode
  currentBoardId?: string
  topBarContent?: ReactNode
}

export function MainLayout({ children, currentBoardId, topBarContent }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Global Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentBoardId={currentBoardId}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Global Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          {/* Menu Button - Opens Sidebar */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-600 hover:text-gray-900 transition flex-shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* EMA Logo - Navigate to Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xl font-bold text-gray-900 hover:text-blue-600 transition flex-shrink-0"
          >
            EMA
          </button>

          {/* Custom Top Bar Content */}
          {topBarContent && <div className="flex-1 min-w-0">{topBarContent}</div>}
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
