import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin', 'guard'), (req, res) => {
  res.json(db.prepare('SELECT * FROM staff_registry ORDER BY created_at DESC').all());
});

router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const { name, id_card_number, category, flat_number, shift_start, shift_end } = req.body;
  if (!name || !id_card_number || !category) {
    return res.status(400).json({ error: 'name, id_card_number, and category are required' });
  }
  if (!['household_help', 'maintenance_vendor'].includes(category)) {
    return res.status(400).json({ error: 'category must be household_help or maintenance_vendor' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO staff_registry (name, id_card_number, category, flat_number, shift_start, shift_end)
      VALUES (?, ?, ?, ?, COALESCE(?, '06:00'), COALESCE(?, '21:00'))
    `).run(name, id_card_number, category, flat_number || null, shift_start, shift_end);
    res.status(201).json(db.prepare('SELECT * FROM staff_registry WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'id_card_number already registered' });
    }
    throw err;
  }
});

router.patch('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM staff_registry WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { active } = req.body;
  db.prepare('UPDATE staff_registry SET active = ? WHERE id = ?').run(active ? 1 : 0, req.params.id);
  res.json(db.prepare('SELECT * FROM staff_registry WHERE id = ?').get(req.params.id));
});

export default router;
