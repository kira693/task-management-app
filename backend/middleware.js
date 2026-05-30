const jwt = require('jsonwebtoken');
const db = require('./db/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_dev_only';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(403).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"
  if (!token) {
    return res.status(403).json({ error: 'Invalid token format' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    // Log the unauthorized access attempt
    db.run(
      `INSERT INTO audit_logs (user_id, action, entity, details) VALUES (?, ?, ?, ?)`,
      [req.userId, 'UNAUTHORIZED_ACCESS_ATTEMPT', 'admin_routes', req.originalUrl]
    );
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// Helper for audit logging
const logAudit = (userId, action, entity, entityId, details) => {
  db.run(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)`,
    [userId, action, entity, entityId, details],
    (err) => {
      if (err) console.error('Failed to write audit log:', err.message);
    }
  );
};

module.exports = {
  verifyToken,
  requireAdmin,
  logAudit,
  JWT_SECRET
};
