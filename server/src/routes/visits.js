import { Router } from 'express';
import { requireAuth, requireRole } from '../auth.js';
import {
  checkIn, residentDecision, adminDecision, depart,
  getPendingForResident, getEscalations, listVisits, getAuditTrail, getVisitOrThrow
} from '../services/visitService.js';

const router = Router();

router.post('/check-in', requireAuth, requireRole('guard'), (req, res, next) => {
  try {
    const visit = checkIn({ ...req.body, guard_id: req.user.id });
    res.status(201).json(visit);
  } catch (err) {
    next(err);
  }
});

router.get('/pending-for-resident', requireAuth, requireRole('resident'), (req, res) => {
  res.json(getPendingForResident(req.user.flat_number));
});

router.post('/:id/resident-decision', requireAuth, requireRole('resident'), (req, res, next) => {
  try {
    const { decision, note } = req.body;
    if (!['approve', 'deny'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be approve or deny' });
    }
    res.json(residentDecision(req.params.id, req.user, decision, note));
  } catch (err) {
    next(err);
  }
});

router.get('/escalations', requireAuth, requireRole('admin'), (req, res) => {
  res.json(getEscalations());
});

router.post('/:id/admin-decision', requireAuth, requireRole('admin'), (req, res, next) => {
  try {
    const { decision, note } = req.body;
    if (!['approve', 'deny'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be approve or deny' });
    }
    res.json(adminDecision(req.params.id, req.user, decision, note));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/depart', requireAuth, requireRole('guard'), (req, res, next) => {
  try {
    res.json(depart(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
});

// Audit trail: residents see only their flat, guard/admin see everything (or filter by flat_number)
router.get('/', requireAuth, (req, res) => {
  const flat_number = req.user.role === 'resident' ? req.user.flat_number : req.query.flat_number;
  res.json(listVisits({ flat_number }));
});

router.get('/:id/audit', requireAuth, (req, res, next) => {
  try {
    const visit = getVisitOrThrow(req.params.id);
    if (req.user.role === 'resident' && visit.flat_number !== req.user.flat_number) {
      return res.status(403).json({ error: 'Not your flat' });
    }
    res.json({ visit, events: getAuditTrail(visit.id) });
  } catch (err) {
    next(err);
  }
});

export default router;
