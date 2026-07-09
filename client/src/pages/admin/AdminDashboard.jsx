import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import StatusBadge from '../../components/StatusBadge.jsx';

function EscalationQueue() {
  const [escalations, setEscalations] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    setEscalations(await api.get('/visits/escalations'));
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  async function decide(visitId, decision) {
    setError('');
    try {
      await api.post(`/visits/${visitId}/admin-decision`, { decision });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h2>Escalation queue</h2>
      <p className="hint-text">Guest check-ins where the resident didn't respond within 2 minutes.</p>
      {error && <div className="error-text">{error}</div>}
      {escalations.length === 0 && <div className="empty-state">Nothing escalated right now.</div>}
      {escalations.map((v) => (
        <div key={v.id} className="card" style={{ background: '#fff8ee' }}>
          <strong>{v.visitor_name}</strong> {v.visitor_phone ? `· ${v.visitor_phone}` : ''}
          <div className="hint-text">For flat {v.flat_number} · arrived {v.created_at}</div>
          <div style={{ marginTop: 10 }}>
            <button className="success" onClick={() => decide(v.id, 'approve')}>Approve entry</button>
            <button className="danger" onClick={() => decide(v.id, 'deny')}>Deny entry</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StaffRegistry() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ name: '', id_card_number: '', category: 'household_help', flat_number: '', shift_start: '06:00', shift_end: '21:00' });
  const [error, setError] = useState('');

  async function load() {
    setStaff(await api.get('/staff'));
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/staff', form);
      setForm({ ...form, name: '', id_card_number: '', flat_number: '' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(s) {
    await api.patch(`/staff/${s.id}`, { active: s.active ? 0 : 1 });
    await load();
  }

  return (
    <div className="card">
      <h2>Registered staff</h2>
      <form onSubmit={add} className="grid grid-2">
        <div>
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <label>ID card number</label>
          <input value={form.id_card_number} onChange={(e) => setForm({ ...form, id_card_number: e.target.value })} required />
        </div>
        <div>
          <label>Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="household_help">Household help</option>
            <option value="maintenance_vendor">Maintenance vendor</option>
          </select>
          <label>Assigned flat (blank = society-wide)</label>
          <input value={form.flat_number} onChange={(e) => setForm({ ...form, flat_number: e.target.value })} />
        </div>
      </form>
      {error && <div className="error-text">{error}</div>}
      <button className="primary" onClick={add} type="button">Register staff</button>

      <table style={{ marginTop: 16 }}>
        <thead><tr><th>Name</th><th>ID card</th><th>Category</th><th>Flat</th><th>Shift</th><th>Active</th></tr></thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.id_card_number}</td>
              <td>{s.category.replace('_', ' ')}</td>
              <td>{s.flat_number || 'society-wide'}</td>
              <td>{s.shift_start}–{s.shift_end}</td>
              <td><button className="secondary" onClick={() => toggleActive(s)}>{s.active ? 'Deactivate' : 'Activate'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ vendor_name: '', flat_number: '', scheduled_date: new Date().toISOString().slice(0, 10), scheduled_start: '09:00', scheduled_end: '17:00' });
  const [error, setError] = useState('');

  async function load() {
    setRequests(await api.get('/service-requests'));
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/service-requests', form);
      setForm({ ...form, vendor_name: '', flat_number: '' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h2>Scheduled maintenance / vendor requests</h2>
      <form onSubmit={add} className="grid grid-2">
        <div>
          <label>Vendor name</label>
          <input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} required />
          <label>Flat (blank = society-wide)</label>
          <input value={form.flat_number} onChange={(e) => setForm({ ...form, flat_number: e.target.value })} />
        </div>
        <div>
          <label>Date</label>
          <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
          <div className="grid grid-2">
            <div><label>Start</label><input type="time" value={form.scheduled_start} onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })} /></div>
            <div><label>End</label><input type="time" value={form.scheduled_end} onChange={(e) => setForm({ ...form, scheduled_end: e.target.value })} /></div>
          </div>
        </div>
      </form>
      {error && <div className="error-text">{error}</div>}
      <button className="primary" onClick={add} type="button">Schedule request</button>

      <table style={{ marginTop: 16 }}>
        <thead><tr><th>Vendor</th><th>Flat</th><th>Date</th><th>Window</th><th>Status</th></tr></thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>{r.vendor_name}</td>
              <td>{r.flat_number || 'society-wide'}</td>
              <td>{r.scheduled_date}</td>
              <td>{r.scheduled_start}–{r.scheduled_end}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditTrail() {
  const [visits, setVisits] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [events, setEvents] = useState([]);

  async function load() {
    setVisits(await api.get('/visits'));
  }
  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  async function expand(visitId) {
    if (expanded === visitId) {
      setExpanded(null);
      return;
    }
    const data = await api.get(`/visits/${visitId}/audit`);
    setEvents(data.events);
    setExpanded(visitId);
  }

  return (
    <div className="card">
      <h2>Full audit trail</h2>
      <table>
        <thead><tr><th>Visitor</th><th>Flat</th><th>Type</th><th>Status</th><th>Arrived</th><th></th></tr></thead>
        <tbody>
          {visits.map((v) => (
            <>
              <tr key={v.id}>
                <td>{v.visitor_name}</td>
                <td>{v.flat_number}</td>
                <td>{v.visitor_type.replace('_', ' ')}</td>
                <td><StatusBadge status={v.status} /></td>
                <td>{v.created_at}</td>
                <td><button className="secondary" onClick={() => expand(v.id)}>{expanded === v.id ? 'Hide' : 'Details'}</button></td>
              </tr>
              {expanded === v.id && (
                <tr key={`${v.id}-detail`}>
                  <td colSpan={6}>
                    <ul style={{ margin: 0 }}>
                      {events.map((e) => (
                        <li key={e.id}>
                          <strong>{e.created_at}</strong> — {e.event_type} {e.actor_role ? `(${e.actor_role})` : ''} {e.note ? `— ${e.note}` : ''}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <EscalationQueue />
      <div className="grid grid-2">
        <StaffRegistry />
        <ServiceRequests />
      </div>
      <AuditTrail />
    </div>
  );
}
