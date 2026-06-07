const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

// GET /api/users (admin)
router.get('/', authenticate, authorize('admin'), (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const role = req.query.role || '';

  let conditions = [];
  let params = [];
  if (search) { conditions.push('(u.name LIKE ? OR u.email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (role) { conditions.push('u.role = ?'); params.push(role); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM users u ${where}`).get(...params).count;
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.department_id, u.enrollment_no, u.avatar_url, u.is_active, u.created_at,
           d.name as department_name, d.code as department_code
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    ${where}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
});

// GET /api/users/staff (for assignment dropdown)
router.get('/staff', authenticate, authorize('hod', 'admin'), (req, res) => {
  const deptId = req.user.role === 'hod' ? req.user.department_id : req.query.department_id;
  let query = `SELECT id, name, email, department_id FROM users WHERE role = 'staff' AND is_active = 1`;
  let params = [];
  if (deptId) { query += ' AND department_id = ?'; params.push(deptId); }
  const staff = db.prepare(query).all(...params);
  res.json(staff);
});

// POST /api/users (admin)
router.post('/', authenticate, authorize('admin'), [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['student', 'staff', 'hod', 'admin']),
  body('department_id').optional().isInt(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role, department_id, enrollment_no } = req.body;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already exists.' });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password, role, department_id, enrollment_no)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, email, hashed, role, department_id || null, enrollment_no || null);

  const user = db.prepare('SELECT id, name, email, role, department_id, enrollment_no, is_active FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

// PATCH /api/users/:id
router.patch('/:id', authenticate, (req, res) => {
  // User can update own profile, admin can update anyone
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const { name, email, role, department_id, enrollment_no, is_active, password } = req.body;
  const updates = [];
  const params = [];

  if (name) { updates.push('name = ?'); params.push(name); }
  if (email && req.user.role === 'admin') { updates.push('email = ?'); params.push(email); }
  if (role && req.user.role === 'admin') { updates.push('role = ?'); params.push(role); }
  if (department_id !== undefined && req.user.role === 'admin') { updates.push('department_id = ?'); params.push(department_id); }
  if (enrollment_no !== undefined) { updates.push('enrollment_no = ?'); params.push(enrollment_no); }
  if (is_active !== undefined && req.user.role === 'admin') { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
  if (password) { updates.push('password = ?'); params.push(bcrypt.hashSync(password, 10)); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });

  params.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT id, name, email, role, department_id, enrollment_no, avatar_url, is_active FROM users WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/users/:id (admin)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account.' });
  }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deactivated successfully.' });
});

module.exports = router;
