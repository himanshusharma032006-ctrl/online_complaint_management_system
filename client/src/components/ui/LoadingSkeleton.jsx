export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg"
              style={{ width: `${[180, 100, 80, 80, 60][j % 5]}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-6 space-y-3">
          <div className="flex justify-between items-start">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-24" />
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-16" />
          <div className="h-3 bg-gray-100 dark:bg-gray-800/50 rounded w-32" />
        </div>
      ))}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="card p-6 space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-20" />
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-16" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/5" />
        </div>
      </div>
    </div>
  )
}
