import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin', 'guard'), (req, res) => {
  res.json(db.prepare('SELECT * FROM service_requests ORDER BY scheduled_date DESC').all());
});

router.post('/', requireAuth, requireRole('admin'), (req, res) => {
  const { vendor_name, flat_number, scheduled_date, scheduled_start, scheduled_end } = req.body;
  if (!vendor_name || !scheduled_date || !scheduled_start || !scheduled_end) {
    return res.status(400).json({ error: 'vendor_name, scheduled_date, scheduled_start, scheduled_end are required' });
  }
  const result = db.prepare(`
    INSERT INTO service_requests (vendor_name, flat_number, scheduled_date, scheduled_start, scheduled_end)
    VALUES (?, ?, ?, ?, ?)
  `).run(vendor_name, flat_number || null, scheduled_date, scheduled_start, scheduled_end);
  res.status(201).json(db.prepare('SELECT * FROM service_requests WHERE id = ?').get(result.lastInsertRowid));
});

router.patch('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { status } = req.body;
  if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  db.prepare('UPDATE service_requests SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json(db.prepare('SELECT * FROM service_requests WHERE id = ?').get(req.params.id));
});

export default router;
