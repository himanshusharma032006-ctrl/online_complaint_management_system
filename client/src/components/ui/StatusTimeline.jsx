import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { STATUS_CONFIG, formatDateTime } from '../../lib/utils'

export default function StatusTimeline({ timeline = [] }) {
  if (!timeline.length) return null

  return (
    <div className="relative">
      {timeline.map((entry, idx) => {
        const isLast = idx === timeline.length - 1
        const cfg = STATUS_CONFIG[entry.new_status] || {}
        return (
          <div key={entry.id} className="flex gap-4 relative">
            {/* Connector line */}
            {!isLast && (
              <div className="absolute left-[15px] top-8 w-0.5 h-full bg-gray-100 dark:bg-gray-800" />
            )}

            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {isLast ? (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  entry.new_status === 'resolved' ? 'border-green-500 bg-green-50 dark:bg-green-950/40' :
                  entry.new_status === 'rejected' ? 'border-red-500 bg-red-50 dark:bg-red-950/40' :
                  'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${
                    entry.new_status === 'resolved' ? 'text-green-500' :
                    entry.new_status === 'rejected' ? 'text-red-500' : 'text-brand-500'
                  }`} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                  <Circle className="w-3 h-3 text-gray-400" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-6 ${isLast ? '' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {entry.message || `Status changed to ${STATUS_CONFIG[entry.new_status]?.label || entry.new_status}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    by <span className="font-medium">{entry.actor_name || 'System'}</span>
                    {entry.actor_role && <span className="capitalize"> ({entry.actor_role})</span>}
                  </p>
                </div>
                <span className={`badge flex-shrink-0 ${cfg.color || 'bg-gray-100 text-gray-600'}`}>
                  {cfg.label || entry.new_status}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {formatDateTime(entry.created_at)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
