import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogoMark } from '../components/Logo.jsx';

function IconDumbbell() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="1" y="9" width="3" height="6" rx="1" /><rect x="20" y="9" width="3" height="6" rx="1" />
      <rect x="4" y="7" width="2.5" height="10" rx="1" /><rect x="17.5" y="7" width="2.5" height="10" rx="1" />
      <line x1="6.5" y1="12" x2="17.5" y2="12" />
    </svg>
  );
}
function IconWaves() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 8c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
      <path d="M2 14c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
      <path d="M2 20c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
    </svg>
  );
}
function IconClub() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.5" /><circle cx="16" cy="8" r="2.5" />
      <path d="M3 19v-2a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v2" />
      <path d="M11 19v-2a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v2" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    </svg>
  );
}
function IconLeaf() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20c8 0 14-6 14-14 0-1 0-2-.3-3C10 3.7 4 9.7 4 17.7c0 .8 0 1.6.2 2.3z" />
      <path d="M6 18C10 12 14 8 17.7 3" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <line x1="8" y1="7" x2="8" y2="7.01" /><line x1="12" y1="7" x2="12" y2="7.01" /><line x1="16" y1="7" x2="16" y2="7.01" />
      <line x1="8" y1="11" x2="8" y2="11.01" /><line x1="12" y1="11" x2="12" y2="11.01" /><line x1="16" y1="11" x2="16" y2="11.01" />
      <line x1="8" y1="15" x2="8" y2="15.01" /><line x1="16" y1="15" x2="16" y2="15.01" />
      <rect x="10.5" y="15" width="3" height="6" />
    </svg>
  );
}

const FEATURES = [
  { icon: IconDumbbell, title: 'Gym', text: 'A fully-equipped fitness center open to residents every day.' },
  { icon: IconWaves, title: 'Pool', text: 'A landscaped swimming pool for laps or a lazy afternoon.' },
  { icon: IconClub, title: 'Clubhouse', text: 'A shared space for celebrations, meetings, and get-togethers.' }
];

const AMENITIES = [
  { icon: IconShield, title: '24x7 Security', text: 'Manned gates with OTP-verified visitor check-in, day and night.' },
  { icon: IconLeaf, title: 'Landscaped Gardens', text: 'Green courtyards and walking paths throughout the property.' },
  { icon: IconBuilding, title: 'Banquet & Events', text: 'A banquet hall for festivals and society-wide celebrations.' }
];

export default function Landing() {
  const { hash } = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    'home-image-1.png',
    'home-image-2.png',
    'home-image-3.png',
    'home-image-4.png',
    'home-image-5.png'
  ];

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="landing">
      <section className="hero-grid">
        <div>
          <h1 className="landing-title">The Grand Pavilion</h1>
          <p className="landing-tagline">
            A managed residential community in Noida, India — with a gate that runs on OTPs instead of phone calls,
            a notice board everyone actually reads, and grievances that get tracked to resolution.
          </p>
          <div className="landing-cta">
            <Link to="/login" className="primary-link">Log in</Link>
            <Link to="/signup" className="secondary-link">Sign up</Link>
          </div>
        </div>
        <div className="hero-image-carousel">
          <img src={images[currentImageIndex]} alt="The Grand Pavilion" />
          <div className="carousel-dots">
            {images.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="card feature-card">
            <div className="feature-icon"><f.icon /></div>
            <h3>{f.title}</h3>
            <p className="hint-text">{f.text}</p>
          </div>
        ))}
      </section>

      <section id="about" className="card landing-about">
        <h2>About us</h2>
        <p>
          The Grand Pavilion is a residential society where the day-to-day is handled from one app. Residents
          pre-approve guests, deliveries, household help, and vendors with a one-time OTP so the guard can wave
          them in without a phone call. Anything that can't be auto-verified is routed to the resident for
          approval, and escalated to the admin if there's no response in time — so nothing is stuck at the gate.
        </p>
        <p>
          Beyond the gate, the Notices board keeps everyone in the loop on society updates, the Gallery holds
          photos from festivals and events, and residents can raise Grievances that the committee tracks through
          to resolution. Every visitor's entry and exit is logged to a full audit trail, so the whole community has
          a clear, shared record.
        </p>
      </section>

      <section id="amenities" className="amenities-section">
        <div className="amenities-list">
          <h2>Amenities</h2>
          {AMENITIES.map((a) => (
            <div key={a.title} className="amenity-row">
              <div className="feature-icon small"><a.icon /></div>
              <div>
                <strong>{a.title}</strong>
                <p className="hint-text">{a.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="amenities-copy">
          <h3>Discover refined living</h3>
          <p>
            From landscaped grounds to round-the-clock security, The Grand Pavilion is built for residents who
            want their community managed with the same care as their home.
          </p>
        </div>
      </section>

      <footer id="contact" className="landing-footer">
        <div className="footer-col">
          <h4>Company</h4>
          <a href="#about">About Us</a>
          <Link to="/notices">Notices</Link>
          <Link to="/gallery">Gallery</Link>
          <a href="#contact">Contact</a>
        </div>
        <div className="footer-col">
          <h4>Contact Us</h4>
          <span>The Grand Pavilion</span>
          <span>Sector 150, Noida, Uttar Pradesh 201310</span>
          <span>hello@grandpavilion.example</span>
        </div>
        <div className="footer-col footer-meta">
          <span>The Grand Pavilion, Noida, India · Est. 2026</span>
        </div>
      </footer>
    </div>
  );
}
