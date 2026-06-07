import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileText, Clock, CheckCircle2, AlertCircle, PlusCircle, TrendingUp } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { CardSkeleton, TableSkeleton } from '../../components/ui/LoadingSkeleton'
import StatusBadge from '../../components/ui/StatusBadge'
import PriorityBadge from '../../components/ui/PriorityBadge'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, timeAgo } from '../../lib/utils'
import api from '../../lib/axios'

function StatCard({ icon: Icon, label, value, color, to }) {
  const card = (
    <div className={`stat-card ${to ? 'cursor-pointer hover:shadow-lg' : ''}`}>
      <div className={`stat-icon ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{card}</Link> : card
}

export default function StudentDashboard() {
  const { user } = useAuth()

  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ['my-complaints'],
    queryFn: () => api.get('/complaints/my?limit=5').then(r => r.data),
  })

  const complaints = complaintsData?.complaints || []
  const total = complaintsData?.total || 0

  const stats = {
    total,
    pending: complaints.filter(c => ['pending', 'under_review', 'assigned'].includes(c.status)).length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Hello, {user?.name?.split(' ')[0]}! 👋</h2>
            <p className="text-brand-200 mt-1 text-sm">Track your complaints and stay updated on resolutions.</p>
          </div>
          <Link to="/student/complaints/new" className="flex-shrink-0 flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all">
            <PlusCircle className="w-4 h-4" /> New Complaint
          </Link>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? <CardSkeleton count={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} label="Total Submitted" value={total} color="bg-brand-100 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400" to="/student/complaints" />
          <StatCard icon={Clock} label="Pending Review" value={stats.pending} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400" />
          <StatCard icon={TrendingUp} label="In Progress" value={stats.inProgress} color="bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400" />
          <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} color="bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400" />
        </div>
      )}

      {/* Recent Complaints */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Complaints</h3>
          <Link to="/student/complaints" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all →</Link>
        </div>

        {isLoading ? (
          <div className="p-6"><TableSkeleton rows={5} cols={4} /></div>
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No complaints yet"
            description="You haven't submitted any complaints yet. Submit one to get started."
            action={<Link to="/student/complaints/new" className="btn-primary">Submit Your First Complaint</Link>}
          />
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800/80">
            {complaints.map(c => (
              <Link key={c.id} to={`/student/complaints/${c.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{c.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{c.category}</span>
                    <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PriorityBadge priority={c.priority} />
                  <StatusBadge status={c.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
