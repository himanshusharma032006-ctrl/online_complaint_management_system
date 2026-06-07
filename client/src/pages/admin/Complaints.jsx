import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Grid, List, AlertCircle } from 'lucide-react'
import api from '../../lib/axios'
import ComplaintFilters from '../../components/complaints/ComplaintFilters'
import ComplaintCard from '../../components/complaints/ComplaintCard'
import ComplaintTable from '../../components/complaints/ComplaintTable'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { downloadCSV } from '../../lib/utils'
import { useToast } from '../../components/ui/Toast'

export default function AdminComplaints() {
  const [viewMode, setViewMode] = useState('list')
  const { toast } = useToast()
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    priority: '',
    department_id: '',
    from_date: '',
    to_date: '',
    page: 1,
    limit: 10
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-complaints', filters],
    queryFn: () =>
      api.get('/complaints', { params: filters }).then((r) => r.data),
    keepPreviousData: true
  })

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handleReset = () => {
    setFilters({
      search: '',
      category: '',
      status: '',
      priority: '',
      department_id: '',
      from_date: '',
      to_date: '',
      page: 1,
      limit: 10
    })
  }

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      // Extract filter params except pagination
      const { page, limit, ...exportParams } = filters
      const response = await api.get('/complaints/export/csv', {
        params: exportParams,
        responseType: 'text'
      })
      downloadCSV(response.data, 'college_complaints_export.csv')
      toast({ type: 'success', title: 'Export Success', message: 'Complaints list downloaded.' })
    } catch (err) {
      toast({ type: 'error', title: 'Export Failed', message: err.message || 'Failed to download CSV.' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All System Complaints</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Audit logs, delete entries, or assign coordinators across all departments.
          </p>
        </div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-1 flex items-center bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-gray-800 shadow text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-800 shadow text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ComplaintFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
        showDepartment={true}
        onExport={handleExportCSV}
        loadingExport={exporting}
      />

      {error ? (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Failed to load complaints logs. Please try again.</span>
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : !data?.complaints?.length ? (
        <EmptyState
          title="No Logs Found"
          description="There are no complaints matching your current filters."
        />
      ) : (
        <div className="space-y-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.complaints.map((c) => (
                <ComplaintCard key={c.id} complaint={c} role="admin" />
              ))}
            </div>
          ) : (
            <ComplaintTable complaints={data.complaints} role="admin" />
          )}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-300"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {filters.page} of {data.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === data.totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-855 text-gray-700 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
