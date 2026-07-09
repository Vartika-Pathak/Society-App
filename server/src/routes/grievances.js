import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();
const CATEGORIES = ['maintenance', 'security', 'noise', 'other'];

router.post('/', requireAuth, requireRole('resident'), (req, res) => {
  const { category, description } = req.body;
  if (!category || !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of ${CATEGORIES.join(', ')}` });
  }
  if (!description) return res.status(400).json({ error: 'description is required' });

  const result = db.prepare(`
    INSERT INTO grievances (resident_id, flat_number, category, description)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, req.user.flat_number, category, description);

  res.status(201).json(db.prepare('SELECT * FROM grievances WHERE id = ?').get(result.lastInsertRowid));
});

router.get('/mine', requireAuth, requireRole('resident'), (req, res) => {
  res.json(db.prepare(`
    SELECT * FROM grievances WHERE resident_id = ? ORDER BY created_at DESC, id DESC
  `).all(req.user.id));
});

router.get('/', requireAuth, requireRole('admin'), (req, res) => {
  res.json(db.prepare('SELECT * FROM grievances ORDER BY created_at DESC, id DESC').all());
});

router.patch('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM grievances WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { status, admin_note } = req.body;
  if (!['open', 'in_progress', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  db.prepare(`
    UPDATE grievances SET status = ?, admin_note = COALESCE(?, admin_note), updated_at = datetime('now')
    WHERE id = ?
  `).run(status, admin_note || null, req.params.id);

  res.json(db.prepare('SELECT * FROM grievances WHERE id = ?').get(req.params.id));
});

export default router;
