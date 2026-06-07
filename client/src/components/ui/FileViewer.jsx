import { FileText, Download, ExternalLink } from 'lucide-react'

export default function FileViewer({ url }) {
  if (!url) return null

  // Ensure url starts with /uploads/ or the full backend URL if necessary
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  const fullUrl = url.startsWith('http') ? url : `${backendUrl}${url}`
  const fileName = url.substring(url.lastIndexOf('/') + 1)
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url)
  const isPdf = /\.pdf$/i.test(url)

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900/50">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[70%]">
          {fileName}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={fullUrl}
            download
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
      <div className="p-4 flex justify-center items-center">
        {isImage ? (
          <img
            src={fullUrl}
            alt={fileName}
            className="max-h-[300px] object-contain rounded-lg shadow-sm"
          />
        ) : isPdf ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <FileText className="w-16 h-16 text-red-500" />
            <span className="text-sm text-gray-500">PDF Document</span>
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              View Document
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <FileText className="w-16 h-16 text-gray-400" />
            <span className="text-sm text-gray-500">Document/Attachment</span>
            <a
              href={fullUrl}
              download
              className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              Download Attachment
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
