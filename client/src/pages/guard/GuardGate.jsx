import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import StatusBadge from '../../components/StatusBadge.jsx';

const VISITOR_TYPES = [
  { key: 'guest', label: '🧑 Guest' },
  { key: 'cab_delivery', label: '🚗 Cab / Delivery' },
  { key: 'household_help', label: '🧹 Household help' },
  { key: 'maintenance_service', label: '🔧 Maintenance / vendor' },
  { key: 'emergency', label: '🚨 Emergency' }
];

function ResultBanner({ result }) {
  if (!result) return null;
  const isEntry = result.status === 'on_premises';
  const isPending = result.status === 'awaiting_resident';
  return (
    <div className="card" style={{ background: isEntry ? '#e6f6ee' : isPending ? '#fff8ee' : '#fdecec' }}>
      <strong>{result.visitor_name}</strong> — <StatusBadge status={result.status} />
      {isEntry && <div className="hint-text">Gate opened. Remember to log departure when they leave.</div>}
      {isPending && <div className="hint-text">Resident notified. Waiting for their response (auto-escalates to admin after 2 min).</div>}
      {result.status === 'denied' && <div className="hint-text">Entry denied and logged to the audit trail.</div>}
    </div>
  );
}

export default function GuardGate() {
  const [type, setType] = useState('guest');
  const [flatNumber, setFlatNumber] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [identifiable, setIdentifiable] = useState(true);
  const [referenceCode, setReferenceCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [idCardNumber, setIdCardNumber] = useState('');
  const [serviceRequestId, setServiceRequestId] = useState('');
  const [serviceRequests, setServiceRequests] = useState([]);
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [onPremises, setOnPremises] = useState([]);

  async function loadOnPremises() {
    const all = await api.get('/visits');
    setOnPremises(all.filter((v) => v.status === 'on_premises'));
  }

  useEffect(() => {
    loadOnPremises();
    api.get('/service-requests').then((rs) => setServiceRequests(rs.filter((r) => r.status === 'scheduled')));
    const id = setInterval(loadOnPremises, 5000);
    return () => clearInterval(id);
  }, []);

  function resetForm() {
    setVisitorName(''); setVisitorPhone(''); setOtpCode(''); setIdentifiable(true);
    setReferenceCode(''); setVerified(false); setIdCardNumber(''); setServiceRequestId(''); setNote('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setSubmitting(true);
    try {
      const payload = { visitor_type: type, flat_number: flatNumber };
      if (type === 'guest') {
        Object.assign(payload, { visitor_name: visitorName, visitor_phone: visitorPhone, otp_code: otpCode || undefined, identifiable });
      } else if (type === 'cab_delivery') {
        Object.assign(payload, { visitor_name: visitorName, reference_code: referenceCode, verified });
      } else if (type === 'household_help') {
        Object.assign(payload, { visitor_name: visitorName, id_card_number: idCardNumber });
      } else if (type === 'maintenance_service') {
        Object.assign(payload, { visitor_name: visitorName, service_request_id: serviceRequestId });
      } else if (type === 'emergency') {
        Object.assign(payload, { visitor_name: visitorName, note });
      }
      const visit = await api.post('/visits/check-in', payload);
      setResult(visit);
      resetForm();
      await loadOnPremises();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function logDeparture(visitId) {
    await api.post(`/visits/${visitId}/depart`);
    await loadOnPremises();
  }

  return (
    <div>
      <h1>Gate Check-in</h1>

      <div className="visitor-type-grid">
        {VISITOR_TYPES.map((vt) => (
          <button
            key={vt.key}
            className={`visitor-type-btn ${type === vt.key ? 'active' : ''}`}
            onClick={() => { setType(vt.key); setResult(null); setError(''); resetForm(); }}
            type="button"
          >
            {vt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>{VISITOR_TYPES.find((v) => v.key === type).label}</h2>
          <form onSubmit={submit}>
            <label>Flat number</label>
            <input value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} placeholder="e.g. A-101" required={type !== 'guest' || !otpCode} />

            {type === 'guest' && (
              <>
                <label>Guest OTP (from visitor, if pre-invited)</label>
                <input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="6-digit code" />
                <p className="hint-text">If the visitor has a valid OTP, flat number and entry are resolved automatically.</p>
                <label>Visitor name (if no OTP)</label>
                <input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
                <label>Visitor phone</label>
                <input value={visitorPhone} onChange={(e) => setVisitorPhone(e.target.value)} />
                <label>
                  <input type="checkbox" style={{ width: 'auto', marginRight: 8 }} checked={identifiable} onChange={(e) => setIdentifiable(e.target.checked)} />
                  Visitor could be identified (ID/photo check)
                </label>
              </>
            )}

            {type === 'cab_delivery' && (
              <>
                <label>Visitor / driver name</label>
                <input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} required />
                <label>Order / ride reference code</label>
                <input value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)} />
                <label>
                  <input type="checkbox" style={{ width: 'auto', marginRight: 8 }} checked={verified} onChange={(e) => setVerified(e.target.checked)} />
                  Code verified against app / order slip
                </label>
              </>
            )}

            {type === 'household_help' && (
              <>
                <label>Visitor name</label>
                <input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
                <label>Staff ID card number</label>
                <input value={idCardNumber} onChange={(e) => setIdCardNumber(e.target.value)} placeholder="e.g. HH-1001" required />
              </>
            )}

            {type === 'maintenance_service' && (
              <>
                <label>Visitor / vendor name</label>
                <input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
                <label>Matching scheduled request</label>
                <select value={serviceRequestId} onChange={(e) => setServiceRequestId(e.target.value)} required>
                  <option value="">Select today's scheduled request...</option>
                  {serviceRequests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.vendor_name} · {r.flat_number || 'society-wide'} · {r.scheduled_date} {r.scheduled_start}-{r.scheduled_end}
                    </option>
                  ))}
                </select>
              </>
            )}

            {type === 'emergency' && (
              <>
                <label>Visitor / service (e.g. "Fire Dept", "Ambulance")</label>
                <input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} required />
                <label>Note</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" />
                <p className="hint-text">Entry is granted immediately. Resident & admin are notified after the fact.</p>
              </>
            )}

            {error && <div className="error-text">{error}</div>}
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? 'Processing...' : type === 'emergency' ? 'Escort in immediately' : 'Check in visitor'}
            </button>
          </form>
        </div>

        <div>
          <ResultBanner result={result} />
          <div className="card">
            <h2>Currently on premises</h2>
            {onPremises.length === 0 && <div className="empty-state">No visitors currently checked in.</div>}
            {onPremises.map((v) => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <strong>{v.visitor_name}</strong>
                  <div className="hint-text">{v.flat_number} · {v.visitor_type.replace('_', ' ')} · entered {v.entry_time}</div>
                </div>
                <button className="secondary" onClick={() => logDeparture(v.id)}>Log departure</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
