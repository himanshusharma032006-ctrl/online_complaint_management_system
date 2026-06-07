import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, GraduationCap, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, ROLE_HOME } from '../../lib/utils'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@college.edu', role: 'Full control' },
  { label: 'HOD (CSE)', email: 'hod.cse@college.edu', role: 'Dept. head' },
  { label: 'Staff', email: 'staff.cse@college.edu', role: 'Complaint handler' },
  { label: 'Student', email: 'student@college.edu', role: 'Submit & track' },
]

export default function Login() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const user = await login(data.email, data.password)
      toast({ type: 'success', title: 'Welcome back!', message: `Logged in as ${user.name}` })
      navigate(ROLE_HOME[user.role] || '/')
    } catch (err) {
      toast({ type: 'error', title: 'Login failed', message: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 bg-mesh">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-brand-600 via-brand-700 to-purple-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-purple-300 blur-3xl" />
        </div>
        <div className="relative z-10 text-center text-white space-y-6 max-w-xs">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">College Complaint Management</h1>
            <p className="text-brand-200 mt-3 text-sm leading-relaxed">A unified platform to submit, track, and resolve college grievances efficiently.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-8">
            {[['4 Roles', 'Student, Staff, HOD, Admin'], ['Real-time', 'Status notifications'], ['Analytics', 'Department insights'], ['Secure', 'JWT authentication']].map(([t, d]) => (
              <div key={t} className="bg-white/10 backdrop-blur rounded-xl p-3 text-left">
                <p className="font-semibold text-sm">{t}</p>
                <p className="text-xs text-brand-200 mt-0.5">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">CMS Portal</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in to your account</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Enter your credentials to continue</p>
          </div>

          {/* Demo Accounts */}
          <div className="card p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Demo Accounts (password: Demo@1234)</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => { setValue('email', acc.email); setValue('password', 'Demo@1234') }}
                  className="text-left p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-all group"
                >
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-brand-700 dark:group-hover:text-brand-300">{acc.label}</p>
                  <p className="text-[10px] text-gray-400">{acc.role}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                {...register('email')}
                type="email"
                id="email"
                autoComplete="email"
                placeholder="you@college.edu"
                className="input"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
