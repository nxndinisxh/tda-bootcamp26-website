import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import DomainPage from './pages/DomainPage';
import AdminDashboard from './pages/AdminDashboard';
import Verify from './pages/Verify';
import { LogOut, LayoutDashboard, Sun, Moon, Bell } from 'lucide-react';

// Protected Route Guard for general logged-in users
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-beach-teal font-semibold">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Protected Route Guard for Admin/Super-Admin
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-beach-teal font-semibold">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Navigation Header Component
const Navbar = ({ darkMode, toggleTheme }) => {
  const { user, logout } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchAnnouncements = async () => {
      try {
        const token = localStorage.getItem('tda_token');
        const res = await fetch('/api/dashboard/announcements', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data || []);
          if (data && data.length > 0) {
            const seenCount = Number(localStorage.getItem('tda_seen_announcements_count') || 0);
            if (data.length > seenCount) {
              setHasUnread(true);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching announcements:', err);
      }
    };
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 120000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnread(false);
      localStorage.setItem('tda_seen_announcements_count', announcements.length.toString());
    }
  };

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/40">
      <Link to="/" className="flex items-center">
        <img src="/favicon.png" alt="TDA Logo" className="h-12 w-auto object-contain hover:scale-105 transition-all duration-200" />
      </Link>

      <div className="flex items-center gap-6">

        {user && (
          <>
            <div className="hidden md:flex gap-4">
              {user.domains.map(d => (
                <Link
                  key={d}
                  to={`/domains/${encodeURIComponent(d)}`}
                  className="text-xs bg-beach-teal/10 text-beach-teal border border-beach-teal/20 px-3 py-1 rounded-full hover:bg-beach-teal/20 transition font-bold"
                >
                  {d}
                </Link>
              ))}
            </div>

            {(user.role === 'admin' || user.role === 'super_admin') && (
              <Link
                to="/admin"
                className="flex items-center gap-1 text-beach-teal-light hover:text-beach-teal transition text-sm font-bold"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            )}
          </>
        )}

        {/* Bell Icon Dropdown (Logged in users only) */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleBellClick}
              className="bg-white/80 dark:bg-white/5 backdrop-blur border border-beach-teal/10 dark:border-white/15 rounded-xl p-2 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer flex items-center justify-center dark:hover:border-white/30 dark:hover:bg-white/10 relative"
              title="Recent Announcements"
            >
              <Bell size={18} className="text-beach-teal dark:text-slate-300" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7c3aed] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#7c3aed]"></span>
                </span>
              )}
            </button>

            {/* Dropdown Menu (No glassmorphism) */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden text-left">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-beach-teal-dark dark:text-white uppercase tracking-wider">
                    Recent Updates
                  </span>
                  <span className="bg-[#7c3aed]/10 text-[#7c3aed] dark:text-[#a78bfa] text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {announcements.length} New
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                  {announcements.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic font-medium">
                      No announcements yet.
                    </div>
                  ) : (
                    announcements.map((ann) => (
                      <div 
                        key={ann.id || ann._id} 
                        className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition duration-150"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[9px] font-bold text-[#7c3aed] dark:text-[#a78bfa] uppercase tracking-wider bg-[#7c3aed]/5 px-2 py-0.5 rounded">
                            {ann.domain}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                            {new Date(ann.date).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-800 dark:text-white mt-1">
                          {ann.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-medium whitespace-pre-wrap">
                          {ann.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="bg-white/80 dark:bg-white/5 backdrop-blur border border-beach-teal/10 dark:border-white/15 rounded-xl p-2 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer flex items-center justify-center dark:hover:border-white/30 dark:hover:bg-white/10"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? (
            <Moon size={18} className="text-violet-400 fill-violet-400/35" />
          ) : (
            <Sun size={18} className="text-amber-500 fill-amber-500/35" />
          )}
        </button>

        {user ? (
          <div className="flex items-center gap-4 pl-4 border-l border-beach-teal/15">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-beach-teal-dark">{user.name}</p>
              <p className="text-[10px] text-beach-teal/70 capitalize font-medium">{user.role.replace('_', ' ')}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 bg-transparent text-[#7c3aed] dark:text-[#a78bfa] hover:bg-[#7c3aed]/5 px-3 py-1.5 rounded-xl border border-[#7c3aed] dark:border-[#a78bfa] transition cursor-pointer text-sm font-bold"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 rounded-xl text-sm font-bold transition duration-200 cursor-pointer shadow-sm shadow-[#7c3aed]/10"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

function App() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen text-beach-teal-dark flex flex-col pt-20">
          <Navbar darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              {/* <Route path="/register" element={<Register />} /> */}
              <Route path="/verify" element={<Verify />} />

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
