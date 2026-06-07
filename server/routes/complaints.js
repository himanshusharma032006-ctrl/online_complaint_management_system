const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../database/db');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const upload = require('../middleware/upload');

const router = express.Router();

const COMPLAINT_CATEGORIES = [
  'Academic', 'Examination', 'Faculty Behavior', 'Library', 'Hostel',
  'Canteen', 'Transport', 'Infrastructure', 'Sports & Cultural',
  'IT & Labs', 'Administrative', 'Financial/Fee', 'Ragging', 'Other'
];

// Helper: build base query with role filtering
function buildComplaintQuery(user, filters = {}) {
  let conditions = [];
  let params = [];

  // Role-based base filter
  if (user.role === 'student') {
    conditions.push('c.student_id = ?');
    params.push(user.id);
  } else if (user.role === 'staff') {
    conditions.push('c.assigned_to = ?');
    params.push(user.id);
  } else if (user.role === 'hod') {
    conditions.push('c.department_id = ?');
    params.push(user.department_id);
  }
  // admin sees all

  // Additional filters
  if (filters.status) { conditions.push('c.status = ?'); params.push(filters.status); }
  if (filters.priority) { conditions.push('c.priority = ?'); params.push(filters.priority); }
  if (filters.category) { conditions.push('c.category = ?'); params.push(filters.category); }
  if (filters.department_id) { conditions.push('c.department_id = ?'); params.push(parseInt(filters.department_id)); }
  if (filters.from_date) { conditions.push('c.created_at >= ?'); params.push(filters.from_date); }
  if (filters.to_date) { conditions.push('c.created_at <= ?'); params.push(filters.to_date + ' 23:59:59'); }
  if (filters.search) {
    conditions.push('(c.title LIKE ? OR c.description LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

// GET /api/complaints/stats
router.get('/stats', authenticate, authorize('admin', 'hod', 'staff'), (req, res) => {
  const user = req.user;
  let deptFilter = '';
  let params = [];

  if (user.role === 'hod') {
    deptFilter = 'WHERE department_id = ?';
    params = [user.department_id];
  } else if (user.role === 'staff') {
    deptFilter = 'WHERE assigned_to = ?';
    params = [user.id];
  }

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review,
      SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
      SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent
    FROM complaints ${deptFilter}
  `).get(...params);

  res.json(stats);
});

// GET /api/complaints/my  (student's own - alias)
router.get('/my', authenticate, authorize('student'), (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { where, params } = buildComplaintQuery(req.user, req.query);

  const total = db.prepare(`SELECT COUNT(*) as count FROM complaints c ${where}`).get(...params).count;
  const complaints = db.prepare(`
    SELECT c.*, 
      CASE WHEN c.is_anonymous = 1 THEN 'Anonymous' ELSE u.name END as student_name,
      d.name as department_name, d.code as department_code,
      a.name as assigned_to_name
    FROM complaints c
    LEFT JOIN users u ON c.student_id = u.id
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN users a ON c.assigned_to = a.id
    ${where}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ complaints, total, page, totalPages: Math.ceil(total / limit) });
});

// GET /api/complaints
router.get('/', authenticate, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { where, params } = buildComplaintQuery(req.user, req.query);

  const total = db.prepare(`SELECT COUNT(*) as count FROM complaints c ${where}`).get(...params).count;
  const complaints = db.prepare(`
    SELECT c.*,
      CASE WHEN c.is_anonymous = 1 AND ? != 'admin' THEN 'Anonymous' ELSE u.name END as student_name,
      CASE WHEN c.is_anonymous = 1 AND ? != 'admin' THEN NULL ELSE u.email END as student_email,
      d.name as department_name, d.code as department_code,
      a.name as assigned_to_name
    FROM complaints c
    LEFT JOIN users u ON c.student_id = u.id
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN users a ON c.assigned_to = a.id
    ${where}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.role, req.user.role, ...params, limit, offset);

  res.json({ complaints, total, page, totalPages: Math.ceil(total / limit) });
});

// POST /api/complaints
router.post('/', authenticate, authorize('student'), upload.single('attachment'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('category').isIn(COMPLAINT_CATEGORIES).withMessage('Invalid category'),
  body('department_id').isInt().withMessage('Department is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('is_anonymous').optional().isIn(['0', '1', true, false]),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, category, department_id, priority, is_anonymous } = req.body;
  const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;

  const result = db.prepare(`
    INSERT INTO complaints (title, description, category, priority, student_id, department_id, is_anonymous, attachment_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, category, priority || 'medium', req.user.id, department_id, is_anonymous ? 1 : 0, attachment_url);

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(result.lastInsertRowid);

  // Add initial timeline entry
  db.prepare(`
    INSERT INTO complaint_updates (complaint_id, updated_by, old_status, new_status, message)
    VALUES (?, ?, NULL, 'pending', 'Complaint submitted')
  `).run(complaint.id, req.user.id);

  // Notify HOD of the department
  const dept = db.prepare('SELECT hod_id FROM departments WHERE id = ?').get(department_id);
  if (dept && dept.hod_id) {
    db.prepare(`
      INSERT INTO notifications (user_id, complaint_id, title, message)
      VALUES (?, ?, ?, ?)
    `).run(dept.hod_id, complaint.id, 'New Complaint Submitted', `A new complaint "${title}" has been submitted in your department.`);
  }

  res.status(201).json(complaint);
});

// GET /api/complaints/:id
router.get('/:id', authenticate, (req, res) => {
  const complaint = db.prepare(`
    SELECT c.*,
      CASE WHEN c.is_anonymous = 1 AND ? != 'admin' THEN 'Anonymous' ELSE u.name END as student_name,
      CASE WHEN c.is_anonymous = 1 AND ? != 'admin' THEN NULL ELSE u.email END as student_email,
      CASE WHEN c.is_anonymous = 1 AND ? != 'admin' THEN NULL ELSE u.enrollment_no END as enrollment_no,
      d.name as department_name, d.code as department_code,
      a.name as assigned_to_name, a.email as assigned_to_email
    FROM complaints c
    LEFT JOIN users u ON c.student_id = u.id
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN users a ON c.assigned_to = a.id
    WHERE c.id = ?
  `).get(req.user.role, req.user.role, req.user.role, req.params.id);

  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  // Access control: students can only view their own
  if (req.user.role === 'student' && complaint.student_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  // Staff can only view assigned complaints
  if (req.user.role === 'staff' && complaint.assigned_to !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  // HOD can only view department complaints
  if (req.user.role === 'hod' && complaint.department_id !== req.user.department_id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  // Get timeline
  const timeline = db.prepare(`
    SELECT cu.*, u.name as actor_name, u.role as actor_role
    FROM complaint_updates cu
    LEFT JOIN users u ON cu.updated_by = u.id
    WHERE cu.complaint_id = ?
    ORDER BY cu.created_at ASC
  `).all(req.params.id);

  // Get feedback
  const feedback = db.prepare('SELECT * FROM feedback WHERE complaint_id = ?').get(req.params.id);

  res.json({ ...complaint, timeline, feedback });
});

// PATCH /api/complaints/:id/status
router.patch('/:id/status', authenticate, authorize('staff', 'hod', 'admin'), [
  body('status').isIn(['pending', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'closed']).withMessage('Invalid status'),
  body('message').optional().trim(),
  body('resolution_note').optional().trim(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  // Role-based access
  if (req.user.role === 'staff' && complaint.assigned_to !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  if (req.user.role === 'hod' && complaint.department_id !== req.user.department_id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { status, message, resolution_note } = req.body;
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const isResolved = ['resolved', 'rejected', 'closed'].includes(status);

  db.prepare(`
    UPDATE complaints SET status = ?, resolution_note = ?, resolved_at = ?, updated_at = ?
    WHERE id = ?
  `).run(status, resolution_note || complaint.resolution_note, isResolved ? now : complaint.resolved_at, now, complaint.id);

  // Log the update
  db.prepare(`
    INSERT INTO complaint_updates (complaint_id, updated_by, old_status, new_status, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(complaint.id, req.user.id, complaint.status, status, message || `Status changed to ${status}`);

  // Notify student
  db.prepare(`
    INSERT INTO notifications (user_id, complaint_id, title, message)
    VALUES (?, ?, ?, ?)
  `).run(complaint.student_id, complaint.id, 'Complaint Status Updated', `Your complaint "${complaint.title}" status changed to ${status}.`);

  const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaint.id);
  res.json(updated);
});

// PATCH /api/complaints/:id/assign
router.patch('/:id/assign', authenticate, authorize('hod', 'admin'), [
  body('assigned_to').isInt().withMessage('Staff ID required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  if (req.user.role === 'hod' && complaint.department_id !== req.user.department_id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { assigned_to, priority } = req.body;
  const staff = db.prepare('SELECT id, name FROM users WHERE id = ? AND role = ? AND is_active = 1').get(assigned_to, 'staff');
  if (!staff) return res.status(400).json({ error: 'Invalid staff member.' });

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  db.prepare(`
    UPDATE complaints SET assigned_to = ?, status = 'assigned', priority = ?, updated_at = ? WHERE id = ?
  `).run(assigned_to, priority || complaint.priority, now, complaint.id);

  db.prepare(`
    INSERT INTO complaint_updates (complaint_id, updated_by, old_status, new_status, message)
    VALUES (?, ?, ?, 'assigned', ?)
  `).run(complaint.id, req.user.id, complaint.status, `Assigned to ${staff.name}`);

  // Notify assigned staff
  db.prepare(`
    INSERT INTO notifications (user_id, complaint_id, title, message)
    VALUES (?, ?, ?, ?)
  `).run(assigned_to, complaint.id, 'Complaint Assigned to You', `Complaint "${complaint.title}" has been assigned to you.`);

  const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaint.id);
  res.json(updated);
});

// DELETE /api/complaints/:id
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const complaint = db.prepare('SELECT id FROM complaints WHERE id = ?').get(req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  db.prepare('DELETE FROM feedback WHERE complaint_id = ?').run(req.params.id);
  db.prepare('DELETE FROM notifications WHERE complaint_id = ?').run(req.params.id);
  db.prepare('DELETE FROM comments WHERE complaint_id = ?').run(req.params.id);
  db.prepare('DELETE FROM complaint_updates WHERE complaint_id = ?').run(req.params.id);
  db.prepare('DELETE FROM complaints WHERE id = ?').run(req.params.id);

  res.json({ message: 'Complaint deleted successfully.' });
});

// GET /api/complaints/export/csv (admin)
router.get('/export/csv', authenticate, authorize('admin'), (req, res) => {
  const { where, params } = buildComplaintQuery(req.user, req.query);
  const complaints = db.prepare(`
    SELECT c.id, c.title, c.category, c.status, c.priority,
      CASE WHEN c.is_anonymous = 1 THEN 'Anonymous' ELSE u.name END as student_name,
      u.email as student_email, d.name as department, c.created_at, c.resolved_at, c.resolution_note
    FROM complaints c
    LEFT JOIN users u ON c.student_id = u.id
    LEFT JOIN departments d ON c.department_id = d.id
    ${where}
    ORDER BY c.created_at DESC
  `).all(...params);

  const headers = ['ID', 'Title', 'Category', 'Status', 'Priority', 'Student', 'Email', 'Department', 'Created At', 'Resolved At', 'Resolution Note'];
  const rows = complaints.map(c => [
    c.id, `"${c.title}"`, c.category, c.status, c.priority,
    c.student_name, c.student_email || '', c.department,
    c.created_at, c.resolved_at || '', `"${c.resolution_note || ''}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=complaints.csv');
  res.send(csv);
});

module.exports = router;
