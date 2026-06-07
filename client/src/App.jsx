import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import LoadingScreen from './components/ui/LoadingScreen'

// Auth pages (eager-loaded)
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Student pages
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'))
const StudentNewComplaint = lazy(() => import('./pages/student/NewComplaint'))
const StudentComplaints = lazy(() => import('./pages/student/MyComplaints'))
const StudentComplaintDetail = lazy(() => import('./pages/student/ComplaintDetail'))
const StudentNotifications = lazy(() => import('./pages/student/Notifications'))
const StudentProfile = lazy(() => import('./pages/student/Profile'))

// Staff pages
const StaffDashboard = lazy(() => import('./pages/staff/Dashboard'))
const StaffComplaints = lazy(() => import('./pages/staff/Complaints'))
const StaffComplaintDetail = lazy(() => import('./pages/staff/ComplaintDetail'))

// HOD pages
const HodDashboard = lazy(() => import('./pages/hod/Dashboard'))
const HodComplaints = lazy(() => import('./pages/hod/Complaints'))
const HodComplaintDetail = lazy(() => import('./pages/hod/ComplaintDetail'))
const HodAnalytics = lazy(() => import('./pages/hod/Analytics'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminComplaints = lazy(() => import('./pages/admin/Complaints'))
const AdminComplaintDetail = lazy(() => import('./pages/admin/ComplaintDetail'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminDepartments = lazy(() => import('./pages/admin/Departments'))
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'))
const AdminSettings = lazy(() => import('./pages/admin/Settings'))

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const homes = { student: '/student/dashboard', staff: '/staff/dashboard', hod: '/hod/dashboard', admin: '/admin/dashboard' }
  return <Navigate to={homes[user.role] || '/login'} replace />
}

export default function App() {
  const { loading } = useAuth()
  if (loading) return <LoadingScreen />

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<RoleRedirect />} />

        {/* Student */}
        <Route element={<ProtectedRoute role="student" />}>
          <Route element={<DashboardLayout role="student" />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/complaints/new" element={<StudentNewComplaint />} />
            <Route path="/student/complaints" element={<StudentComplaints />} />
            <Route path="/student/complaints/:id" element={<StudentComplaintDetail />} />
            <Route path="/student/notifications" element={<StudentNotifications />} />
            <Route path="/student/profile" element={<StudentProfile />} />
          </Route>
        </Route>

        {/* Staff */}
        <Route element={<ProtectedRoute role="staff" />}>
          <Route element={<DashboardLayout role="staff" />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/complaints" element={<StaffComplaints />} />
            <Route path="/staff/complaints/:id" element={<StaffComplaintDetail />} />
          </Route>
        </Route>

        {/* HOD */}
        <Route element={<ProtectedRoute role="hod" />}>
          <Route element={<DashboardLayout role="hod" />}>
            <Route path="/hod/dashboard" element={<HodDashboard />} />
            <Route path="/hod/complaints" element={<HodComplaints />} />
            <Route path="/hod/complaints/:id" element={<HodComplaintDetail />} />
            <Route path="/hod/analytics" element={<HodAnalytics />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route element={<DashboardLayout role="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/complaints" element={<AdminComplaints />} />
            <Route path="/admin/complaints/:id" element={<AdminComplaintDetail />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/departments" element={<AdminDepartments />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
