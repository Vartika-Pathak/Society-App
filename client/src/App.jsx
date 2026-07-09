import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ResidentDashboard from './pages/resident/ResidentDashboard.jsx';
import GuardGate from './pages/guard/GuardGate.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'resident') return <Navigate to="/resident" replace />;
  if (user.role === 'guard') return <Navigate to="/guard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return null;
}

export default function App() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">🏢 Society App</Link>
        {user && (
          <div className="topbar-user">
            <span>{user.name} · <span className="role-pill">{user.role}</span>{user.flat_number ? ` · ${user.flat_number}` : ''}</span>
            <button onClick={logout} className="btn-link">Log out</button>
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
        </Routes>
      </main>
    </div>
  );
}
