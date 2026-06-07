import { useState } from 'react'
import { Settings, Shield, Save, CheckCircle2 } from 'lucide-react'
import { useToast } from '../../components/ui/Toast'

export default function AdminSettings() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    collegeName: 'State Technical Institute of Technology',
    adminEmail: 'admin@college.edu',
    allowAnonymous: true,
    maxUploadSize: '5',
    maintenanceMode: false
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast({ type: 'success', title: 'Settings Saved', message: 'System configurations updated successfully.' })
    }, 800)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-500" />
          System Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure institutional preferences and global system constraints.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General preferences */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            General Configurations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-505 uppercase tracking-wider mb-1">
                College/Institution Name
              </label>
              <input
                type="text"
                name="collegeName"
                value={settings.collegeName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-900 dark:text-gray-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-505 uppercase tracking-wider mb-1">
                System Support Email
              </label>
              <input
                type="email"
                name="adminEmail"
                value={settings.adminEmail}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-900 dark:text-gray-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-550 uppercase tracking-wider mb-1">
                Max Attachment File Size (MB)
              </label>
              <select
                name="maxUploadSize"
                value={settings.maxUploadSize}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="2">2 MB</option>
                <option value="5">5 MB (Standard)</option>
                <option value="10">10 MB</option>
                <option value="20">20 MB</option>
              </select>
            </div>
          </div>
        </div>

        {/* Access controls toggles */}
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 border-b border-gray-100 dark:border-gray-800 pb-2">
            Policy & Security Rules
          </h2>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="allowAnonymous"
                checked={settings.allowAnonymous}
                onChange={handleChange}
                className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 mt-1"
              />
              <div>
                <p className="text-sm font-semibold text-gray-850 dark:text-gray-200">Enable Anonymous Complaints</p>
                <p className="text-xs text-gray-450 dark:text-gray-500">
                  Allow students to submit logs without revealing identity to departmental leaders (admins can audit).
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none border-t border-gray-100 dark:border-gray-800 pt-4">
              <input
                type="checkbox"
                name="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={handleChange}
                className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 mt-1"
              />
              <div>
                <p className="text-sm font-semibold text-gray-850 dark:text-gray-200">Maintenance & Lock Mode</p>
                <p className="text-xs text-gray-450 dark:text-gray-500">
                  Freeze all new complaint submissions or status updates. System will enter read-only mode for audit compliance.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-105 dark:border-gray-800">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-750 disabled:opacity-55 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
