import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'resident', flat_number: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>Create account</h2>
        <p className="hint-text">First-time users only — this is the "Create account" step from the visitor flow.</p>
        <form onSubmit={handleSubmit}>
          <label>Full name</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
          <label>Email</label>
          <input value={form.email} onChange={(e) => update('email', e.target.value)} type="email" required />
          <label>Phone</label>
          <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          <label>Password</label>
          <input value={form.password} onChange={(e) => update('password', e.target.value)} type="password" required />
          <label>Role</label>
          <select value={form.role} onChange={(e) => update('role', e.target.value)}>
            <option value="resident">Resident</option>
            <option value="guard">Guard</option>
            <option value="admin">Admin</option>
          </select>
          {form.role === 'resident' && (
            <>
              <label>Flat number</label>
              <input value={form.flat_number} onChange={(e) => update('flat_number', e.target.value)} placeholder="e.g. A-101" required />
            </>
          )}
          {error && <div className="error-text">{error}</div>}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="hint-text">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
