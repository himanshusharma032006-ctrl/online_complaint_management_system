import { useQuery } from '@tanstack/react-query'
import { Search, RotateCcw, Download, Filter } from 'lucide-react'
import { CATEGORIES } from '../../lib/utils'
import api from '../../lib/axios'

export default function ComplaintFilters({
  filters,
  onChange,
  onReset,
  showDepartment = false,
  onExport,
  loadingExport = false
}) {
  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data),
    enabled: showDepartment
  })

  const handleTextChange = (e) => {
    onChange({ [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name, value) => {
    onChange({ [name]: value })
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/60 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800/60 pb-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-500" />
          Filter Complaints
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 py-1 px-2.5 rounded-lg border border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          {onExport && (
            <button
              onClick={onExport}
              disabled={loadingExport}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-55 text-white flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              {loadingExport ? 'Exporting...' : 'Export CSV'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
          <input
            type="text"
            name="search"
            value={filters.search || ''}
            onChange={handleTextChange}
            placeholder="Search title, description..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Category */}
        <div>
          <select
            value={filters.category || ''}
            onChange={(e) => handleSelectChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="" className="bg-white dark:bg-gray-950">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat} className="bg-white dark:bg-gray-950">{cat}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <select
            value={filters.status || ''}
            onChange={(e) => handleSelectChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="" className="bg-white dark:bg-gray-950">All Statuses</option>
            <option value="pending" className="bg-white dark:bg-gray-950">Pending</option>
            <option value="under_review" className="bg-white dark:bg-gray-950">Under Review</option>
            <option value="assigned" className="bg-white dark:bg-gray-950">Assigned</option>
            <option value="in_progress" className="bg-white dark:bg-gray-950">In Progress</option>
            <option value="resolved" className="bg-white dark:bg-gray-950">Resolved</option>
            <option value="rejected" className="bg-white dark:bg-gray-950">Rejected</option>
            <option value="closed" className="bg-white dark:bg-gray-950">Closed</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <select
            value={filters.priority || ''}
            onChange={(e) => handleSelectChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="" className="bg-white dark:bg-gray-950">All Priorities</option>
            <option value="low" className="bg-white dark:bg-gray-950">Low</option>
            <option value="medium" className="bg-white dark:bg-gray-950">Medium</option>
            <option value="high" className="bg-white dark:bg-gray-950">High</option>
            <option value="urgent" className="bg-white dark:bg-gray-950">Urgent</option>
          </select>
        </div>

        {/* Department Filter (Admin & sometimes Staff/HOD if required) */}
        {showDepartment && (
          <div>
            <select
              value={filters.department_id || ''}
              onChange={(e) => handleSelectChange('department_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="" className="bg-white dark:bg-gray-950">All Departments</option>
              {deptsData?.map(dept => (
                <option key={dept.id} value={dept.id} className="bg-white dark:bg-gray-950">
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Filters */}
        <div>
          <input
            type="date"
            name="from_date"
            value={filters.from_date || ''}
            onChange={handleTextChange}
            placeholder="From Date"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <input
            type="date"
            name="to_date"
            value={filters.to_date || ''}
            onChange={handleTextChange}
            placeholder="To Date"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>
    </div>
  )
}
