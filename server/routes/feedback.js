const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router({ mergeParams: true });

// POST /api/complaints/:id/feedback
router.post('/', authenticate, authorize('student'), [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });
  if (complaint.student_id !== req.user.id) return res.status(403).json({ error: 'Access denied.' });
  if (complaint.status !== 'resolved') return res.status(400).json({ error: 'Can only give feedback on resolved complaints.' });

  const existing = db.prepare('SELECT id FROM feedback WHERE complaint_id = ?').get(req.params.id);
  if (existing) return res.status(409).json({ error: 'Feedback already submitted.' });

  const { rating, comment } = req.body;
  const result = db.prepare('INSERT INTO feedback (complaint_id, student_id, rating, comment) VALUES (?, ?, ?, ?)').run(req.params.id, req.user.id, rating, comment || null);
  const feedback = db.prepare('SELECT * FROM feedback WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(feedback);
});

// GET /api/complaints/:id/feedback
router.get('/', authenticate, (req, res) => {
  const feedback = db.prepare('SELECT * FROM feedback WHERE complaint_id = ?').get(req.params.id);
  if (!feedback) return res.status(404).json({ error: 'No feedback found.' });
  res.json(feedback);
});

module.exports = router;
