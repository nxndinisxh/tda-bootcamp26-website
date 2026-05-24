import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DomainPage from './pages/DomainPage';
import AdminDashboard from './pages/AdminDashboard';
import { LogOut, LayoutDashboard, Compass, ShieldAlert, Award } from 'lucide-react';

// Protected Route Guard for general logged-in users
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Protected Route Guard for Admin/Super-Admin
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Navigation Header Component
const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-[#d4c1b6]/10">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-[#60a6dc] to-[#d4c1b6] bg-clip-text text-transparent text-glow-primary">
          TDA
        </span>
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/" className="text-gray-300 hover:text-white transition font-medium">Home</Link>

        {user && (
          <>
            <div className="hidden md:flex gap-4">
              {user.domains.map(d => (
                <Link
                  key={d}
                  to={`/domains/${encodeURIComponent(d)}`}
                  className="text-xs bg-[#60a6dc]/10 text-[#60a6dc] border border-[#60a6dc]/20 px-3 py-1 rounded-full hover:bg-[#60a6dc]/25 transition"
                >
                  {d}
                </Link>
              ))}
            </div>

            {(user.role === 'admin' || user.role === 'super_admin') && (
              <Link
                to="/admin"
                className="flex items-center gap-1 text-[#d4c1b6] hover:text-[#d4c1b6]/90 transition text-sm font-medium"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            )}

            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20 transition cursor-pointer text-sm"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </>
        )}

        {!user && (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-gray-300 hover:text-white transition px-4 py-2 text-sm font-medium"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-[#60a6dc] hover:bg-[#60a6dc]/90 text-[#02223e] font-semibold px-4 py-2 rounded-lg text-sm transition"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-brand-bg text-gray-100 flex flex-col pt-20">
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/domains/:domain"
                element={
                  <ProtectedRoute>
                    <DomainPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
