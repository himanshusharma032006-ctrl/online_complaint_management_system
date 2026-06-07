import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronRight, ChevronLeft, Upload, X, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import api from '../../lib/axios'
import { useToast } from '../../components/ui/Toast'
import { CATEGORIES, getErrorMessage } from '../../lib/utils'

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  department_id: z.string().min(1, 'Please select a department'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  is_anonymous: z.boolean(),
})

const STEPS = ['Category', 'Details', 'Attachment & Options', 'Review & Submit']

export default function NewComplaint() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data),
  })

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', is_anonymous: false },
  })

  const values = watch()

  const mutation = useMutation({
    mutationFn: async (data) => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => fd.append(k, v))
      if (file) fd.append('attachment', file)
      return api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: (res) => {
      toast({ type: 'success', title: 'Complaint submitted!', message: 'Your complaint has been submitted successfully.' })
      navigate(`/student/complaints/${res.data.id}`)
    },
    onError: (err) => toast({ type: 'error', title: 'Submission failed', message: getErrorMessage(err) }),
  })

  const stepFields = [
    ['category'],
    ['title', 'description', 'department_id'],
    [],
    [],
  ]

  const next = async () => {
    const valid = await trigger(stepFields[step])
    if (valid) setStep(s => s + 1)
  }

  const handleFile = (f) => {
    if (f && f.size > 5 * 1024 * 1024) {
      toast({ type: 'error', title: 'File too large', message: 'Maximum file size is 5MB.' })
      return
    }
    setFile(f)
  }

  const selectedDept = departments.find(d => d.id === parseInt(values.department_id))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Stepper */}
      <div className="card p-4">
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${i < step ? 'bg-brand-600 text-white cursor-pointer' : i === step ? 'bg-brand-100 text-brand-700 border-2 border-brand-500 dark:bg-brand-950/60 dark:text-brand-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}
              >
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </button>
              <span className={`text-xs font-medium hidden sm:block whitespace-nowrap ${i === step ? 'text-brand-700 dark:text-brand-300' : i < step ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full min-w-[12px] ${i < step ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
        <div className="card p-6 space-y-5 animate-fade-in">

          {/* Step 0 – Category */}
          {step === 0 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Select Complaint Category</h2>
                <p className="text-sm text-gray-500 mt-1">What is your complaint related to?</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CATEGORIES.map(cat => (
                  <label key={cat} className={`relative flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm
                    ${values.category === cat ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                    <input {...register('category')} type="radio" value={cat} className="sr-only" />
                    {values.category === cat && <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-brand-600" />}
                    {cat}
                  </label>
                ))}
              </div>
              {errors.category && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.category.message}</p>}
            </>
          )}

          {/* Step 1 – Details */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Complaint Details</h2>
                <p className="text-sm text-gray-500 mt-1">Describe your issue clearly and concisely</p>
              </div>
              <div>
                <label className="label">Title <span className="text-red-500">*</span></label>
                <input {...register('title')} id="comp-title" className="input" placeholder="Brief title of your complaint" />
                {errors.title && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title.message}</p>}
              </div>
              <div>
                <label className="label">Description <span className="text-red-500">*</span></label>
                <textarea {...register('description')} id="comp-desc" rows={5} className="input resize-none" placeholder="Provide a detailed description of your complaint (minimum 20 characters)..." />
                <div className="flex justify-between mt-1">
                  {errors.description ? <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.description.message}</p> : <span />}
                  <span className="text-xs text-gray-400">{values.description?.length || 0} chars</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Department <span className="text-red-500">*</span></label>
                  <select {...register('department_id')} id="comp-dept" className="select">
                    <option value="">Select...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.code} – {d.name}</option>)}
                  </select>
                  {errors.department_id && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.department_id.message}</p>}
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select {...register('priority')} id="comp-priority" className="select">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Step 2 – Attachment & Options */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Attachment & Options</h2>
                <p className="text-sm text-gray-500 mt-1">Optionally attach supporting evidence</p>
              </div>

              {/* File Upload */}
              <div>
                <label className="label">Attachment <span className="text-gray-400 font-normal">(optional – max 5MB)</span></label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                    ${dragOver ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/30' : 'border-gray-300 dark:border-gray-700 hover:border-brand-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 bg-brand-100 dark:bg-brand-950/40 rounded-lg">
                        <Upload className="w-5 h-5 text-brand-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drop file here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">JPEG, PNG, PDF — max 5MB</p>
                    </>
                  )}
                  <input id="file-input" type="file" accept="image/*,.pdf" className="sr-only" onChange={e => handleFile(e.target.files[0])} />
                </div>
              </div>

              {/* Anonymous Option */}
              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-brand-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                <input {...register('is_anonymous')} id="is-anon" type="checkbox" className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                <div>
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Submit Anonymously</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Your identity will be hidden from staff and HOD. Only admin can see your name.</p>
                </div>
              </label>
            </>
          )}

          {/* Step 3 – Review */}
          {step === 3 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Review & Submit</h2>
                <p className="text-sm text-gray-500 mt-1">Please review your complaint before submitting</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 space-y-3">
                {[
                  ['Category', values.category],
                  ['Title', values.title],
                  ['Department', selectedDept ? `${selectedDept.code} – ${selectedDept.name}` : values.department_id],
                  ['Priority', values.priority?.charAt(0).toUpperCase() + values.priority?.slice(1)],
                  ['Anonymous', values.is_anonymous ? 'Yes' : 'No'],
                  ['Attachment', file ? file.name : 'None'],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">{k}</span>
                    <span className="text-sm text-gray-800 dark:text-gray-200">{v}</span>
                  </div>
                ))}
                <div className="flex gap-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">Description</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{values.description}</p>
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1 justify-center">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="btn-primary flex-1 justify-center">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Complaint'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
