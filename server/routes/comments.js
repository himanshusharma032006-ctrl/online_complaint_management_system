const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const authenticate = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// GET /api/complaints/:id/comments
router.get('/', authenticate, (req, res) => {
  const { id } = req.params;
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  const isStudent = req.user.role === 'student';
  const comments = db.prepare(`
    SELECT c.*, u.name as author_name, u.role as author_role, u.avatar_url as author_avatar
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.complaint_id = ?
    ${isStudent ? 'AND c.is_internal = 0' : ''}
    ORDER BY c.created_at ASC
  `).all(id);

  res.json(comments);
});

// POST /api/complaints/:id/comments
router.post('/', authenticate, [
  body('content').trim().notEmpty().withMessage('Comment content is required'),
  body('is_internal').optional().isBoolean(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  // Students can only comment on their own complaints
  if (req.user.role === 'student' && complaint.student_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { content, is_internal } = req.body;
  // Students cannot add internal comments
  const internalFlag = req.user.role !== 'student' && is_internal ? 1 : 0;

  const result = db.prepare(`
    INSERT INTO comments (complaint_id, user_id, content, is_internal)
    VALUES (?, ?, ?, ?)
  `).run(id, req.user.id, content, internalFlag);

  // Notify: if staff/hod/admin adds public comment, notify student
  if (!internalFlag && req.user.id !== complaint.student_id) {
    db.prepare(`
      INSERT INTO notifications (user_id, complaint_id, title, message)
      VALUES (?, ?, ?, ?)
    `).run(complaint.student_id, complaint.id, 'New Comment on Your Complaint', `${req.user.name} commented on "${complaint.title}".`);
  }

  const comment = db.prepare(`
    SELECT c.*, u.name as author_name, u.role as author_role, u.avatar_url as author_avatar
    FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(comment);
});

module.exports = router;
