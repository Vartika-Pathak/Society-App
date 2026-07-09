import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Notices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);

  async function load() {
    setNotices(await api.get('/notices'));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function handlePost(e) {
    e.preventDefault();
    setError('');
    setPosting(true);
    try {
      await api.post('/notices', { title, body });
      setTitle('');
      setBody('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <h1>Notices</h1>
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card">
        <h2>Post a notice</h2>
        <p className="hint-text">Visible to every resident, guard, and admin.</p>
        <form onSubmit={handlePost}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          <label>Details</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
          <button className="primary" type="submit" disabled={posting}>
            {posting ? 'Posting...' : 'Post notice'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>All notices</h2>
        {notices.length === 0 && <div className="empty-state">No notices yet.</div>}
        {notices.map((n) => (
          <div key={n.id} className="notice-card">
            <strong>{n.title}</strong>
            <div>{n.body}</div>
            <div className="notice-meta">{n.author_name} ({n.author_role}) · {n.created_at}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
