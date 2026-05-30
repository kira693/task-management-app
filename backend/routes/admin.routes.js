const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { verifyToken, requireAdmin } = require('../middleware');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(requireAdmin);

// Fetch audit logs
router.get('/logs', (req, res) => {
  const limit = req.query.limit || 50;
  
  // Use a JOIN to get the username along with the log
  db.all(
    `SELECT audit_logs.*, users.username, users.email 
     FROM audit_logs 
     LEFT JOIN users ON audit_logs.user_id = users.id 
     ORDER BY audit_logs.created_at DESC 
     LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error fetching logs' });
      res.json(rows);
    }
  );
});

// Fetch system stats
router.get('/stats', (req, res) => {
  const stats = {};
  
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    stats.totalUsers = row.count;
    
    db.get('SELECT COUNT(*) as count FROM tasks', (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      stats.totalTasks = row.count;
      
      res.json(stats);
    });
  });
});

module.exports = router;
