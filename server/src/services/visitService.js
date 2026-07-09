import { db } from '../db.js';

export const ESCALATION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes, per the flowchart

function logAudit(visitId, eventType, actorRole, actorId, note) {
  db.prepare(`
    INSERT INTO audit_log (visit_id, event_type, actor_role, actor_id, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(visitId, eventType, actorRole || null, actorId || null, note || null);
}

function getVisit(id) {
  return db.prepare('SELECT * FROM visits WHERE id = ?').get(id);
}

function createVisit(fields) {
  const result = db.prepare(`
    INSERT INTO visits (
      visitor_name, visitor_phone, visitor_type, flat_number,
      invite_id, staff_id, service_request_id, status,
      identifiable, verified, reference_code, resident_notified_at, entry_time
    ) VALUES (
      @visitor_name, @visitor_phone, @visitor_type, @flat_number,
      @invite_id, @staff_id, @service_request_id, @status,
      @identifiable, @verified, @reference_code, @resident_notified_at, @entry_time
    )
  `).run({
    visitor_phone: null, invite_id: null, staff_id: null, service_request_id: null,
    identifiable: null, verified: null, reference_code: null,
    resident_notified_at: null, entry_time: null,
    ...fields
  });
  const visit = getVisit(result.lastInsertRowid);
  logAudit(visit.id, 'arrived', 'guard', fields.actor_id, `visitor_type=${visit.visitor_type}`);
  return visit;
}

function grantEntry(visit, actorRole, actorId, note) {
  db.prepare(`
    UPDATE visits SET status = 'on_premises', entry_time = datetime('now'),
      decided_by_user_id = ?, decision_note = COALESCE(?, decision_note)
    WHERE id = ?
  `).run(actorId || null, note || null, visit.id);
  logAudit(visit.id, 'entry_granted', actorRole, actorId, note);
  return getVisit(visit.id);
}

function denyEntry(visit, actorRole, actorId, note) {
  db.prepare(`
    UPDATE visits SET status = 'denied',
      decided_by_user_id = ?, decision_note = COALESCE(?, decision_note)
    WHERE id = ?
  `).run(actorId || null, note || null, visit.id);
  logAudit(visit.id, 'entry_denied', actorRole, actorId, note);
  return getVisit(visit.id);
}

// --- Visitor-type check-in handlers -----------------------------------

function checkInGuest({ visitor_name, visitor_phone, flat_number, otp_code, identifiable, guard_id }) {
  if (otp_code) {
    const invite = db.prepare(`
      SELECT * FROM invites WHERE otp_code = ? AND status = 'pending'
    `).get(otp_code);

    if (invite && new Date(invite.expires_at) > new Date()) {
      const resident = db.prepare('SELECT flat_number FROM users WHERE id = ?').get(invite.resident_id);
      const visit = createVisit({
        visitor_name: visitor_name || invite.guest_name,
        visitor_phone: visitor_phone || invite.guest_phone,
        visitor_type: 'guest',
        flat_number: resident.flat_number,
        invite_id: invite.id,
        status: 'on_premises',
        entry_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
        actor_id: guard_id
      });
      db.prepare(`UPDATE invites SET status = 'used' WHERE id = ?`).run(invite.id);
      logAudit(visit.id, 'otp_verified', 'guard', guard_id, 'pre-approved invite matched');
      logAudit(visit.id, 'entry_granted', 'guard', guard_id, 'OTP verified, auto-approved');
      return getVisit(visit.id);
    }
  }

  // No/invalid OTP: guard logs identifiability
  const visit = createVisit({
    visitor_name, visitor_phone, visitor_type: 'guest', flat_number,
    status: identifiable ? 'awaiting_resident' : 'denied',
    resident_notified_at: identifiable ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null,
    identifiable: identifiable ? 1 : 0,
    actor_id: guard_id
  });

  logAudit(visit.id, 'id_check', 'guard', guard_id, identifiable ? 'identifiable' : 'not identifiable');

  if (!identifiable) {
    logAudit(visit.id, 'entry_denied', 'guard', guard_id, 'could not be identified');
    return visit;
  }

  logAudit(visit.id, 'resident_notified', 'guard', guard_id, 'awaiting resident approval');
  return visit;
}

function checkInCabDelivery({ visitor_name, flat_number, reference_code, verified, guard_id }) {
  const visit = createVisit({
    visitor_name, visitor_type: 'cab_delivery', flat_number,
    reference_code: reference_code || null,
    verified: verified ? 1 : 0,
    status: verified ? 'on_premises' : 'denied',
    entry_time: verified ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null,
    actor_id: guard_id
  });
  logAudit(visit.id, verified ? 'entry_granted' : 'entry_denied', 'guard', guard_id,
    verified ? 'delivery/ride code verified' : 'code could not be verified');
  return visit;
}

function checkInHouseholdHelp({ visitor_name, flat_number, id_card_number, guard_id }) {
  const staff = db.prepare(`
    SELECT * FROM staff_registry WHERE id_card_number = ? AND category = 'household_help' AND active = 1
  `).get(id_card_number);

  const withinShift = staff && isWithinShift(staff.shift_start, staff.shift_end);
  const matches = Boolean(staff && withinShift);

  const visit = createVisit({
    visitor_name: visitor_name || staff?.name || 'Unknown',
    visitor_type: 'household_help', flat_number,
    staff_id: staff ? staff.id : null,
    status: matches ? 'on_premises' : 'denied',
    entry_time: matches ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null,
    actor_id: guard_id
  });
  logAudit(visit.id, matches ? 'entry_granted' : 'entry_denied', 'guard', guard_id,
    matches ? 'registered staff, within shift hours' : 'not registered or outside shift hours');
  return visit;
}

function checkInMaintenanceService({ visitor_name, flat_number, service_request_id, guard_id }) {
  const today = new Date().toISOString().slice(0, 10);
  const request = db.prepare(`
    SELECT * FROM service_requests
    WHERE id = ? AND status = 'scheduled' AND scheduled_date = ? AND (flat_number = ? OR flat_number IS NULL)
  `).get(service_request_id, today, flat_number);

  const matches = Boolean(request);

  const visit = createVisit({
    visitor_name: visitor_name || request?.vendor_name || 'Unknown',
    visitor_type: 'maintenance_service', flat_number,
    service_request_id: request ? request.id : null,
    status: matches ? 'on_premises' : 'denied',
    entry_time: matches ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null,
    actor_id: guard_id
  });
  logAudit(visit.id, matches ? 'entry_granted' : 'entry_denied', 'guard', guard_id,
    matches ? 'matches scheduled vendor request' : 'no matching scheduled request');
  return visit;
}

function checkInEmergency({ visitor_name, flat_number, note, guard_id }) {
  const visit = createVisit({
    visitor_name, visitor_type: 'emergency', flat_number,
    status: 'on_premises',
    entry_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
    actor_id: guard_id
  });
  logAudit(visit.id, 'entry_granted', 'guard', guard_id, 'emergency escort, immediate entry');
  logAudit(visit.id, 'resident_notified', 'guard', guard_id, note || 'resident & admin notified after the fact');
  return visit;
}

function isWithinShift(shiftStart, shiftEnd) {
  const now = new Date();
  const [sh, sm] = shiftStart.split(':').map(Number);
  const [eh, em] = shiftEnd.split(':').map(Number);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= sh * 60 + sm && nowMinutes <= eh * 60 + em;
}

export function checkIn(payload) {
  switch (payload.visitor_type) {
    case 'guest': return checkInGuest(payload);
    case 'cab_delivery': return checkInCabDelivery(payload);
    case 'household_help': return checkInHouseholdHelp(payload);
    case 'maintenance_service': return checkInMaintenanceService(payload);
    case 'emergency': return checkInEmergency(payload);
    default: throw Object.assign(new Error('Unknown visitor_type'), { status: 400 });
  }
}

// --- Escalation (lazy, checked on read instead of a background cron) ---

export function runEscalationSweep() {
  const cutoff = new Date(Date.now() - ESCALATION_TIMEOUT_MS).toISOString().replace('T', ' ').slice(0, 19);
  const stale = db.prepare(`
    SELECT * FROM visits WHERE status = 'awaiting_resident' AND resident_notified_at <= ?
  `).all(cutoff);

  for (const visit of stale) {
    db.prepare(`UPDATE visits SET status = 'awaiting_admin' WHERE id = ?`).run(visit.id);
    logAudit(visit.id, 'escalated', 'system', null, 'no resident response within timeout, escalated to admin');
  }
}

// --- Decisions -----------------------------------------------------------

export function residentDecision(visitId, residentUser, decision, note) {
  runEscalationSweep();
  const visit = getVisit(visitId);
  if (!visit) throw Object.assign(new Error('Visit not found'), { status: 404 });
  if (visit.status !== 'awaiting_resident') {
    throw Object.assign(new Error('Visit is no longer awaiting resident decision'), { status: 409 });
  }
  if (visit.flat_number !== residentUser.flat_number) {
    throw Object.assign(new Error('Not your flat'), { status: 403 });
  }
  logAudit(visit.id, 'resident_response', 'resident', residentUser.id, decision);
  return decision === 'approve'
    ? grantEntry(visit, 'resident', residentUser.id, note)
    : denyEntry(visit, 'resident', residentUser.id, note);
}

export function adminDecision(visitId, adminUser, decision, note) {
  const visit = getVisit(visitId);
  if (!visit) throw Object.assign(new Error('Visit not found'), { status: 404 });
  if (visit.status !== 'awaiting_admin') {
    throw Object.assign(new Error('Visit is not in the admin escalation queue'), { status: 409 });
  }
  logAudit(visit.id, 'admin_decision', 'admin', adminUser.id, decision);
  return decision === 'approve'
    ? grantEntry(visit, 'admin', adminUser.id, note)
    : denyEntry(visit, 'admin', adminUser.id, note);
}

export function depart(visitId, actorId) {
  const visit = getVisit(visitId);
  if (!visit) throw Object.assign(new Error('Visit not found'), { status: 404 });
  if (visit.status !== 'on_premises') {
    throw Object.assign(new Error('Visitor is not currently on premises'), { status: 409 });
  }
  db.prepare(`UPDATE visits SET status = 'departed', exit_time = datetime('now') WHERE id = ?`).run(visitId);
  logAudit(visitId, 'departed', 'guard', actorId, null);
  return getVisit(visitId);
}

// --- Reads -----------------------------------------------------------

export function getPendingForResident(flatNumber) {
  runEscalationSweep();
  return db.prepare(`
    SELECT * FROM visits WHERE flat_number = ? AND status = 'awaiting_resident' ORDER BY created_at DESC
  `).all(flatNumber);
}

export function getEscalations() {
  runEscalationSweep();
  return db.prepare(`SELECT * FROM visits WHERE status = 'awaiting_admin' ORDER BY created_at ASC`).all();
}

export function listVisits({ flat_number } = {}) {
  runEscalationSweep();
  if (flat_number) {
    return db.prepare(`SELECT * FROM visits WHERE flat_number = ? ORDER BY created_at DESC`).all(flat_number);
  }
  return db.prepare(`SELECT * FROM visits ORDER BY created_at DESC`).all();
}

export function getAuditTrail(visitId) {
  return db.prepare(`SELECT * FROM audit_log WHERE visit_id = ? ORDER BY created_at ASC`).all(visitId);
}

export function getVisitOrThrow(id) {
  const visit = getVisit(id);
  if (!visit) throw Object.assign(new Error('Visit not found'), { status: 404 });
  return visit;
}
