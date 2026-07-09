import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Resident creates a guest invite. OTP is valid for 24h by default.
router.post('/', requireAuth, requireRole('resident'), (req, res) => {
  const { guest_name, guest_phone, valid_hours } = req.body;
  if (!guest_name) return res.status(400).json({ error: 'guest_name is required' });

  const otp_code = generateOtp();
  const hours = Number(valid_hours) > 0 ? Number(valid_hours) : 24;
  const expires_at = new Date(Date.now() + hours * 3600 * 1000).toISOString();

  const result = db.prepare(`
    INSERT INTO invites (resident_id, guest_name, guest_phone, otp_code, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, guest_name, guest_phone || null, otp_code, expires_at);

  const invite = db.prepare('SELECT * FROM invites WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(invite);
});

router.get('/mine', requireAuth, requireRole('resident'), (req, res) => {
  const invites = db.prepare(`
    SELECT * FROM invites WHERE resident_id = ? ORDER BY created_at DESC
  `).all(req.user.id);
  res.json(invites);
});

export default router;
