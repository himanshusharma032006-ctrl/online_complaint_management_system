import { Link } from 'react-router-dom'
import { Calendar, User, ChevronRight, MessageSquare } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import PriorityBadge from '../ui/PriorityBadge'
import { formatDate } from '../../lib/utils'

export default function ComplaintTable({ complaints = [], role = 'student' }) {
  if (!complaints.length) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-8 text-center text-gray-500">
        No complaints matching filters found.
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/60 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Priority</th>
              {role !== 'student' && <th className="px-6 py-4">Student</th>}
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-sm text-gray-600 dark:text-gray-300">
            {complaints.map((c) => {
              const detailPath = `/${role}/complaints/${c.id}`

              return (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">
                    <Link to={detailPath} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{c.category}</td>
                  <td className="px-6 py-4">{c.department_name || 'General'}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-6 py-4">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  {role !== 'student' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {c.student_name || 'Anonymous'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(c.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={detailPath}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      View
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
