import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, Clock, CheckCircle2, UserCheck, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/axios'
import ComplaintCard from '../../components/complaints/ComplaintCard'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'

export default function HodDashboard() {
  const { user } = useAuth()

  // Stats Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['hod-stats'],
    queryFn: () => api.get('/complaints/stats').then((r) => r.data)
  })

  // Recent Complaints Query
  const { data: complaintsData, isLoading: complaintsLoading } = useQuery({
    queryKey: ['hod-recent-complaints'],
    queryFn: () =>
      api
        .get('/complaints', { params: { limit: 3 } })
        .then((r) => r.data)
  })

  const isLoading = statsLoading || complaintsLoading

  if (isLoading) {
    return <TableSkeleton rows={4} cols={4} />
  }

  const statCards = [
    {
      label: 'Unassigned / Pending',
      value: stats?.pending || 0,
      icon: AlertTriangle,
      color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20'
    },
    {
      label: 'Assigned Work',
      value: (stats?.assigned || 0) + (stats?.in_progress || 0),
      icon: UserCheck,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20'
    },
    {
      label: 'Resolved Issues',
      value: (stats?.resolved || 0) + (stats?.closed || 0),
      icon: CheckCircle2,
      color: 'text-green-600 bg-green-50 dark:bg-green-950/20'
    },
    {
      label: 'Total Departmental',
      value: stats?.total || 0,
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20'
    }
  ]

  const recentComplaints = complaintsData?.complaints || []

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-650 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">
            Department Management
          </h1>
          <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-lg">
            Manage complaints for the {user?.department_name || 'Department'} area. Assign coordinators, review staff progress, and audit student feedback.
          </p>
        </div>
        <Link
          to="/hod/analytics"
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <BarChart3 className="w-4 h-4" />
          View Reports & Charts
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-5 flex items-center gap-4 shadow-sm"
            >
              <div className={`p-3 rounded-lg ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{card.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Complaints */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Recent Department Activity
          </h2>
          <Link
            to="/hod/complaints"
            className="text-xs font-semibold text-blue-600 hover:text-blue-750 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:underline"
          >
            Manage All Department Complaints &rarr;
          </Link>
        </div>

        {!recentComplaints.length ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-8 text-center text-gray-500">
            No complaints logged in your department.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentComplaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} role="hod" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
