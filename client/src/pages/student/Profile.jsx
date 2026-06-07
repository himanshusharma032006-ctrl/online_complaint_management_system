import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { User, Mail, Shield, GraduationCap, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/axios'
import { useToast } from '../../components/ui/Toast'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().optional().refine(
    (val) => !val || val.length >= 6,
    'Password must be at least 6 characters'
  )
})

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      password: ''
    }
  })

  const mutation = useMutation({
    mutationFn: (formData) => {
      // Only send password if it is not empty
      const payload = { name: formData.name }
      if (formData.password) payload.password = formData.password
      return api.patch('/auth/profile', payload).then((r) => r.data)
    },
    onSuccess: (updatedUser) => {
      updateUser({ ...user, ...updatedUser })
      toast({ type: 'success', title: 'Profile Updated', message: 'Your changes have been saved.' })
      reset({ name: updatedUser.name, password: '' })
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to update profile'
      toast({ type: 'error', title: 'Update Failed', message: msg })
    }
  })

  const onSubmit = (data) => {
    mutation.mutate(data)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-500" />
          My Profile
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your account settings and profile details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-150 dark:bg-blue-900/40 text-blue-650 dark:text-blue-350 flex items-center justify-center font-bold text-xl uppercase mb-3 shadow-inner">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-105 text-base truncate max-w-full">
              {user?.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
              {user?.role}
            </p>
          </div>

          <div className="mt-6 space-y-4 border-t border-gray-100 dark:border-gray-800/60 pt-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate" title={user?.email}>{user?.email}</span>
            </div>
            {user?.role === 'student' && user?.enrollment_no && (
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">Roll: {user.enrollment_no}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">Department: {user?.department_name || 'General'}</span>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="md:col-span-2 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
            Edit Details
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-705 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-900 dark:text-gray-105 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-705 dark:text-gray-300 mb-1">
                New Password (Leave blank to keep current)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-900 dark:text-gray-105 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800/60 flex justify-end">
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                {mutation.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
