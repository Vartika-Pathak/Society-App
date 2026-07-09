import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// Any logged-in role can post a notice; everyone can view all notices.
router.post('/', requireAuth, (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body are required' });

  const result = db.prepare(`
    INSERT INTO notices (author_id, author_name, author_role, title, body)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, req.user.name, req.user.role, title, body);

  res.status(201).json(db.prepare('SELECT * FROM notices WHERE id = ?').get(result.lastInsertRowid));
});

router.get('/', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM notices ORDER BY created_at DESC, id DESC').all());
});

export default router;
