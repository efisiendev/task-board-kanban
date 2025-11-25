import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signUp, signIn, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (showForgotPassword) {
        const { error } = await resetPassword(email)
        if (error) throw error
        setSuccess('Password reset email sent! Check your inbox.')
        setEmail('')
        setTimeout(() => {
          setShowForgotPassword(false)
          setSuccess('')
        }, 3000)
      } else if (isSignUp) {
        const { error } = await signUp(email, password)
        if (error) throw error
        navigate('/boards')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/boards')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">TaskFlow</h1>
        <p className="text-center text-gray-600 mb-8">Real-time collaboration for focused teams</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          {!showForgotPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
                minLength={8}
              />
            </div>
          )}

          {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : showForgotPassword ? 'Send Reset Email' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        {showForgotPassword ? (
          <button
            onClick={() => {
              setShowForgotPassword(false)
              setError('')
              setSuccess('')
              setEmail('')
            }}
            className="w-full mt-4 text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
            type="button"
          >
            Back to Log In
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                setShowForgotPassword(true)
                setError('')
                setPassword('')
              }}
              className="w-full mt-4 text-center text-gray-600 hover:text-blue-600 text-sm"
              type="button"
            >
              Forgot your password?
            </button>

            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-gray-600 hover:text-gray-900 text-sm"
              type="button"
            >
              {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
