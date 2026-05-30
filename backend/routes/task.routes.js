const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { verifyToken, logAudit } = require('../middleware');

// All task routes require authentication
router.use(verifyToken);

// Get all tasks for the logged-in user
router.get('/', (req, res) => {
  db.all(
    `SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC`,
    [req.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

// Create a new task
router.post('/', (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run(
    `INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)`,
    [req.userId, title, description || ''],
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to create task' });
      
      const taskId = this.lastID;
      logAudit(req.userId, 'CREATE_TASK', 'tasks', taskId, `Title: ${title}`);
      
      res.status(201).json({ 
        message: 'Task created successfully',
        task: { id: taskId, title, description, status: 'pending' }
      });
    }
  );
});

// Update a task
router.put('/:id', (req, res) => {
  const taskId = req.params.id;
  const { title, description, status } = req.body;
  
  if (!title && !description && !status) {
    return res.status(400).json({ error: 'No update fields provided' });
  }

  // First verify the task belongs to the user
  db.get(`SELECT * FROM tasks WHERE id = ?`, [taskId], (err, task) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden: You do not own this task' });

    const newTitle = title || task.title;
    const newDescription = description !== undefined ? description : task.description;
    const newStatus = status || task.status;

    db.run(
      `UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?`,
      [newTitle, newDescription, newStatus, taskId],
      function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update task' });
        
        logAudit(req.userId, 'UPDATE_TASK', 'tasks', taskId, `Status: ${newStatus}`);
        res.json({ message: 'Task updated successfully' });
      }
    );
  });
});

// Delete a task
router.delete('/:id', (req, res) => {
  const taskId = req.params.id;

  db.get(`SELECT * FROM tasks WHERE id = ?`, [taskId], (err, task) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden: You do not own this task' });

    db.run(`DELETE FROM tasks WHERE id = ?`, [taskId], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to delete task' });
      
      logAudit(req.userId, 'DELETE_TASK', 'tasks', taskId, `Deleted task: ${task.title}`);
      res.json({ message: 'Task deleted successfully' });
    });
  });
});

module.exports = router;
