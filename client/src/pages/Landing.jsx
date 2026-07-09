import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

export default function Landing() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <Logo size={64} withWordmark={false} />
        <h1 className="landing-title">Society App</h1>
        <p className="landing-tagline">One place for your society's gate, notices, grievances, and memories.</p>
        <div className="landing-cta">
          <Link to="/login" className="primary-link">Log in</Link>
          <Link to="/signup" className="secondary-link">Sign up</Link>
        </div>
      </section>

      <section className="card landing-about">
        <h2>About us</h2>
        <p>
          Society App helps residents, gate guards, and the managing committee run daily society life from one
          place. Residents pre-approve guests, deliveries, household help, and vendors with a one-time OTP so the
          guard can wave them in without a phone call. Anything that can't be auto-verified is routed to the
          resident for approval, and escalated to the admin if there's no response in time — so nothing is stuck
          waiting at the gate.
        </p>
        <p>
          Beyond the gate, the Notices board keeps everyone in the loop on society updates, the Gallery holds
          photos from festivals and events, and residents can raise Grievances that the committee tracks through
          to resolution. Every visitor's entry and exit is logged to a full audit trail, so the whole community has
          a clear, shared record.
        </p>
      </section>
    </div>
  );
}
