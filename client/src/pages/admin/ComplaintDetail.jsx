import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MessageSquare, Send, Calendar, Tag, AlertCircle, Trash2, UserCheck, Shield } from 'lucide-react'
import api from '../../lib/axios'
import { formatDateTime } from '../../lib/utils'
import StatusBadge from '../../components/ui/StatusBadge'
import PriorityBadge from '../../components/ui/PriorityBadge'
import StatusTimeline from '../../components/ui/StatusTimeline'
import FileViewer from '../../components/ui/FileViewer'
import StarRating from '../../components/ui/StarRating'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToast } from '../../components/ui/Toast'

export default function AdminComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Form states
  const [commentText, setCommentText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Status update states
  const [status, setStatus] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')
  const [resolutionNote, setResolutionNote] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Coordinator Assignment states
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isAssigning, setIsAssigning] = useState(false)

  // Fetch Complaint
  const { data: complaint, isLoading, error } = useQuery({
    queryKey: ['admin-complaint', id],
    queryFn: () => api.get(`/complaints/${id}`).then((r) => r.data),
    onSuccess: (data) => {
      setStatus(data.status)
      setResolutionNote(data.resolution_note || '')
      setAssignedTo(data.assigned_to || '')
      setPriority(data.priority || 'medium')
    }
  })

  // Fetch All Staff in the complaint's department
  const { data: staffList = [] } = useQuery({
    queryKey: ['admin-dept-staff', complaint?.department_id],
    queryFn: () =>
      api
        .get('/users/staff', { params: { department_id: complaint.department_id } })
        .then((r) => r.data),
    enabled: !!complaint?.department_id
  })

  // Fetch Comments
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['admin-comments', id],
    queryFn: () => api.get(`/complaints/${id}/comments`).then((r) => r.data)
  })

  // Submit Comment
  const commentMutation = useMutation({
    mutationFn: (payload) => api.post(`/complaints/${id}/comments`, payload),
    onSuccess: () => {
      setCommentText('')
      setIsInternal(false)
      queryClient.invalidateQueries(['admin-comments', id])
      toast({ type: 'success', title: 'Comment Posted', message: 'Comment added successfully.' })
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to post comment'
      toast({ type: 'error', title: 'Error', message: msg })
    }
  })

  // Update Status
  const statusMutation = useMutation({
    mutationFn: (payload) => api.patch(`/complaints/${id}/status`, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries(['admin-complaint', id])
      queryClient.invalidateQueries(['admin-stats'])
      setIsUpdatingStatus(false)
      setUpdateMessage('')
      toast({ type: 'success', title: 'Status Updated', message: `Complaint status is now: ${updated.status}.` })
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to update status'
      toast({ type: 'error', title: 'Error', message: msg })
    }
  })

  // Assign Coordinator
  const assignMutation = useMutation({
    mutationFn: (payload) => api.patch(`/complaints/${id}/assign`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-complaint', id])
      queryClient.invalidateQueries(['admin-stats'])
      setIsAssigning(false)
      toast({ type: 'success', title: 'Coordinator Assigned', message: 'Coordinator assigned successfully.' })
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to assign coordinator'
      toast({ type: 'error', title: 'Error', message: msg })
    }
  })

  // Delete Complaint
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/complaints/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-complaints'])
      queryClient.invalidateQueries(['admin-stats'])
      toast({ type: 'success', title: 'Complaint Deleted', message: 'Complaint has been removed permanently.' })
      navigate('/admin/complaints')
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to delete complaint'
      toast({ type: 'error', title: 'Error', message: msg })
    }
  })

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    commentMutation.mutate({ content: commentText, is_internal: isInternal })
  }

  const handleStatusSubmit = (e) => {
    e.preventDefault()
    if (!status) return
    statusMutation.mutate({
      status,
      message: updateMessage,
      resolution_note: ['resolved', 'rejected', 'closed'].includes(status) ? resolutionNote : undefined
    })
  }

  const handleAssignSubmit = (e) => {
    e.preventDefault()
    if (!assignedTo) return
    assignMutation.mutate({
      assigned_to: parseInt(assignedTo),
      priority
    })
  }

  if (isLoading) {
    return <TableSkeleton rows={5} cols={5} />
  }

  if (error || !complaint) {
    return (
      <div className="bg-red-50 dark:bg-red-95/20 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>Failed to load complaint. Please try again.</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center w-full">
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-150 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Auditing Feed
          </Link>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Complaint
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 flex-wrap">
              {complaint.title}
              {complaint.is_anonymous === 1 && (
                <span className="text-xs font-normal bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 px-2.5 py-0.5 rounded-full">
                  Anonymous Submission
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Complaint ID: #{complaint.id} • Submitted on {formatDateTime(complaint.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
              Complaint Description
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
              {complaint.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-sm">
              <div className="flex items-center gap-2 text-gray-650 dark:text-gray-350">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Category:</span>
                <span>{complaint.category}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-650 dark:text-gray-350">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Department:</span>
                <span>{complaint.department_name || 'General'}</span>
              </div>
            </div>

            {complaint.attachment_url && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-850 dark:text-gray-200 mb-3">
                  Attachment
                </h3>
                <FileViewer url={complaint.attachment_url} />
              </div>
            )}
          </div>

          {/* Discussion */}
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              Discussion & Notes Audit
            </h2>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 mb-6">
              {isLoadingComments ? (
                <div className="text-center text-sm text-gray-450 py-4">Loading comments...</div>
              ) : !comments.length ? (
                <div className="text-center text-sm text-gray-450 py-6">
                  No discussion yet.
                </div>
              ) : (
                comments.map((comm) => (
                  <div key={comm.id} className="flex gap-3 items-start text-sm">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${comm.is_internal
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-blue-105 dark:bg-blue-900/40 text-blue-650 dark:text-blue-350'
                      }`}>
                      {comm.author_name ? comm.author_name[0] : 'U'}
                    </div>
                    <div className={`flex-1 border rounded-xl p-3.5 ${comm.is_internal
                        ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-200/60 dark:border-amber-900/40'
                        : 'bg-gray-50 dark:bg-gray-900/50 border-gray-150 dark:border-gray-800'
                      }`}>
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className="font-semibold text-gray-850 dark:text-gray-200">
                          {comm.author_name || 'System'}
                          <span className="text-xs text-gray-400 font-normal ml-2 capitalize">
                            ({comm.author_role})
                            {comm.is_internal === 1 && (
                              <span className="ml-2 font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide text-[10px]">
                                Internal Note
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDateTime(comm.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comm.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <textarea
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type a reply or internal note audit..."
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-700 text-amber-600 focus:ring-amber-500"
                  />
                  Internal Note (Hidden from Complainant)
                </label>
                <button
                  type="submit"
                  disabled={commentMutation.isLoading || !commentText.trim()}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post Reply
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          {/* Assignment Section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-650" />
              Staff Allocation
            </h2>
            {isAssigning ? (
              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Select Staff Coordinator
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-850 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">-- Choose Coordinator --</option>
                    {staffList.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Set Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-850 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={assignMutation.isLoading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-xl transition-all"
                  >
                    {assignMutation.isLoading ? 'Assigning...' : 'Assign Staff'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssigning(false)
                      setAssignedTo(complaint.assigned_to || '')
                      setPriority(complaint.priority || 'medium')
                    }}
                    className="flex-1 border border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold py-2 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-sm">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Assigned Coordinator</p>
                  {complaint.assigned_to_name ? (
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-650 dark:text-purple-350 flex items-center justify-center font-bold text-xs uppercase">
                        {complaint.assigned_to_name[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-855 dark:text-gray-200 text-sm">
                          {complaint.assigned_to_name}
                        </h4>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          {complaint.assigned_to_email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-yellow-600 dark:text-yellow-500 font-medium italic text-xs mt-1">
                      Unassigned - Pending Allocation
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setIsAssigning(true)}
                  className="w-full border border-purple-205 hover:bg-purple-50/50 dark:border-purple-900/40 dark:hover:bg-purple-950/20 text-purple-600 dark:text-purple-400 text-xs font-semibold py-2.5 rounded-xl transition-all"
                >
                  {complaint.assigned_to_name ? 'Reassign Coordinator' : 'Allocate Coordinator'}
                </button>
              </div>
            )}
          </div>

          {/* Action Center - Change Status */}
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
              Action Center (Status)
            </h2>
            {isUpdatingStatus ? (
              <form onSubmit={handleStatusSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Select New Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm text-gray-850 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Log Message (Internal update log)
                  </label>
                  <textarea
                    rows={2}
                    value={updateMessage}
                    onChange={(e) => setUpdateMessage(e.target.value)}
                    placeholder="Describe progress or action taken..."
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {['resolved', 'rejected', 'closed'].includes(status) && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Resolution Note (Sent to Student)
                    </label>
                    <textarea
                      rows={3}
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Explain resolution details..."
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={statusMutation.isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-xl transition-all"
                  >
                    {statusMutation.isLoading ? 'Saving...' : 'Save Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUpdatingStatus(false)
                      setStatus(complaint.status)
                    }}
                    className="flex-1 border border-gray-200 dark:border-gray-805 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-600 dark:text-gray-400 text-xs font-semibold py-2 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-sm">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Current State</p>
                  <div className="flex items-center gap-2 capitalize">
                    <StatusBadge status={complaint.status} />
                  </div>
                </div>

                {complaint.resolution_note && (
                  <div className="text-sm border-t border-gray-100 dark:border-gray-800 pt-3">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Resolution Note</p>
                    <p className="text-gray-700 dark:text-gray-300 italic font-medium">"{complaint.resolution_note}"</p>
                  </div>
                )}

                <button
                  onClick={() => setIsUpdatingStatus(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Update Progress / Status
                </button>
              </div>
            )}
          </div>

          {/* Student Info Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 mb-4 border-b border-gray-100 dark:border-gray-805 pb-2">
              Complainant Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-650 dark:text-blue-350 flex items-center justify-center font-bold text-sm uppercase">
                  {complaint.student_name ? complaint.student_name[0] : 'S'}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-855 dark:text-gray-200 text-sm">
                    {complaint.student_name}
                    {complaint.is_anonymous === 1 && (
                      <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-300 px-1.5 py-0.5 rounded-md ml-1.5 uppercase">
                        Anon
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-405 dark:text-gray-500 truncate max-w-[150px]">
                    {complaint.student_email}
                  </p>
                </div>
              </div>
              {complaint.enrollment_no && (
                <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-105 dark:border-gray-805 pt-2 flex justify-between">
                  <span className="font-semibold">Roll No:</span>
                  <span>{complaint.enrollment_no}</span>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Display */}
          {complaint.feedback && (
            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 mb-4 border-b border-gray-100 dark:border-gray-805 pb-2">
                Satisfaction Rating
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <StarRating value={complaint.feedback.rating} readOnly />
                  <span className="text-sm font-bold text-gray-850 dark:text-gray-200">
                    {complaint.feedback.rating}/5
                  </span>
                </div>
                {complaint.feedback.comment && (
                  <p className="text-xs italic text-gray-600 dark:text-gray-400 bg-gray-55 dark:bg-gray-850 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    "{complaint.feedback.comment}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 mb-4 border-b border-gray-100 dark:border-gray-805 pb-2">
              Timeline Stepper
            </h2>
            <StatusTimeline timeline={complaint.timeline || []} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false)
          deleteMutation.mutate()
        }}
        title="Permanently Delete Complaint?"
        description="This will delete the complaint, all of its status logs, attachments, comments, and student feedback. This action is irreversible."
        confirmLabel="Yes, Delete permanently"
        loading={deleteMutation.isLoading}
      />
    </div>
  )
}
