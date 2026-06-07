import { Loader2 } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 opacity-20 blur animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    </div>
  )
}
