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

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [invites, setInvites] = useState([]);
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  async function loadInvites() {
    setInvites(await api.get('/invites/mine'));
  }
  async function loadPending() {
    setPending(await api.get('/visits/pending-for-resident'));
  }
  async function loadHistory() {
    setHistory(await api.get('/visits'));
  }

  useEffect(() => {
    loadInvites();
    loadPending();
    loadHistory();
    const id = setInterval(() => {
      loadPending();
      loadHistory();
    }, 5000);
    return () => clearInterval(id);
  }, []);

  async function handleCreateInvite(e) {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.post('/invites', { guest_name: guestName, guest_phone: guestPhone });
      setGuestName('');
      setGuestPhone('');
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
          <h2>Invite a guest</h2>
          <p className="hint-text">Creates a one-time OTP. Share it with your guest — they give it to the gate guard for instant entry.</p>
          <form onSubmit={handleCreateInvite}>
            <label>Guest name</label>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
            <label>Guest phone (optional)</label>
            <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
            {error && <div className="error-text">{error}</div>}
            <button className="primary" type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create invite'}
            </button>
          </form>

          {invites.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3>Recent invites</h3>
              <table>
                <thead><tr><th>Guest</th><th>OTP</th><th>Status</th></tr></thead>
                <tbody>
                  {invites.slice(0, 5).map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.guest_name}</td>
                      <td><span className="otp-box" style={{ fontSize: '1rem', padding: '2px 8px' }}>{inv.otp_code}</span></td>
                      <td>{inv.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Pending approvals</h2>
          <p className="hint-text">A guard is at the gate with a visitor who couldn't be pre-verified. Respond within 2 minutes or it auto-escalates to the admin.</p>
          {pending.length === 0 && <div className="empty-state">No pending approval requests.</div>}
          {pending.map((visit) => (
            <div key={visit.id} className="card" style={{ background: '#fff8ee' }}>
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
        <h2>Visit history for {user.flat_number}</h2>
        {history.length === 0 && <div className="empty-state">No visits yet.</div>}
        {history.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
