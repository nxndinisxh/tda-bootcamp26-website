import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, Sun, Waves } from 'lucide-react';

const BeachDecoration = ({ icon: Icon, className }) => (
  <span className={`text-beach-coral/25 pointer-events-none select-none absolute ${className}`}>
    <Icon size={16} />
  </span>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!email.endsWith('@gmail.com')) {
      setError('Only @gmail.com emails are authorized.');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else if (res.unverified) {
      // Redirect to the verification screen
      navigate(`/verify?email=${encodeURIComponent(res.email)}`);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass p-8 sm:p-10 rounded-3xl border border-white/60 relative shadow-md">
        
        {/* Decorative elements */}
        <BeachDecoration icon={Sun} className="top-4 left-4" />
        <BeachDecoration icon={Waves} className="top-4 right-4" />
        <BeachDecoration icon={Waves} className="bottom-4 left-4" />
        <BeachDecoration icon={Sun} className="bottom-4 right-4" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,162,97,0.06)_0,transparent_50%)] pointer-events-none" />
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-beach-teal-dark tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-sm text-beach-teal/70 font-semibold">
            Sign in with your @gmail.com account to continue
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
                University Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-beach-teal/40 pointer-events-none">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm font-semibold"
                />
              </div>
              <p className="mt-1 text-[10px] text-beach-teal/50 font-bold">Must end in @gmail.com</p>
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-beach-coral to-beach-gold hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-beach-coral transition cursor-pointer disabled:opacity-50 shadow-md shadow-beach-coral/15"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-white/80 group-hover:text-white transition" aria-hidden="true" />
              </span>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-beach-teal/10">
          <p className="text-sm text-beach-teal/60 font-semibold">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-beach-coral hover:text-beach-teal transition">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
