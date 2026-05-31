import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, LogIn, AlertCircle, KeyRound, Eye, EyeOff, Sun, Waves } from 'lucide-react';

const BeachDecoration = ({ icon: Icon, className }) => (
  <div className={`absolute text-beach-teal/15 w-8 h-8 pointer-events-none select-none ${className} hover:scale-110 transition duration-300`}>
    <Icon className="w-full h-full stroke-[1.5]" />
  </div>
);

export default function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFirstLoginState, setIsFirstLoginState] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user, login, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

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
        <div className="max-w-md w-full space-y-8 glass p-8 sm:p-10 rounded-3xl border border-white/60 relative shadow-md">
          {/* Corner Sparkles */}
          <span className="absolute top-4 left-4 text-xs text-beach-teal/20 sparkle-pulse">✦</span>
          <span className="absolute top-4 right-4 text-xs text-beach-teal/20 sparkle-pulse">✦</span>
          <span className="absolute bottom-4 left-4 text-xs text-beach-teal/20 sparkle-pulse">✦</span>
          <span className="absolute bottom-4 right-4 text-xs text-beach-teal/20 sparkle-pulse">✦</span>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,166,220,0.06)_0,transparent_50%)] pointer-events-none" />

          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-beach-teal-dark tracking-tight">Set New Password</h2>
            <p className="mt-2 text-sm text-beach-teal/70 font-semibold">
              This is your first login. Please choose a secure password to activate your account.
            </p>
            <p className="mt-2.5 text-xs text-beach-coral font-bold bg-beach-coral/5 border border-beach-coral/15 px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 animate-pulse">
              <span>⚠️</span>
              <span>For security reasons, we do not store your updated password in plain text. Please make sure you remember it.</span>
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
                <label className="block text-xs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-beach-teal/40 pointer-events-none">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-3 brand-input transition text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-beach-teal/40 hover:text-beach-teal transition cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-beach-teal/40 pointer-events-none">
                    <KeyRound size={18} />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-3 brand-input transition text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-beach-teal/40 hover:text-beach-teal transition cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-[#7c3aed] hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] transition cursor-pointer disabled:opacity-50 shadow-md shadow-[#7c3aed]/20"
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
      <div className="max-w-md w-full space-y-8 glass p-8 sm:p-10 rounded-3xl border border-white/60 relative shadow-md">

        {/* Decorative elements */}
        <BeachDecoration icon={Sun} className="top-4 left-4" />
        <BeachDecoration icon={Waves} className="top-4 right-4" />
        <BeachDecoration icon={Waves} className="bottom-4 left-4" />
        <BeachDecoration icon={Sun} className="bottom-4 right-4" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,166,220,0.06)_0,transparent_50%)] pointer-events-none" />

        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-beach-teal-dark tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-sm text-beach-teal/70 font-semibold">
            Sign in with your Registration Number to continue
          </p>
        </div>

        {error && (
          <div className="bg-beach-coral/10 border border-beach-coral/20 text-beach-coral p-4 rounded-xl flex items-start gap-2 text-sm font-semibold">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">
                Registration Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-beach-teal/40 pointer-events-none">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. 2409XXXXX"
                  className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-beach-teal/40 pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-beach-teal/40 hover:text-beach-teal transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-[#7c3aed] hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] transition cursor-pointer disabled:opacity-50 shadow-md shadow-[#7c3aed]/20"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-white/80 group-hover:text-white transition" aria-hidden="true" />
              </span>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
