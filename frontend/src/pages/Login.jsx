import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, LogIn, AlertCircle, KeyRound } from 'lucide-react';

export default function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFirstLoginState, setIsFirstLoginState] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!userId || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const res = await login(userId.trim(), password);
    setLoading(false);

    if (res.success) {
      if (res.isFirstLogin) {
        setIsFirstLoginState(true);
        setTempPassword(password);
      } else {
        navigate('/');
      }
    } else if (res.unverified) {
      navigate(`/verify?email=${encodeURIComponent(res.email)}`);
    } else {
      setError(res.error);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await resetPassword(userId.trim(), tempPassword, newPassword);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error);
    }
  };

  if (isFirstLoginState) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 glass p-8 sm:p-10 rounded-3xl border border-[#d4c1b6]/15 relative">
          {/* Corner Sparkles */}
          <span className="absolute top-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
          <span className="absolute top-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>
          <span className="absolute bottom-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
          <span className="absolute bottom-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,166,220,0.06)_0,transparent_50%)] pointer-events-none" />
          
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Set New Password</h2>
            <p className="mt-2 text-sm text-gray-400">
              This is your first login. Please choose a secure password to activate your account.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-2 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleResetSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <KeyRound size={18} />
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-brand-bg bg-[#60a6dc] hover:bg-[#60a6dc]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#60a6dc] transition cursor-pointer disabled:opacity-50"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <LogIn className="h-5 w-5 text-brand-bg/70 group-hover:text-brand-bg transition" aria-hidden="true" />
                </span>
                {loading ? 'Setting Password...' : 'Save & Log In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass p-8 sm:p-10 rounded-3xl border border-[#d4c1b6]/15 relative">
        {/* Corner Sparkles */}
        <span className="absolute top-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute top-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,166,220,0.06)_0,transparent_50%)] pointer-events-none" />
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in with your Registration Number to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-2 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Registration Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. 240962067"
                  className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-brand-bg bg-[#60a6dc] hover:bg-[#60a6dc]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#60a6dc] transition cursor-pointer disabled:opacity-50"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-brand-bg/70 group-hover:text-brand-bg transition" aria-hidden="true" />
              </span>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-[#d4c1b6]/10">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#60a6dc] hover:text-[#d4c1b6] transition">
              Onboarding Info
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
