import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, UserPlus, AlertCircle, CheckCircle, Sun, Waves } from 'lucide-react';

const AVAILABLE_DOMAINS = [
  'Machine Learning',
  'Deep Learning',
  'DAV',
  'DSA',
  'WebDev'
];

const BeachDecoration = ({ icon: Icon, className }) => (
  <span className={`text-beach-coral/25 pointer-events-none select-none absolute ${className}`}>
    <Icon size={16} />
  </span>
);

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

    if (!email.endsWith('@gmail.com')) {
      setError('Registration is restricted to @gmail.com accounts only.');
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
      <div className="max-w-xl w-full space-y-8 glass p-8 sm:p-10 rounded-3xl border border-white/60 relative shadow-md">
        
        {/* Decorative elements */}
        <BeachDecoration icon={Sun} className="top-4 left-4" />
        <BeachDecoration icon={Waves} className="top-4 right-4" />
        <BeachDecoration icon={Waves} className="bottom-4 left-4" />
        <BeachDecoration icon={Sun} className="bottom-4 right-4" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,162,97,0.05)_0,transparent_50%)] pointer-events-none" />

        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-beach-teal-dark tracking-tight">Create Your Account</h2>
          <p className="mt-2 text-sm text-beach-teal/70 font-semibold">
            Register to join the Bootcamp and track your domain progress
          </p>
        </div>

        {error && (
          <div className="bg-beach-coral/10 border border-beach-coral/20 text-beach-coral p-4 rounded-xl flex items-start gap-2 text-sm font-semibold">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 p-4 rounded-xl flex items-start gap-2 text-sm font-semibold">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-beach-teal/40 pointer-events-none">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm font-semibold"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">
                Email Address
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
                  placeholder="username@gmail.com"
                  className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm font-semibold"
                />
              </div>
              <p className="mt-1 text-[10px] text-beach-teal/50 font-bold">Only @gmail.com email domains are allowed.</p>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-beach-teal/40 pointer-events-none">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Domain Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">
                Domain Selection (Choose 1 to 3)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-beach-teal-light/5 p-4 rounded-2xl border border-beach-teal/15">
                {AVAILABLE_DOMAINS.map((domain) => {
                  const isChecked = selectedDomains.includes(domain);
                  return (
                    <label
                      key={domain}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                        isChecked
                          ? 'bg-beach-teal/10 border-beach-teal/40 text-beach-teal-dark font-bold shadow-xxs'
                          : 'bg-white/40 border-beach-teal/10 text-beach-teal/60 hover:bg-white/60 font-semibold'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleDomainChange(domain)}
                        className="rounded border-beach-teal/20 text-beach-coral focus:ring-beach-coral h-4 w-4 accent-beach-coral cursor-pointer"
                      />
                      <span className="text-sm font-medium">{domain}</span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[10px] text-beach-teal/60 font-semibold">
                Selected: <span className="font-bold text-beach-coral">{selectedDomains.length} / 3</span>
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || selectedDomains.length === 0}
              className="group relative w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-beach-coral to-beach-gold hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-beach-coral transition cursor-pointer disabled:opacity-50 shadow-md shadow-beach-coral/15"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <UserPlus className="h-5 w-5 text-white/80 group-hover:text-white transition" aria-hidden="true" />
              </span>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-beach-teal/10">
          <p className="text-sm text-beach-teal/60 font-semibold">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-beach-coral hover:text-beach-teal transition">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
