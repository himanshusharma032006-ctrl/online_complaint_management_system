import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react'
import api from '../../lib/axios'
import { useToast } from '../../components/ui/Toast'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const deptSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  hod_id: z.string().optional()
})

export default function Departments() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  // Dialog controls
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [deletingDept, setDeletingDept] = useState(null)

  // React Hook Form for creation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: '', code: '', hod_id: '' }
  })

  // React Hook Form for edit
  const editForm = useForm({
    defaultValues: { name: '', hod_id: '' }
  })

  // Fetch Departments
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: () => api.get('/departments').then((r) => r.data)
  })

  // Fetch Users who are candidates to be HODs
  const { data: hodCandidatesData } = useQuery({
    queryKey: ['hod-candidates'],
    queryFn: () => api.get('/users', { params: { role: 'hod', limit: 100 } }).then((r) => r.data)
  })

  const hodCandidates = hodCandidatesData?.users || []

  // Create Department Mutation
  const createDeptMutation = useMutation({
    mutationFn: (formData) => {
      const payload = { ...formData }
      if (payload.hod_id) payload.hod_id = parseInt(payload.hod_id)
      if (!payload.hod_id) delete payload.hod_id
      return api.post('/departments', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-departments'])
      setShowAddModal(false)
      reset()
      toast({ type: 'success', title: 'Success', message: 'Department created.' })
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to create department.'
      toast({ type: 'error', title: 'Error', message: msg })
    }
  })

  // Edit Department Mutation
  const editDeptMutation = useMutation({
    mutationFn: (formData) => {
      const payload = { ...formData }
      if (payload.hod_id) payload.hod_id = parseInt(payload.hod_id)
      if (!payload.hod_id) payload.hod_id = null
      return api.patch(`/departments/${editingDept.id}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-departments'])
      setEditingDept(null)
      toast({ type: 'success', title: 'Success', message: 'Department settings saved.' })
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to update department.'
      toast({ type: 'error', title: 'Error', message: msg })
    }
  })

  // Delete Department Mutation
  const deleteDeptMutation = useMutation({
    mutationFn: () => api.delete(`/departments/${deletingDept.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-departments'])
      setDeletingDept(null)
      toast({ type: 'success', title: 'Deleted', message: 'Department removed successfully.' })
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to delete department.'
      toast({ type: 'error', title: 'Error', message: msg })
    }
  })

  const handleEditClick = (dept) => {
    setEditingDept(dept)
    editForm.reset({
      name: dept.name,
      hod_id: dept.hod_id ? String(dept.hod_id) : ''
    })
  }

  const onCreateSubmit = (data) => {
    createDeptMutation.mutate(data)
  }

  const onEditSubmit = (data) => {
    editDeptMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-500" />
            Departments Config
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define organizational divisions, allocate HODs, and monitor complaint metrics.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-750 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Department Name</th>
                  <th className="px-6 py-4">Assigned HOD</th>
                  <th className="px-6 py-4 text-center">Active Complaints</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm text-gray-600 dark:text-gray-300">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-gray-100">
                      {d.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {d.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {d.hod_name ? (
                        <div>
                          <p className="font-semibold text-gray-850 dark:text-gray-250">{d.hod_name}</p>
                          <p className="text-xs text-gray-400">{d.hod_email}</p>
                        </div>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-500 font-semibold text-xs italic">
                          No HOD allocated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap font-semibold">
                      {d.complaint_count}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleEditClick(d)}
                        className="inline-flex items-center gap-1 text-xs font-semibold border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit HOD
                      </button>
                      <button
                        onClick={() => setDeletingDept(d)}
                        disabled={d.complaint_count > 0}
                        className={`inline-flex items-center gap-1 text-xs font-semibold border px-3 py-1.5 rounded-lg transition-colors ${
                          d.complaint_count > 0
                            ? 'border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : 'border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                        }`}
                        title={d.complaint_count > 0 ? 'Cannot delete departments with complaint records' : ''}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Create Department</h3>
              <p className="text-xs text-gray-500">Configure department name, code, and assign candidate HOD.</p>
            </div>

            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Department Name</label>
                <input
                  type="text"
                  placeholder="Computer Science Engineering"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Unique Dept Code</label>
                <input
                  type="text"
                  placeholder="CSE"
                  {...register('code')}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Department HOD (Optional)</label>
                <select
                  {...register('hod_id')}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-750 dark:text-gray-300"
                >
                  <option value="">-- Assign HOD Candidates Later --</option>
                  {hodCandidates.map((hod) => (
                    <option key={hod.id} value={hod.id}>
                      {hod.name} ({hod.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-2 justify-end border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDeptMutation.isLoading}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-750 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  {createDeptMutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit HOD Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingDept(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Edit Department: {editingDept.code}</h3>
              <p className="text-xs text-gray-500">Modify department configurations and allocate HOD leader.</p>
            </div>

            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  {...editForm.register('name')}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Head Of Department (HOD)</label>
                <select
                  {...editForm.register('hod_id')}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-750 dark:text-gray-300"
                >
                  <option value="">-- Unallocate / No HOD --</option>
                  {hodCandidates.map((hod) => (
                    <option key={hod.id} value={hod.id}>
                      {hod.name} ({hod.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-2 justify-end border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editDeptMutation.isLoading}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-750 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  {editDeptMutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Department Confirmation */}
      {deletingDept && (
        <ConfirmDialog
          open={!!deletingDept}
          onClose={() => setDeletingDept(null)}
          onConfirm={() => deleteDeptMutation.mutate()}
          title="Delete Department permanently?"
          description={`This will delete the department "${deletingDept.name}" (${deletingDept.code}). This action cannot be undone.`}
          confirmLabel="Yes, Delete Department"
          loading={deleteDeptMutation.isLoading}
        />
      )}
    </div>
  )
}
