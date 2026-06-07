import { Link } from 'react-router-dom'
import { Calendar, User, MessageSquare, Tag } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import PriorityBadge from '../ui/PriorityBadge'
import { formatDateTime, timeAgo } from '../../lib/utils'

export default function ComplaintCard({ complaint, role = 'student' }) {
  const {
    id,
    title,
    description,
    category,
    status,
    priority,
    created_at,
    student_name,
    department_name,
    comment_count = 0
  } = complaint

  const detailPath = `/${role}/complaints/${id}`

  return (
    <Link
      to={detailPath}
      className="block bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/60 rounded-xl hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 p-5 group"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={status} />
          <PriorityBadge priority={priority} />
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
          {timeAgo(created_at)}
        </span>
      </div>

      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 line-clamp-1">
        {title}
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800/60 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            {category}
          </span>
          <span className="h-3 w-px bg-gray-200 dark:bg-gray-800" />
          <span className="font-medium text-gray-600 dark:text-gray-300">
            {department_name || 'General'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {role !== 'student' && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-gray-400" />
              {student_name || 'Anonymous'}
            </span>
          )}
          {comment_count > 0 && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <MessageSquare className="w-3.5 h-3.5" />
              {comment_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
