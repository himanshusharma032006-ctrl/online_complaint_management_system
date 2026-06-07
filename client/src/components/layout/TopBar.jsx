import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Sun, Moon, ChevronDown, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { getInitials, timeAgo } from '../../lib/utils'
import api from '../../lib/axios'

function NotifPanel({ onClose, role }) {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30000,
  })
  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  })
  const notifs = data?.notifications || []
  const notifPath = `/${role}/notifications`

  return (
    <div className="absolute right-0 top-full mt-2 w-80 card shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
        {notifs.some(n => !n.is_read) && (
          <button onClick={() => markAll.mutate()} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Mark all read</button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
        {notifs.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications</div>
        ) : (
          notifs.slice(0, 8).map(n => (
            <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.is_read ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''}`}>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{n.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
            </div>
          ))
        )}
      </div>
      {notifs.length > 0 && (
        <Link to={notifPath} onClick={onClose} className="block text-center py-2.5 text-xs font-medium text-brand-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 transition-colors">
          View all notifications
        </Link>
      )}
    </div>
  )
}

export default function TopBar({ role, pageTitle }) {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [showNotif, setShowNotif] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const notifRef = useRef(null)
  const userRef = useRef(null)

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30000,
  })
  const unread = notifData?.unreadCount || 0

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const profilePath = `/${role}/profile`

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      {/* Page Title */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-all"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun className="w-4.5 h-4.5 w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotif(s => !s); setShowUser(false) }}
            className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-all"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotif && <NotifPanel onClose={() => setShowNotif(false)} role={role} />}
        </div>

        {/* User Dropdown */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setShowUser(s => !s); setShowNotif(false) }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {getInitials(user?.name)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize leading-tight">{user?.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showUser && (
            <div className="absolute right-0 top-full mt-2 w-48 card shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-fade-in py-1">
              {role === 'student' && (
                <button onClick={() => { navigate(profilePath); setShowUser(false) }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <User className="w-4 h-4" /> Profile
                </button>
              )}
              <button onClick={logout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
