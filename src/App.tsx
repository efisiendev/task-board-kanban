import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Boards from './pages/Boards'
import Board from './pages/Board'
import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/boards" element={<ProtectedRoute><Boards /></ProtectedRoute>} />
          <Route path="/boards/:boardId" element={<ProtectedRoute><Board /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/boards" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default App
