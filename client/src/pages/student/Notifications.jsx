import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Eye } from 'lucide-react'
import api from '../../lib/axios'
import { formatDateTime } from '../../lib/utils'
import { useToast } from '../../components/ui/Toast'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'

export default function Notifications() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch Notifications
  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data)
  })

  // Mark Read Mutation
  const readMutation = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
    }
  })

  // Mark All Read Mutation
  const readAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      toast({ type: 'success', title: 'Success', message: 'All notifications marked as read.' })
    },
    onError: (err) => {
      toast({ type: 'error', title: 'Error', message: err.message || 'Action failed.' })
    }
  })

  if (isLoading) {
    return <TableSkeleton rows={5} cols={5} />
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>Failed to load notifications. Please try again.</span>
      </div>
    )
  }

  const notifications = data?.notifications || []
  const hasUnread = (data?.unreadCount || 0) > 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-500" />
            Notifications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Keep up with changes and updates on your complaints.
          </p>
        </div>
        {hasUnread && (
          <button
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isLoading}
            className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3.5 py-2 rounded-xl transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      {!notifications.length ? (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description="You don't have any notifications at the moment."
        />
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/60 rounded-xl divide-y divide-gray-100 dark:divide-gray-800/60 shadow-sm overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between p-4 gap-4 transition-colors ${
                !n.is_read ? 'bg-blue-50/20 dark:bg-blue-900/5' : 'hover:bg-gray-50/40 dark:hover:bg-gray-800/10'
              }`}
            >
              <div className="flex gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
                  !n.is_read
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-455 dark:text-gray-500'
                }`}>
                  {n.title.toLowerCase().includes('comment') ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {n.title}
                  </h4>
                  <p className="text-sm text-gray-655 dark:text-gray-350 mt-0.5">
                    {n.message}
                  </p>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-2 block">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/student/complaints/${n.complaint_id}`}
                  onClick={() => !n.is_read && readMutation.mutate(n.id)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="View Complaint"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                {!n.is_read && (
                  <button
                    onClick={() => readMutation.mutate(n.id)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="Mark Read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
