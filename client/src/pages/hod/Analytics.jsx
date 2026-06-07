import { useQuery } from '@tanstack/react-query'
import { BarChart3, Clock, Star, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react'
import api from '../../lib/axios'
import StarRating from '../../components/ui/StarRating'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'

export default function HodAnalytics() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['hod-analytics-overview'],
    queryFn: () => api.get('/analytics/overview').then((r) => r.data)
  })

  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['hod-analytics-categories'],
    queryFn: () => api.get('/analytics/by-category').then((r) => r.data)
  })

  const { data: resTime, isLoading: resTimeLoading } = useQuery({
    queryKey: ['hod-analytics-res-time'],
    queryFn: () => api.get('/analytics/resolution-time').then((r) => r.data)
  })

  const isLoading = overviewLoading || catLoading || resTimeLoading

  if (isLoading) {
    return <TableSkeleton rows={5} cols={5} />
  }

  // Calculate some display percentages
  const total = overview?.total || 0
  const resolved = overview?.resolved || 0
  const rejected = overview?.rejected || 0
  const pending = overview?.pending || 0
  const inProgress = overview?.in_progress || 0
  
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0
  const anonymousRate = total > 0 ? Math.round(((overview?.anonymous_count || 0) / total) * 100) : 0
  const avgRating = overview?.avg_rating ? Number(overview.avg_rating).toFixed(1) : 'N/A'
  const avgDays = overview?.avg_resolution_days ? Number(overview.avg_resolution_days).toFixed(1) : 'N/A'

  // Max category count to scale progress bars
  const maxCategoryCount = categories.length > 0 ? Math.max(...categories.map((c) => c.count)) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          Department Performance & Analytics
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Executive metrics for tracking departmental efficiency and resolution qualities.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Resolution Rate</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{resolutionRate}%</span>
            <span className="text-xs text-gray-500">of total logs</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${resolutionRate}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Avg Resolution Speed</span>
            <Clock className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{avgDays}</span>
            <span className="text-xs text-gray-500">Days average</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-3">From submission to resolved status</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Satisfaction Index</span>
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{avgRating}</span>
            <span className="text-xs text-gray-500">/ 5.0 rating</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1">
            {overview?.avg_rating ? (
              <StarRating value={Math.round(overview.avg_rating)} readOnly size="sm" />
            ) : (
              <span className="text-xs text-gray-400">No feedback submitted</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Anonymous Submissions</span>
            <HelpCircle className="w-5 h-5 text-purple-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{overview?.anonymous_count || 0}</span>
            <span className="text-xs text-gray-500">({anonymousRate}%)</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${anonymousRate}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown bar chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
            Complaints by Category
          </h3>
          {!categories.length ? (
            <p className="text-gray-550 text-sm italic text-center py-10">No category statistics found.</p>
          ) : (
            <div className="space-y-4">
              {categories.map((c) => {
                const pct = Math.round((c.count / maxCategoryCount) * 100)
                const resolvedPct = c.count > 0 ? Math.round((c.resolved / c.count) * 100) : 0

                return (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <span>{c.category}</span>
                      <span>
                        {c.count} complaints ({resolvedPct}% resolved)
                      </span>
                    </div>
                    <div className="w-full bg-gray-105 dark:bg-gray-800 h-3 rounded-full overflow-hidden flex">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Resolution time per category */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
            Average Resolution Days by Category
          </h3>
          {!resTime?.byCategory?.length ? (
            <p className="text-gray-550 text-sm italic text-center py-10">No resolution time statistics found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-400 uppercase">
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5 text-center">Completed Logs</th>
                    <th className="py-2.5 text-right">Avg Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-750 dark:text-gray-300">
                  {resTime.byCategory.map((cat) => (
                    <tr key={cat.category}>
                      <td className="py-3 font-medium text-gray-900 dark:text-gray-100">{cat.category}</td>
                      <td className="py-3 text-center">{cat.count}</td>
                      <td className="py-3 text-right text-indigo-600 dark:text-indigo-400 font-semibold">
                        {Number(cat.avg_days).toFixed(1)} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
