import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, UserPlus, AlertCircle, Sun, Waves } from 'lucide-react';

const AVAILABLE_DOMAINS = ['DSA', 'DAV', 'ML/DL', 'Gen & Agentic AI', 'WebDev'];

const BeachDecoration = ({ icon: Icon, className }) => (
  <div className={`absolute text-beach-teal/15 w-8 h-8 pointer-events-none select-none ${className} hover:scale-110 transition duration-300`}>
    <Icon className="w-full h-full stroke-[1.5]" />
  </div>
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
      setSelectedDomains(selectedDomains.filter((d) => d !== domain));
    } else {
      if (selectedDomains.length >= 3) {
        setError('You can select a maximum of 3 domains.');
        return;
      }
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (selectedDomains.length === 0) {
      setError('Please select at least one domain.');
      return;
    }

    setLoading(true);
    const res = await register(name, email, password, selectedDomains);
    setLoading(false);

    if (res.success) {
      setSuccess('Registration successful! Please log in.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(res.error || 'Registration failed.');
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

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,166,220,0.06)_0,transparent_50%)] pointer-events-none" />

        <div className="text-center">
          <h2 className="text-3xl font-black text-beach-teal-dark tracking-tight">Create Account</h2>
          <p className="mt-2 text-sm text-beach-teal/60 font-semibold">
            Sign up for the TDA Bootcamp '26
          </p>
        </div>

        {error && (
          <div className="bg-beach-coral/10 border border-beach-coral/20 text-beach-coral p-4 rounded-xl flex items-start gap-2 text-sm font-semibold">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-beach-teal-light/10 border border-beach-teal-light/20 text-beach-teal-light p-4 rounded-xl flex items-start gap-2 text-sm font-semibold">
            <span>{success}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">
                Name
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
                  placeholder="Your Name"
                  className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm font-semibold"
                />
              </div>
            </div>

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
            </div>

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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">
                Domain Selection (Choose 1 to 3)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white/30 p-4 rounded-2xl border border-beach-teal/15">
                {AVAILABLE_DOMAINS.map((domain) => {
                  const isChecked = selectedDomains.includes(domain);
                  return (
                    <label
                      key={domain}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                        isChecked
                          ? 'bg-beach-teal-light/15 border-beach-teal-light/40 text-beach-teal-dark font-bold'
                          : 'bg-white/40 border-beach-teal/10 text-beach-teal/60 hover:bg-white/60 hover:text-beach-teal-dark'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleDomainChange(domain)}
                        className="rounded border-beach-teal/25 text-beach-teal-light focus:ring-beach-teal-light h-4 w-4 accent-beach-teal-light cursor-pointer"
                      />
                      <span className="text-sm font-semibold">{domain}</span>
                    </label>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[10px] text-beach-teal/60 font-semibold">
                Selected: <span className="font-bold text-beach-teal-light">{selectedDomains.length} / 3</span>
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
            <Link to="/login" className="font-bold text-beach-coral hover:text-beach-gold transition">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
