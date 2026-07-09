import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Logo from './components/Logo.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ResidentDashboard from './pages/resident/ResidentDashboard.jsx';
import GuardGate from './pages/guard/GuardGate.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Notices from './pages/Notices.jsx';
import Gallery from './pages/Gallery.jsx';

function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Landing />;
  if (user.role === 'resident') return <Navigate to="/resident" replace />;
  if (user.role === 'guard') return <Navigate to="/guard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return null;
}

function dashboardPathFor(role) {
  return `/${role}`;
}

function NavTabs() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const marketingLinks = [
      { to: '/', label: 'Home' },
      { to: '/#about', label: 'About Us' },
      { to: '/#amenities', label: 'Amenities' },
      { to: '/#contact', label: 'Contact' }
    ];
    return (
      <nav className="nav-tabs">
        {marketingLinks.map((t) => (
          <Link key={t.label} to={t.to} className="nav-tab">{t.label}</Link>
        ))}
      </nav>
    );
  }

  const dashboardPath = dashboardPathFor(user.role);
  const tabs = [
    { to: dashboardPath, label: 'Dashboard' },
    { to: '/notices', label: 'Notices' },
    { to: '/gallery', label: 'Gallery' }
  ];

  return (
    <nav className="nav-tabs">
      {tabs.map((t) => (
        <Link key={t.to} to={t.to} className={`nav-tab ${location.pathname === t.to ? 'active' : ''}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export default function App() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <Link to="/" className="brand"><Logo /></Link>
          <NavTabs />
        </div>
        {user ? (
          <div className="topbar-user">
            <span>{user.name} · <span className="role-pill">{user.role}</span>{user.flat_number ? ` · ${user.flat_number}` : ''}</span>
            <button onClick={logout} className="btn-link">Log out</button>
          </div>
        ) : (
          <div className="topbar-user">
            <Link to="/login" className="nav-tab">Log in</Link>
            <Link to="/signup" className="secondary-link" style={{ padding: '7px 16px' }}>Sign up</Link>
          </div>
        )}
      </header>

      <main className="content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Home />} />
          <Route path="/resident" element={<RequireRole role="resident"><ResidentDashboard /></RequireRole>} />
          <Route path="/guard" element={<RequireRole role="guard"><GuardGate /></RequireRole>} />
          <Route path="/admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
          <Route path="/notices" element={<RequireAuth><Notices /></RequireAuth>} />
          <Route path="/gallery" element={<RequireAuth><Gallery /></RequireAuth>} />
        </Routes>
      </main>
    </div>
  );
}
