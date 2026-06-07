const express = require('express');
const db = require('../database/db');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');

const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', authenticate, authorize('admin', 'hod'), (req, res) => {
  const user = req.user;
  const deptFilter = user.role === 'hod' ? `WHERE department_id = ${user.department_id}` : '';

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
      SUM(CASE WHEN is_anonymous = 1 THEN 1 ELSE 0 END) as anonymous_count,
      AVG(CASE WHEN resolved_at IS NOT NULL
        THEN (julianday(resolved_at) - julianday(created_at))
        ELSE NULL END) as avg_resolution_days
    FROM complaints ${deptFilter}
  `).get();

  const avgFeedback = db.prepare(`
    SELECT AVG(f.rating) as avg_rating, COUNT(f.id) as feedback_count
    FROM feedback f
    JOIN complaints c ON f.complaint_id = c.id
    ${deptFilter}
  `).get();

  res.json({ ...stats, ...avgFeedback });
});

// GET /api/analytics/by-category
router.get('/by-category', authenticate, authorize('admin', 'hod'), (req, res) => {
  const user = req.user;
  const deptFilter = user.role === 'hod' ? `AND department_id = ${user.department_id}` : '';

  const data = db.prepare(`
    SELECT category, COUNT(*) as count,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM complaints WHERE 1=1 ${deptFilter}
    GROUP BY category ORDER BY count DESC
  `).all();

  res.json(data);
});

// GET /api/analytics/by-department
router.get('/by-department', authenticate, authorize('admin'), (req, res) => {
  const data = db.prepare(`
    SELECT d.name as department, d.code,
      COUNT(c.id) as total,
      SUM(CASE WHEN c.status = 'resolved' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN c.status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN c.priority = 'urgent' THEN 1 ELSE 0 END) as urgent
    FROM departments d
    LEFT JOIN complaints c ON c.department_id = d.id
    GROUP BY d.id ORDER BY total DESC
  `).all();

  res.json(data);
});

// GET /api/analytics/by-month
router.get('/by-month', authenticate, authorize('admin', 'hod'), (req, res) => {
  const user = req.user;
  const deptFilter = user.role === 'hod' ? `AND department_id = ${user.department_id}` : '';

  const data = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM complaints
    WHERE created_at >= datetime('now', '-12 months') ${deptFilter}
    GROUP BY month ORDER BY month ASC
  `).all();

  res.json(data);
});

// GET /api/analytics/resolution-time
router.get('/resolution-time', authenticate, authorize('admin', 'hod'), (req, res) => {
  const user = req.user;
  const deptFilter = user.role === 'hod' ? `AND department_id = ${user.department_id}` : '';

  const data = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month,
      AVG(julianday(resolved_at) - julianday(created_at)) as avg_days,
      COUNT(*) as resolved_count
    FROM complaints
    WHERE resolved_at IS NOT NULL
    AND created_at >= datetime('now', '-12 months') ${deptFilter}
    GROUP BY month ORDER BY month ASC
  `).all();

  const byCategory = db.prepare(`
    SELECT category,
      AVG(julianday(resolved_at) - julianday(created_at)) as avg_days,
      COUNT(*) as count
    FROM complaints
    WHERE resolved_at IS NOT NULL ${deptFilter}
    GROUP BY category ORDER BY avg_days DESC
  `).all();

  res.json({ byMonth: data, byCategory });
});

module.exports = router;
