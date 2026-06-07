import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'MMM dd, yyyy')
  } catch {
    return date
  }
}

export function formatDateTime(date) {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'MMM dd, yyyy • hh:mm a')
  } catch {
    return date
  }
}

export function timeAgo(date) {
  if (!date) return '—'
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true })
  } catch {
    return date
  }
}

export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export const STATUS_CONFIG = {
  pending:      { label: 'Pending',      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', dot: 'bg-yellow-500' },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',   dot: 'bg-blue-500' },
  assigned:     { label: 'Assigned',     color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300', dot: 'bg-purple-500' },
  in_progress:  { label: 'In Progress',  color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', dot: 'bg-orange-500' },
  resolved:     { label: 'Resolved',     color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',  dot: 'bg-green-500' },
  rejected:     { label: 'Rejected',     color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',    dot: 'bg-red-500' },
  closed:       { label: 'Closed',       color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',    dot: 'bg-gray-500' },
}

export const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  high:   { label: 'High',   color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

export const CATEGORIES = [
  'Academic', 'Examination', 'Faculty Behavior', 'Library', 'Hostel',
  'Canteen', 'Transport', 'Infrastructure', 'Sports & Cultural',
  'IT & Labs', 'Administrative', 'Financial/Fee', 'Ragging', 'Other',
]

export const ROLE_HOME = {
  student: '/student/dashboard',
  staff: '/staff/dashboard',
  hod: '/hod/dashboard',
  admin: '/admin/dashboard',
}

export function downloadCSV(data, filename = 'export.csv') {
  const blob = new Blob([data], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function getErrorMessage(error) {
  return error?.response?.data?.error
    || error?.response?.data?.errors?.[0]?.msg
    || error?.message
    || 'Something went wrong'
}
