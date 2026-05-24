import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DomainPage from './pages/DomainPage';
import AdminDashboard from './pages/AdminDashboard';
import Onboarding from './pages/Onboarding';
import { LogOut, LayoutDashboard, Compass, ShieldAlert, Award } from 'lucide-react';

// Protected Route Guard for general logged-in users
const ProtectedRoute = ({ children }) => {
  const { user, loading, isOnboardingRequired } = useAuth();
  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">Loading...</div>;
  if (!user && !isOnboardingRequired) return <Navigate to="/login" replace />;
  if (isOnboardingRequired) return <Navigate to="/onboarding" replace />;
  return children;
};

// Protected Route Guard for Admin/Super-Admin
const AdminRoute = ({ children }) => {
  const { user, loading, isOnboardingRequired } = useAuth();
  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">Loading...</div>;
  if (!user && !isOnboardingRequired) return <Navigate to="/login" replace />;
  if (isOnboardingRequired) return <Navigate to="/onboarding" replace />;
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Onboarding Route Guard (Only allow if signed in but not onboarded)
const OnboardingRoute = ({ children }) => {
  const { user, loading, isOnboardingRequired } = useAuth();
  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white">Loading...</div>;
  if (!user && !isOnboardingRequired) return <Navigate to="/login" replace />;
  if (user && !isOnboardingRequired) return <Navigate to="/" replace />;
  return children;
};

// Navigation Header Component
const Navbar = () => {
  const { user, logout, isOnboardingRequired, isSignedIn } = useAuth();

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-[#d4c1b6]/10">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-[#60a6dc] to-[#d4c1b6] bg-clip-text text-transparent text-glow-primary">
          TDA
        </span>
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/" className="text-gray-300 hover:text-white transition font-medium">Home</Link>

        {isOnboardingRequired ? (
          <button
            onClick={logout}
            className="flex items-center gap-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20 transition cursor-pointer text-sm"
          >
            <LogOut size={16} />
            <span>Cancel & Logout</span>
          </button>
        ) : user ? (
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
        ) : isSignedIn ? (
          <div className="flex items-center gap-4 pl-4 border-l border-white/10">
            <button
              onClick={logout}
              className="flex items-center gap-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20 transition cursor-pointer text-sm"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
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

// Shown whenever the server rejects the session due to email domain
const DomainBlockedScreen = () => {
  const { domainError, logout } = useAuth();
  if (!domainError) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#02223e] flex items-center justify-center px-4">
      <div className="max-w-md w-full glass rounded-3xl border border-red-500/20 p-10 flex flex-col items-center gap-6 text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.06)_0,transparent_60%)] pointer-events-none" />
        <span className="absolute top-4 left-4 text-xs text-white/20">✦</span>
        <span className="absolute top-4 right-4 text-xs text-white/20">✦</span>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="m4.9 4.9 14.2 14.2"/>
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Access Denied</h2>
          <p className="mt-3 text-sm text-red-300 font-medium leading-relaxed">{domainError}</p>
          <p className="mt-2 text-xs text-gray-400 leading-relaxed">
            This platform is exclusively for Manipal Institute of Technology students.<br />
            Please sign in with your university email address.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-2 bg-[#06385d]/50 border border-[#60a6dc]/15 rounded-xl px-4 py-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a6dc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <span className="text-xs font-semibold text-[#60a6dc]">Required: @learner.manipal.edu</span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-sm py-3 rounded-xl transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Sign out and try a different account
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <DomainBlockedScreen />
        <div className="min-h-screen bg-brand-bg text-gray-100 flex flex-col pt-20">
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Handles Microsoft OAuth redirect from Clerk */}
              <Route
                path="/sso-callback"
                element={<AuthenticateWithRedirectCallback />}
              />
              
              <Route
                path="/onboarding"
                element={
                  <OnboardingRoute>
                    <Onboarding />
                  </OnboardingRoute>
                }
              />

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
