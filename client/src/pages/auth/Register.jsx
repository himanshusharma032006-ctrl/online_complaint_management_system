import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, ChevronLeft, GraduationCap, Briefcase, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, ROLE_HOME } from '../../lib/utils'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'staff']),
  department_id: z.string().min(1, 'Please select a department'),
  enrollment_no: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] })

const STEPS = ['Personal Info', 'Role & Department', 'Complete']

export default function Register() {
  const { register: authRegister } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const { data: departments = [] } = useQuery({
    queryKey: ['departments-public'],
    queryFn: () => api.get('/departments').then(r => r.data),
  })

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'student' },
  })

  const role = watch('role')

  const nextStep = async () => {
    const fields = step === 0 ? ['name', 'email', 'password', 'confirmPassword'] : ['role', 'department_id']
    const valid = await trigger(fields)
    if (valid) setStep(s => s + 1)
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const user = await authRegister({
        name: data.name, email: data.email, password: data.password,
        role: data.role, department_id: parseInt(data.department_id),
        enrollment_no: data.enrollment_no || undefined,
      })
      toast({ type: 'success', title: 'Account created!', message: `Welcome, ${user.name}!` })
      navigate(ROLE_HOME[user.role] || '/')
    } catch (err) {
      toast({ type: 'error', title: 'Registration failed', message: getErrorMessage(err) })
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 bg-mesh p-6">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold">C</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white">CMS Portal</span>
        </div>

        <div className="card p-8 shadow-xl">
          {/* Stepper */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-brand-100 text-brand-700 border-2 border-brand-500 dark:bg-brand-950/60 dark:text-brand-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-brand-700 dark:text-brand-300' : 'text-gray-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${i < step ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 0 – Personal Info */}
            {step === 0 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tell us about yourself</p>
                </div>
                <div>
                  <label className="label">Full Name</label>
                  <input {...register('name')} id="name" className="input" placeholder="Arjun Mehta" />
                  {errors.name && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input {...register('email')} id="reg-email" type="email" className="input" placeholder="you@college.edu" />
                  {errors.email && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email.message}</p>}
                </div>
                <div>
                  <label className="label">Password</label>
                  <input {...register('password')} id="reg-password" type="password" className="input" placeholder="Minimum 6 characters" />
                  {errors.password && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password.message}</p>}
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input {...register('confirmPassword')} id="confirmPassword" type="password" className="input" placeholder="Repeat password" />
                  {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword.message}</p>}
                </div>
                <button type="button" onClick={nextStep} className="btn-primary w-full justify-center">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 1 – Role & Dept */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Role & Department</h2>
                  <p className="text-sm text-gray-500 mt-1">Select your role and department</p>
                </div>
                <div>
                  <label className="label">I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ value: 'student', icon: GraduationCap, label: 'Student' }, { value: 'staff', icon: Briefcase, label: 'Staff' }].map(r => (
                      <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                        ${role === r.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40' : 'border-gray-200 dark:border-gray-700 hover:border-brand-300'}`}>
                        <input {...register('role')} type="radio" value={r.value} className="sr-only" />
                        <r.icon className={`w-5 h-5 ${role === r.value ? 'text-brand-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${role === r.value ? 'text-brand-700 dark:text-brand-300' : 'text-gray-600 dark:text-gray-300'}`}>{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Department</label>
                  <select {...register('department_id')} id="department_id" className="select">
                    <option value="">Select department…</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {errors.department_id && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.department_id.message}</p>}
                </div>
                {role === 'student' && (
                  <div>
                    <label className="label">Enrollment Number <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input {...register('enrollment_no')} id="enrollment_no" className="input" placeholder="CS2024001" />
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(0)} className="btn-secondary flex-1 justify-center">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <>Create Account <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
