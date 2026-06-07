import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MessageSquare, Send, Calendar, Tag, AlertCircle } from 'lucide-react'
import api from '../../lib/axios'
import { formatDateTime } from '../../lib/utils'
import StatusBadge from '../../components/ui/StatusBadge'
import PriorityBadge from '../../components/ui/PriorityBadge'
import StatusTimeline from '../../components/ui/StatusTimeline'
import FileViewer from '../../components/ui/FileViewer'
import StarRating from '../../components/ui/StarRating'
import { TableSkeleton } from '../../components/ui/LoadingSkeleton'
import { useToast } from '../../components/ui/Toast'

export default function ComplaintDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [commentText, setCommentText] = useState('')
  
  // Feedback Form State
  const [rating, setRating] = useState(5)
  const [feedbackComment, setFeedbackComment] = useState('')

  // Fetch Complaint Details (includes timeline and feedback)
  const { data: complaint, isLoading, error } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => api.get(`/complaints/${id}`).then((r) => r.data)
  })

  // Fetch Comments
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => api.get(`/complaints/${id}/comments`).then((r) => r.data)
  })

  // Submit Comment Mutation
  const commentMutation = useMutation({
    mutationFn: (newComment) => api.post(`/complaints/${id}/comments`, newComment),
    onSuccess: () => {
      setCommentText('')
      queryClient.invalidateQueries(['comments', id])
      toast({ type: 'success', title: 'Comment Posted', message: 'Your comment has been added.' })
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to post comment'
      toast({ type: 'error', title: 'Error', message: msg })
    }
  })

  // Submit Feedback Mutation
  const feedbackMutation = useMutation({
    mutationFn: (feedbackData) => api.post(`/complaints/${id}/feedback`, feedbackData),
    onSuccess: () => {
      queryClient.invalidateQueries(['complaint', id])
      toast({ type: 'success', title: 'Feedback Submitted', message: 'Thank you for your feedback!' })
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to submit feedback'
      toast({ type: 'error', title: 'Error', message: msg })
    }
  })

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    commentMutation.mutate({ content: commentText })
  }

  const handleFeedbackSubmit = (e) => {
    e.preventDefault()
    feedbackMutation.mutate({ rating, comment: feedbackComment })
  }

  if (isLoading) {
    return <TableSkeleton rows={5} cols={5} />
  }

  if (error || !complaint) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>Failed to load complaint. Please return to the list and try again.</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          to="/student/complaints"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-150 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Complaints
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 flex-wrap">
              {complaint.title}
              {complaint.is_anonymous === 1 && (
                <span className="text-xs font-normal bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-0.5 rounded-full">
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
        {/* Main Content (Details & Discussion) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Description */}
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/60 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 mb-4 border-b border-gray-100 dark:border-gray-800/60 pb-2">
              Complaint Description
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
              {complaint.description}
            </p>

            {/* Category / Department detail row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800/60 text-sm">
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

            {/* Attachment */}
            {complaint.attachment_url && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800/60">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Attachment
                </h3>
                <FileViewer url={complaint.attachment_url} />
              </div>
            )}
          </div>

          {/* Feedback Form / Display */}
          {complaint.status === 'resolved' && (
            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/60 rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 mb-4 border-b border-gray-100 dark:border-gray-800/60 pb-2">
                Resolution & Feedback
              </h2>
              {complaint.resolution_note && (
                <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-sm mb-4 leading-relaxed">
                  <p className="font-semibold mb-1">Resolution Note:</p>
                  <p>{complaint.resolution_note}</p>
                </div>
              )}

              {complaint.feedback ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-450">Your Feedback:</p>
                  <div className="flex items-center gap-2">
                    <StarRating value={complaint.feedback.rating} readOnly />
                    <span className="text-xs text-gray-400">
                      Submitted on {formatDateTime(complaint.feedback.created_at)}
                    </span>
                  </div>
                  {complaint.feedback.comment && (
                    <p className="text-sm italic text-gray-600 dark:text-gray-400 bg-gray-55/60 dark:bg-gray-850 p-3 rounded-lg">
                      "{complaint.feedback.comment}"
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    How would you rate the resolution of your complaint?
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-750 dark:text-gray-250">Rating:</span>
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-750 dark:text-gray-250 mb-1">
                      Comment (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Share your experience with the resolution..."
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={feedbackMutation.isLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm"
                  >
                    {feedbackMutation.isLoading ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Comments Discussion Section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/60 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 mb-4 border-b border-gray-100 dark:border-gray-800/60 pb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              Discussion Board
            </h2>

            {/* Comment List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-6">
              {isLoadingComments ? (
                <div className="text-center text-sm text-gray-400 py-4">Loading comments...</div>
              ) : !comments.length ? (
                <div className="text-center text-sm text-gray-400 py-6">
                  No discussion yet. Leave a message below to reach out to departments or support staff.
                </div>
              ) : (
                comments.map((comm) => (
                  <div key={comm.id} className="flex gap-3 items-start text-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-650 dark:text-blue-350 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                      {comm.author_name ? comm.author_name[0] : 'U'}
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 border border-gray-150 dark:border-gray-800 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className="font-semibold text-gray-800 dark:text-gray-250">
                          {comm.author_name || 'System'}
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-2 capitalize">
                            ({comm.author_role})
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

            {/* Comment Input */}
            <form onSubmit={handleCommentSubmit} className="flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={commentMutation.isLoading || !commentText.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center h-10 w-10 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Info (Timeline / Assignee Info) */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/60 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 mb-4 border-b border-gray-100 dark:border-gray-800/60 pb-2">
              Status History
            </h2>
            <StatusTimeline timeline={complaint.timeline || []} />
          </div>

          {/* Assigned Staff Info */}
          {complaint.assigned_to_name && (
            <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/60 rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-105 mb-4 border-b border-gray-100 dark:border-gray-800/60 pb-2">
                Handling Agent
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-650 dark:text-purple-350 flex items-center justify-center font-bold text-sm uppercase">
                  {complaint.assigned_to_name[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-850 dark:text-gray-200 text-sm">
                    {complaint.assigned_to_name}
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {complaint.assigned_to_email || 'Staff Representative'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
