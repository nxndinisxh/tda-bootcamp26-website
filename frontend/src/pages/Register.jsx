import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

const AVAILABLE_DOMAINS = [
  'Machine Learning',
  'Deep Learning',
  'DAV',
  'DSA',
  'WebDev'
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleDomainChange = (domain) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(selectedDomains.filter(d => d !== domain));
    } else {
      if (selectedDomains.length >= 3) {
        setError('You can select a maximum of 3 domains.');
        return;
      }
      setError('');
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Standard email registration
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (!email.endsWith('@learner.manipal.edu')) {
      setError('Registration is restricted to @learner.manipal.edu accounts only.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (selectedDomains.length < 1 || selectedDomains.length > 3) {
      setError('Please select between 1 and 3 domains.');
      return;
    }

    setLoading(true);
    const res = await register(name, email, password, selectedDomains);
    setLoading(false);

    if (res.success) {
      setSuccess('Verification email sent! Redirecting to verification page...');
      setTimeout(() => { 
        navigate(`/verify?email=${encodeURIComponent(email)}`); 
      }, 2000);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 glass p-8 sm:p-10 rounded-3xl border border-[#d4c1b6]/15 relative">
        {/* Corner Sparkles */}
        <span className="absolute top-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute top-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,166,220,0.05)_0,transparent_50%)] pointer-events-none" />

        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Your Account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Register to join the Bootcamp and track your domain progress
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-2 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start gap-2 text-sm">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                University Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="username@learner.manipal.edu"
                  className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm"
                />
              </div>
              <p className="mt-1 text-[10px] text-gray-500">Only @learner.manipal.edu email domains are allowed.</p>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <Lock size={18} />
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

            {/* Domain Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Domain Selection (Choose 1 to 3)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-[#06385d]/20 p-4 rounded-2xl border border-[#d4c1b6]/10">
                {AVAILABLE_DOMAINS.map((domain) => {
                  const isChecked = selectedDomains.includes(domain);
                  return (
                    <label
                      key={domain}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                        isChecked
                          ? 'bg-[#60a6dc]/15 border-[#60a6dc]/40 text-white'
                          : 'bg-[#02223e]/50 border-[#d4c1b6]/10 text-gray-400 hover:bg-[#06385d]/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleDomainChange(domain)}
                        className="rounded border-[#d4c1b6]/25 text-[#60a6dc] focus:ring-[#60a6dc] h-4 w-4 accent-[#60a6dc] cursor-pointer"
                      />
                      <span className="text-sm font-medium">{domain}</span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[10px] text-gray-400">
                Selected: <span className="font-semibold text-[#60a6dc]">{selectedDomains.length} / 3</span>
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || selectedDomains.length === 0}
              className="group relative w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-[#02223e] bg-[#60a6dc] hover:bg-[#60a6dc]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#60a6dc] transition cursor-pointer disabled:opacity-50"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <UserPlus className="h-5 w-5 text-[#02223e]/70 group-hover:text-[#02223e] transition" aria-hidden="true" />
              </span>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-[#d4c1b6]/10">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#60a6dc] hover:text-[#d4c1b6] transition">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
