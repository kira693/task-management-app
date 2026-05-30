const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const { JWT_SECRET, logAudit } = require('../middleware');

// Registration endpoint
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if it's the first user, make them admin
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      const role = row.count === 0 ? 'admin' : 'user';

      db.run(
        `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
        [username, email, hashedPassword, role],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(409).json({ error: 'Username or email already exists' });
            }
            return res.status(500).json({ error: 'Registration failed' });
          }
          
          logAudit(this.lastID, 'REGISTER', 'users', this.lastID, `Role: ${role}`);
          res.status(201).json({ message: 'User registered successfully' });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token (defaulting to 1 hour expiration as per plan assumption)
    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    logAudit(user.id, 'LOGIN', 'auth', null, 'Successful login');
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  });
});

module.exports = router;
