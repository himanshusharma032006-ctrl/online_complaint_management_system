const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

// GET /api/departments
router.get('/', authenticate, (req, res) => {
  const departments = db.prepare(`
    SELECT d.*, u.name as hod_name, u.email as hod_email,
           COUNT(c.id) as complaint_count
    FROM departments d
    LEFT JOIN users u ON d.hod_id = u.id
    LEFT JOIN complaints c ON c.department_id = d.id
    GROUP BY d.id
    ORDER BY d.name
  `).all();
  res.json(departments);
});

// POST /api/departments (admin)
router.post('/', authenticate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('hod_id').optional().isInt(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, code, hod_id } = req.body;
  const existing = db.prepare('SELECT id FROM departments WHERE code = ?').get(code.toUpperCase());
  if (existing) return res.status(409).json({ error: 'Department code already exists.' });

  const result = db.prepare('INSERT INTO departments (name, code, hod_id) VALUES (?, ?, ?)').run(name, code.toUpperCase(), hod_id || null);
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(dept);
});

// PATCH /api/departments/:id (admin)
router.patch('/:id', authenticate, authorize('admin'), [
  body('name').optional().trim().notEmpty(),
  body('hod_id').optional().isInt(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
  if (!dept) return res.status(404).json({ error: 'Department not found.' });

  const { name, hod_id } = req.body;
  const updates = [];
  const params = [];
  if (name) { updates.push('name = ?'); params.push(name); }
  if (hod_id !== undefined) {
    updates.push('hod_id = ?');
    params.push(hod_id || null);
    // Update user role to HOD
    if (hod_id) {
      db.prepare("UPDATE users SET role = 'hod', department_id = ? WHERE id = ?").run(dept.id, hod_id);
    }
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });
  params.push(req.params.id);
  db.prepare(`UPDATE departments SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare(`
    SELECT d.*, u.name as hod_name FROM departments d LEFT JOIN users u ON d.hod_id = u.id WHERE d.id = ?
  `).get(req.params.id);
  res.json(updated);
});

// DELETE /api/departments/:id (admin)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
  if (!dept) return res.status(404).json({ error: 'Department not found.' });

  const complaintsCount = db.prepare('SELECT COUNT(*) as count FROM complaints WHERE department_id = ?').get(req.params.id).count;
  if (complaintsCount > 0) {
    return res.status(400).json({ error: 'Cannot delete department with existing complaints.' });
  }

  db.prepare('DELETE FROM departments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Department deleted successfully.' });
});

module.exports = router;
