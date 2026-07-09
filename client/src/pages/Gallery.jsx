import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Gallery() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [eventName, setEventName] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function load() {
    setPhotos(await api.get('/gallery'));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setError('');
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Please choose a photo to upload.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('event_name', eventName);
      formData.append('caption', caption);
      await api.upload('/gallery', formData);
      setEventName('');
      setCaption('');
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h1>Gallery</h1>
      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}

      {user.role === 'admin' && (
        <div className="card">
          <h2>Upload event photo</h2>
          <form onSubmit={handleUpload}>
            <label>Event name</label>
            <input value={eventName} onChange={(e) => setEventName(e.target.value)} required />
            <label>Caption (optional)</label>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} />
            <label>Photo</label>
            <input type="file" accept="image/*" ref={fileRef} required />
            <button className="primary" type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload photo'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Society events</h2>
        {photos.length === 0 && <div className="empty-state">No photos yet.</div>}
        {photos.length > 0 && (
          <div className="gallery-grid">
            {photos.map((p) => (
              <div key={p.id} className="gallery-item">
                <img src={`/uploads/${p.filename}`} alt={p.event_name} loading="lazy" />
                <div className="gallery-caption">
                  <strong>{p.event_name}</strong>
                  {p.caption && <div>{p.caption}</div>}
                  <span>{p.created_at}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
