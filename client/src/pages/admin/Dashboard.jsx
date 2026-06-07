import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, Users, Building2, ShieldAlert, BarChart3, ArrowRight, UserPlus, PlusCircle } from 'lucide-react'
import api from '../../lib/axios'
import ComplaintCard from '../../components/complaints/ComplaintCard'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'

export default function AdminDashboard() {
  // Stats Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/complaints/stats').then((r) => r.data)
  })

  // Users count query
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-overview'],
    queryFn: () => api.get('/users', { params: { limit: 1 } }).then((r) => r.data)
  })

  // Departments query
  const { data: deptsData, isLoading: deptsLoading } = useQuery({
    queryKey: ['admin-depts-overview'],
    queryFn: () => api.get('/departments').then((r) => r.data)
  })

  // Recent Complaints Query
  const { data: complaintsData, isLoading: complaintsLoading } = useQuery({
    queryKey: ['admin-recent-complaints'],
    queryFn: () =>
      api
        .get('/complaints', { params: { limit: 3 } })
        .then((r) => r.data)
  })

  const isLoading = statsLoading || usersLoading || deptsLoading || complaintsLoading

  if (isLoading) {
    return <TableSkeleton rows={4} cols={4} />
  }

  const statCards = [
    {
      label: 'Total Complaints',
      value: stats?.total || 0,
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
      link: '/admin/complaints'
    },
    {
      label: 'Registered Users',
      value: usersData?.total || 0,
      icon: Users,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20',
      link: '/admin/users'
    },
    {
      label: 'Academic Departments',
      value: deptsData?.length || 0,
      icon: Building2,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20',
      link: '/admin/departments'
    },
    {
      label: 'Urgent Priority Logs',
      value: stats?.urgent || 0,
      icon: ShieldAlert,
      color: 'text-red-600 bg-red-50 dark:bg-red-950/20',
      link: '/admin/complaints?priority=urgent'
    }
  ]

  const recentComplaints = complaintsData?.complaints || []

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">
            Administrator Console
          </h1>
          <p className="text-indigo-200 text-xs md:text-sm mt-1 max-w-lg">
            Monitor complaints flow, configure departments, moderate users, and examine operational audits.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            to="/admin/users"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Manage Users
          </Link>
          <Link
            to="/admin/analytics"
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Reports
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <Link
              key={i}
              to={card.link}
              className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow transition-all group"
            >
              <div className={`p-3 rounded-lg ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{card.value}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Detailed breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent complaints */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Recent Activity Feed
            </h2>
            <Link
              to="/admin/complaints"
              className="text-xs font-semibold text-blue-600 hover:text-blue-750 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 hover:underline transition-all"
            >
              View All Audits
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!recentComplaints.length ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-8 text-center text-gray-500">
              No complaint logs found in the database.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {recentComplaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c} role="admin" />
              ))}
            </div>
          )}
        </div>

        {/* Quick Config Actions */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            System Status Counters
          </h2>
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-3.5">
            {[
              { label: 'Pending Action', val: stats?.pending || 0, color: 'bg-yellow-500' },
              { label: 'Under Review', val: stats?.under_review || 0, color: 'bg-blue-500' },
              { label: 'Assigned Coordinator', val: stats?.assigned || 0, color: 'bg-purple-500' },
              { label: 'In Progress', val: stats?.in_progress || 0, color: 'bg-orange-500' },
              { label: 'Resolved', val: stats?.resolved || 0, color: 'bg-green-500' },
              { label: 'Closed/Rejected', val: (stats?.closed || 0) + (stats?.rejected || 0), color: 'bg-gray-500' }
            ].map((st, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                  {st.label}
                </span>
                <span className="font-semibold text-gray-905 dark:text-gray-100">{st.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
