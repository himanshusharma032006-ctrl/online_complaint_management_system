import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, UserPlus, Shield, Power, Mail, GraduationCap, X, Check, Loader2 } from 'lucide-react'
import api from '../../lib/axios'
import { useToast } from '../../components/ui/Toast'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'staff', 'hod', 'admin']),
  department_id: z.string().optional(),
  enrollment_no: z.string().optional()
})

export default function Users() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  
  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    page: 1,
    limit: 10
  })

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'student',
      department_id: '',
      enrollment_no: ''
    }
  })

  const selectedRole = watch('role')

  // Fetch Users
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => api.get('/users', { params: filters }).then((r) => r.data),
    keepPreviousData: true
  })

  // Fetch Departments for selection
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then((r) => r.data)
  })

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: (formData) => {
      const payload = { ...formData }
      if (payload.department_id) payload.department_id = parseInt(payload.department_id)
      if (!payload.department_id) delete payload.department_id
      if (!payload.enrollment_no) delete payload.enrollment_no
      return api.post('/users', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      setShowAddModal(false)
      reset()
      toast({ type: 'success', title: 'User Created', message: 'New user registered successfully.' })
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Registration failed.'
      toast({ type: 'error', title: 'Error', message: msg })
    }
  })

  // Toggle User Active Status Mutation
  const toggleUserMutation = useMutation({
    mutationFn: ({ id, is_active }) => {
      if (is_active) {
        // Deactivate (delete endpoint deactivates)
        return api.delete(`/users/${id}`)
      } else {
        // Activate (patch endpoint)
        return api.patch(`/users/${id}`, { is_active: true })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      toast({ type: 'success', title: 'Status Changed', message: 'User active status updated.' })
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Action failed.'
      toast({ type: 'error', title: 'Error', message: msg })
    }
  })

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const onRegisterSubmit = (data) => {
    createUserMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Control accounts, coordinate departments, and assign roles.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-blue-750 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Filter Header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="staff">Staff Coordinator</option>
            <option value="hod">HOD</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* User Table list */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm text-gray-600 dark:text-gray-300">
                {data?.users?.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-650 dark:text-blue-350 flex items-center justify-center font-semibold text-sm uppercase">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-750">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.department_name ? (
                        <span>
                          {u.department_name} ({u.department_code})
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.is_active === 1 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">
                          <X className="w-3 h-3" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() =>
                          toggleUserMutation.mutate({ id: u.id, is_active: u.is_active === 1 })
                        }
                        disabled={toggleUserMutation.isLoading}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                          u.is_active === 1
                            ? 'border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                            : 'border-emerald-200 dark:border-emerald-900/40 text-emerald-650 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {u.is_active === 1 ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-400">
                Showing page {filters.page} of {data.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Prev
                </button>
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === data.totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Register New Account</h3>
              <p className="text-xs text-gray-500">Provide registration details to create a user profile.</p>
            </div>

            <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="john@college.edu"
                    {...register('email')}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Access Role</label>
                  <select
                    {...register('role')}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-750 dark:text-gray-300"
                  >
                    <option value="student">Student</option>
                    <option value="staff">Staff Coordinator</option>
                    <option value="hod">HOD</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {selectedRole === 'student' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Enrollment/Roll No</label>
                    <input
                      type="text"
                      placeholder="ENG/2026/045"
                      {...register('enrollment_no')}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Allocated Department</label>
                    <select
                      {...register('department_id')}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-750 dark:text-gray-300"
                    >
                      <option value="">-- No Department --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>
                )}
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
                  disabled={createUserMutation.isLoading}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-750 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  {createUserMutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
