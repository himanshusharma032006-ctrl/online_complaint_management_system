import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

let toastId = 0
const ICONS = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info }
const COLORS = {
  success: 'border-l-green-500 bg-green-50 dark:bg-green-950/30',
  error:   'border-l-red-500 bg-red-50 dark:bg-red-950/30',
  warning: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
  info:    'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30',
}
const ICON_COLORS = { success: 'text-green-500', error: 'text-red-500', warning: 'text-yellow-500', info: 'text-blue-500' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastId
    setToasts(t => [...t, { id, type, title, message }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
    return id
  }, [])

  const dismiss = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm w-full">
        {toasts.map(t => {
          const Icon = ICONS[t.type]
          return (
            <div key={t.id} className={`card border-l-4 ${COLORS[t.type]} p-4 shadow-lg flex items-start gap-3 animate-slide-in`}>
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ICON_COLORS[t.type]}`} />
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.title}</p>}
                {t.message && <p className="text-sm text-gray-600 dark:text-gray-300">{t.message}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
