import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const VISITOR_TYPES = ['guest', 'cab_delivery', 'household_help', 'maintenance_service'];

// Resident creates a pre-approval invite for one of the 4 categories. OTP is valid for 24h by default.
router.post('/', requireAuth, requireRole('resident'), (req, res) => {
  const {
    visitor_type = 'guest', guest_name, guest_phone, valid_hours,
    reference_code, id_card_number, scheduled_date, scheduled_start, scheduled_end
  } = req.body;

  if (!VISITOR_TYPES.includes(visitor_type)) {
    return res.status(400).json({ error: `visitor_type must be one of ${VISITOR_TYPES.join(', ')}` });
  }
  if (!guest_name) return res.status(400).json({ error: 'guest_name is required' });
  if (visitor_type === 'household_help' && !id_card_number) {
    return res.status(400).json({ error: 'id_card_number is required for household help' });
  }
  if (visitor_type === 'maintenance_service' && (!scheduled_date || !scheduled_start || !scheduled_end)) {
    return res.status(400).json({ error: 'scheduled_date, scheduled_start, and scheduled_end are required for maintenance/vendor' });
  }

  const otp_code = generateOtp();
  const hours = Number(valid_hours) > 0 ? Number(valid_hours) : 24;
  const expires_at = new Date(Date.now() + hours * 3600 * 1000).toISOString();

  const result = db.prepare(`
    INSERT INTO invites (
      resident_id, visitor_type, guest_name, guest_phone, reference_code,
      id_card_number, scheduled_date, scheduled_start, scheduled_end, otp_code, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, visitor_type, guest_name, guest_phone || null, reference_code || null,
    id_card_number || null, scheduled_date || null, scheduled_start || null, scheduled_end || null,
    otp_code, expires_at
  );

  const invite = db.prepare('SELECT * FROM invites WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(invite);
});

router.get('/mine', requireAuth, requireRole('resident'), (req, res) => {
  const invites = db.prepare(`
    SELECT * FROM invites WHERE resident_id = ? ORDER BY created_at DESC, id DESC
  `).all(req.user.id);
  res.json(invites);
});

export default router;
