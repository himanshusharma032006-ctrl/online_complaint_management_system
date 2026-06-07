import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingScreen from '../ui/LoadingScreen'

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    const homes = { student: '/student/dashboard', staff: '/staff/dashboard', hod: '/hod/dashboard', admin: '/admin/dashboard' }
    return <Navigate to={homes[user.role] || '/login'} replace />
  }
  return <Outlet />
}
