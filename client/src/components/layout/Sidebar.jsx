import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { cn, getInitials } from '../../lib/utils'
import {
  LayoutDashboard, FileText, PlusCircle, Bell, User, Users,
  Building2, BarChart3, Settings, ChevronLeft, ChevronRight,
  GraduationCap, Shield, Briefcase, AlertCircle, LogOut,
} from 'lucide-react'

const NAV_CONFIG = {
  student: [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/complaints/new', icon: PlusCircle, label: 'New Complaint' },
    { to: '/student/complaints', icon: FileText, label: 'My Complaints' },
    { to: '/student/notifications', icon: Bell, label: 'Notifications' },
    { to: '/student/profile', icon: User, label: 'Profile' },
  ],
  staff: [
    { to: '/staff/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/staff/complaints', icon: FileText, label: 'Assigned Complaints' },
  ],
  hod: [
    { to: '/hod/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/hod/complaints', icon: FileText, label: 'Department Complaints' },
    { to: '/hod/analytics', icon: BarChart3, label: 'Analytics' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/complaints', icon: FileText, label: 'All Complaints' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/departments', icon: Building2, label: 'Departments' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ],
}

const ROLE_META = {
  student: { icon: GraduationCap, label: 'Student', color: 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/60' },
  staff:   { icon: Briefcase,      label: 'Staff',   color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/60' },
  hod:     { icon: AlertCircle,   label: 'HOD',     color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/60' },
  admin:   { icon: Shield,         label: 'Admin',   color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/60' },
}

export default function Sidebar({ role, notifCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navItems = NAV_CONFIG[role] || []
  const roleMeta = ROLE_META[role] || ROLE_META.student
  const RoleIcon = roleMeta.icon

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out',
        'bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-sm',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800', collapsed && 'justify-center px-2')}>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-base">C</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">CMS Portal</p>
            <p className="text-xs text-gray-400 truncate">College Management</p>
          </div>
        )}
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-4 py-3">
          <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold', roleMeta.color)}>
            <RoleIcon className="w-3.5 h-3.5" />
            {roleMeta.label} Portal
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn('sidebar-link relative', isActive && 'active', collapsed && 'justify-center px-0')
            }
          >
            <div className="relative flex-shrink-0">
              <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              {label === 'Notifications' && notifCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </div>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className={cn('border-t border-gray-100 dark:border-gray-800 p-3', collapsed && 'flex justify-center')}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3.5 top-20 w-7 h-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors z-50"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-gray-500" /> : <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />}
      </button>
    </aside>
  )
}
