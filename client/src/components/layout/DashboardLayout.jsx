import { Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import api from '../../lib/axios'

const PAGE_TITLES = {
  '/student/dashboard': 'Dashboard',
  '/student/complaints/new': 'New Complaint',
  '/student/complaints': 'My Complaints',
  '/student/notifications': 'Notifications',
  '/student/profile': 'My Profile',
  '/staff/dashboard': 'Dashboard',
  '/staff/complaints': 'Assigned Complaints',
  '/hod/dashboard': 'Department Dashboard',
  '/hod/complaints': 'Department Complaints',
  '/hod/analytics': 'Analytics',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/complaints': 'All Complaints',
  '/admin/users': 'User Management',
  '/admin/departments': 'Departments',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'System Settings',
}

export default function DashboardLayout({ role }) {
  const location = useLocation()

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30000,
    enabled: role === 'student',
  })

  const pageTitle = PAGE_TITLES[location.pathname]
    || (location.pathname.includes('/complaints/') ? 'Complaint Details' : 'Dashboard')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar role={role} notifCount={notifData?.unreadCount || 0} />

      {/* Main content area - offset by sidebar width */}
      <div className="flex-1 flex flex-col min-w-0 ml-64 transition-all duration-300" id="main-content">
        <TopBar role={role} pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
