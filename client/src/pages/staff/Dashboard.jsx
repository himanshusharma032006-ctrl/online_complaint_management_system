import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, Clock, CheckCircle2, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/axios'
import ComplaintCard from '../../components/complaints/ComplaintCard'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'

export default function StaffDashboard() {
  const { user } = useAuth()

  // Stats Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['staff-stats'],
    queryFn: () => api.get('/complaints/stats').then((r) => r.data)
  })

  // Recent Complaints Query
  const { data: complaintsData, isLoading: complaintsLoading } = useQuery({
    queryKey: ['staff-recent-complaints'],
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
      label: 'Assigned Complaints',
      value: stats?.assigned || 0,
      icon: FileText,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20'
    },
    {
      label: 'In Progress',
      value: stats?.in_progress || 0,
      icon: Clock,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20'
    },
    {
      label: 'Resolved / Closed',
      value: (stats?.resolved || 0) + (stats?.closed || 0),
      icon: CheckCircle2,
      color: 'text-green-600 bg-green-50 dark:bg-green-950/20'
    },
    {
      label: 'Total Allocated',
      value: stats?.total || 0,
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20'
    }
  ]

  const activeComplaints = complaintsData?.complaints || []

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">
          Welcome back, {user?.name || 'Staff Member'}!
        </h1>
        <p className="text-purple-100 text-xs md:text-sm mt-1 max-w-xl">
          Here is an overview of the complaints assigned to you. Select a complaint to update its progress or resolve it.
        </p>
      </div>

      {/* Stats Cards */}
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

      {/* Active Work list */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Assigned Complaints
          </h2>
          <Link
            to="/staff/complaints"
            className="text-xs font-semibold text-blue-600 hover:text-blue-750 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 hover:underline transition-all"
          >
            View All Complaints
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!activeComplaints.length ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-8 text-center text-gray-500">
            No complaints currently assigned to you.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeComplaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} role="staff" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
