import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const ESCALATION_TIMEOUT_MS = 2 * 60 * 1000;

function CountdownToEscalation({ notifiedAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const notifiedMs = new Date(notifiedAt.replace(' ', 'T') + 'Z').getTime();
  const remaining = Math.max(0, ESCALATION_TIMEOUT_MS - (now - notifiedMs));
  const seconds = Math.ceil(remaining / 1000);
  return (
    <span className="countdown">
      {remaining > 0 ? `Escalates to admin in ${seconds}s if no response` : 'Escalating to admin...'}
    </span>
  );
}

const CATEGORIES = [
  { key: 'guest', label: 'Guest' },
  { key: 'cab_delivery', label: 'Cab / Delivery' },
  { key: 'household_help', label: 'Household help' },
  { key: 'maintenance_service', label: 'Maintenance / vendor' }
];

const GRIEVANCE_CATEGORIES = [
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'security', label: 'Security' },
  { key: 'noise', label: 'Noise' },
  { key: 'other', label: 'Other' }
];

const emptyForm = {
  visitor_type: 'guest',
  guest_name: '',
  guest_phone: '',
  reference_code: '',
  id_card_number: '',
  scheduled_date: new Date().toISOString().slice(0, 10),
  scheduled_start: '09:00',
  scheduled_end: '17:00'
};

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [invites, setInvites] = useState([]);
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const [grievances, setGrievances] = useState([]);
  const [grievanceCategory, setGrievanceCategory] = useState('maintenance');
  const [grievanceDescription, setGrievanceDescription] = useState('');
  const [grievanceError, setGrievanceError] = useState('');
  const [submittingGrievance, setSubmittingGrievance] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function loadInvites() {
    setInvites(await api.get('/invites/mine'));
  }
  async function loadPending() {
    setPending(await api.get('/visits/pending-for-resident'));
  }
  async function loadHistory() {
    setHistory(await api.get('/visits'));
  }
  async function loadGrievances() {
    setGrievances(await api.get('/grievances/mine'));
  }

  useEffect(() => {
    loadInvites().catch((err) => setError(err.message));
    loadPending().catch((err) => setError(err.message));
    loadHistory().catch((err) => setError(err.message));
    loadGrievances().catch((err) => setError(err.message));
    const id = setInterval(() => {
      loadPending().catch((err) => setError(err.message));
      loadHistory().catch((err) => setError(err.message));
      loadGrievances().catch((err) => setError(err.message));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  async function handleRaiseGrievance(e) {
    e.preventDefault();
    setGrievanceError('');
    setSubmittingGrievance(true);
    try {
      await api.post('/grievances', { category: grievanceCategory, description: grievanceDescription });
      setGrievanceDescription('');
      await loadGrievances();
    } catch (err) {
      setGrievanceError(err.message);
    } finally {
      setSubmittingGrievance(false);
    }
  }

  async function handleCreateInvite(e) {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.post('/invites', form);
      setForm({ ...emptyForm, visitor_type: form.visitor_type });
      await loadInvites();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function decide(visitId, decision) {
    try {
      await api.post(`/visits/${visitId}/resident-decision`, { decision });
      await loadPending();
      await loadHistory();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Resident Dashboard — {user.flat_number}</h1>

      <div className="grid grid-2">
        <div className="card">
          <h2>Create a pre-approval invite</h2>
          <p className="hint-text">Creates a one-time OTP for the gate guard. Share it with the visitor for instant entry.</p>

          <label>Category</label>
          <select value={form.visitor_type} onChange={(e) => update('visitor_type', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>

          <form onSubmit={handleCreateInvite}>
            <label>
              {form.visitor_type === 'guest' && 'Guest name'}
              {form.visitor_type === 'cab_delivery' && 'Driver / rider name'}
              {form.visitor_type === 'household_help' && 'Staff name'}
              {form.visitor_type === 'maintenance_service' && 'Vendor name'}
            </label>
            <input value={form.guest_name} onChange={(e) => update('guest_name', e.target.value)} required />

            <label>Phone (optional)</label>
            <input value={form.guest_phone} onChange={(e) => update('guest_phone', e.target.value)} />

            {form.visitor_type === 'cab_delivery' && (
              <>
                <label>Order / ride reference code (optional)</label>
                <input value={form.reference_code} onChange={(e) => update('reference_code', e.target.value)} />
              </>
            )}

            {form.visitor_type === 'household_help' && (
              <>
                <label>Staff ID card number</label>
                <input value={form.id_card_number} onChange={(e) => update('id_card_number', e.target.value)} required />
              </>
            )}

            {form.visitor_type === 'maintenance_service' && (
              <>
                <label>Scheduled date</label>
                <input type="date" value={form.scheduled_date} onChange={(e) => update('scheduled_date', e.target.value)} required />
                <div className="grid grid-2">
                  <div><label>Start</label><input type="time" value={form.scheduled_start} onChange={(e) => update('scheduled_start', e.target.value)} required /></div>
                  <div><label>End</label><input type="time" value={form.scheduled_end} onChange={(e) => update('scheduled_end', e.target.value)} required /></div>
                </div>
              </>
            )}

            {error && <div className="error-text">{error}</div>}
            <button className="primary" type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create invite'}
            </button>
          </form>

          {invites.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3>Recent invites</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Category</th><th>OTP</th><th>Status</th></tr></thead>
                  <tbody>
                    {invites.slice(0, 5).map((inv) => (
                      <tr key={inv.id}>
                        <td>{inv.guest_name}</td>
                        <td>{CATEGORIES.find((c) => c.key === inv.visitor_type)?.label || inv.visitor_type}</td>
                        <td><span className="otp-box compact">{inv.otp_code}</span></td>
                        <td>{inv.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Pending approvals</h2>
          <p className="hint-text">A guard is at the gate with a visitor who couldn't be pre-verified. Respond within 2 minutes or it auto-escalates to the admin.</p>
          {pending.length === 0 && <div className="empty-state">No pending approval requests.</div>}
          {pending.map((visit) => (
            <div key={visit.id} className="banner banner-warn">
              <strong>{visit.visitor_name}</strong> {visit.visitor_phone ? `· ${visit.visitor_phone}` : ''}
              <div className="hint-text">Arrived at gate as a guest, identified by guard</div>
              <CountdownToEscalation notifiedAt={visit.resident_notified_at} />
              <div style={{ marginTop: 10 }}>
                <button className="success" onClick={() => decide(visit.id, 'approve')}>Approve entry</button>
                <button className="danger" onClick={() => decide(visit.id, 'deny')}>Deny entry</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Raise a grievance</h2>
        <p className="hint-text">Share an issue with the society admin and track its resolution here.</p>
        <form onSubmit={handleRaiseGrievance}>
          <label>Category</label>
          <select value={grievanceCategory} onChange={(e) => setGrievanceCategory(e.target.value)}>
            {GRIEVANCE_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <label>Description</label>
          <textarea value={grievanceDescription} onChange={(e) => setGrievanceDescription(e.target.value)} required />
          {grievanceError && <div className="error-text">{grievanceError}</div>}
          <button className="primary" type="submit" disabled={submittingGrievance}>
            {submittingGrievance ? 'Submitting...' : 'Submit grievance'}
          </button>
        </form>

        {grievances.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3>My grievances</h3>
            {grievances.map((g) => (
              <div key={g.id} className="list-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <strong>{GRIEVANCE_CATEGORIES.find((c) => c.key === g.category)?.label || g.category}</strong>
                  <StatusBadge status={g.status} />
                </div>
                <div>{g.description}</div>
                {g.admin_note && <div className="hint-text">Admin note: {g.admin_note}</div>}
                <div className="hint-text">Raised {g.created_at}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Visit history for {user.flat_number}</h2>
        {history.length === 0 && <div className="empty-state">No visits yet.</div>}
        {history.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Visitor</th><th>Type</th><th>Status</th><th>Entry</th><th>Exit</th></tr>
              </thead>
              <tbody>
                {history.map((v) => (
                  <tr key={v.id}>
                    <td>{v.visitor_name}</td>
                    <td>{v.visitor_type.replace('_', ' ')}</td>
                    <td><StatusBadge status={v.status} /></td>
                    <td>{v.entry_time || '—'}</td>
                    <td>{v.exit_time || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
