import { FileQuestion } from 'lucide-react'

export default function EmptyState({ icon: Icon = FileQuestion, title = 'No data found', description = 'Nothing to display here yet.', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-4 shadow-inner">
        <Icon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mb-5">{description}</p>
      {action}
    </div>
  )
}
