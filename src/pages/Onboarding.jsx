import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUser } from '@clerk/clerk-react';
import { Compass, AlertCircle, CheckCircle } from 'lucide-react';

const AVAILABLE_DOMAINS = [
  'Machine Learning',
  'Deep Learning',
  'DAV',
  'DSA',
  'WebDev'
];

export default function Onboarding() {
  const { onboard } = useAuth();
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();

  const [selectedDomains, setSelectedDomains] = useState([]);
  const [name, setName] = useState(clerkUser?.fullName || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

    if (selectedDomains.length < 1 || selectedDomains.length > 3) {
      setError('Please select between 1 and 3 domains to proceed.');
      return;
    }

    setLoading(true);
    const res = await onboard(selectedDomains, name);
    setLoading(false);

    if (res.success) {
      setSuccess('Profile configured successfully! Welcome to the Bootcamp.');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } else {
      setError(res.error || 'Failed to complete onboarding. Please try again.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 glass p-8 sm:p-12 rounded-3xl border border-[#d4c1b6]/15 relative overflow-hidden">
        {/* Decorative elements */}
        <span className="absolute top-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute top-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,166,220,0.06)_0,transparent_50%)] pointer-events-none" />

        <div className="text-center relative">
          <div className="mx-auto w-16 h-16 bg-[#60a6dc]/10 border border-[#60a6dc]/25 rounded-full flex items-center justify-center mb-4 text-[#60a6dc]">
            <Compass size={32} className="animate-spin-slow" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Complete Your Profile</h2>
          <p className="mt-2 text-sm text-gray-400">
            Welcome, <span className="text-[#60a6dc] font-semibold">{clerkUser?.fullName || 'Bootcamper'}</span>! Select your technical domains to track progress and view resources.
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

        <form className="space-y-8 relative" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Your Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full bg-[#06385d]/20 p-4 rounded-xl border border-[#d4c1b6]/10 text-white focus:outline-none focus:ring-2 focus:ring-[#60a6dc] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Choose Technical Domains (Select 1 to 3)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#06385d]/20 p-5 rounded-2xl border border-[#d4c1b6]/10">
              {AVAILABLE_DOMAINS.map((domain) => {
                const isChecked = selectedDomains.includes(domain);
                return (
                  <label
                    key={domain}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition cursor-pointer select-none ${isChecked
                      ? 'bg-[#60a6dc]/15 border-[#60a6dc]/40 text-white'
                      : 'bg-[#02223e]/50 border-[#d4c1b6]/10 text-gray-400 hover:bg-[#06385d]/40'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleDomainChange(domain)}
                      className="rounded border-[#d4c1b6]/25 text-[#60a6dc] focus:ring-[#60a6dc] h-5 w-5 accent-[#60a6dc] cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-semibold block">{domain}</span>
                      <span className="text-[10px] text-gray-400">Bootcamp Domain 2026</span>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-400 flex justify-between">
              <span>Selected domains will determine your dashboard leaderboards and learning resources.</span>
              <span className="font-semibold text-[#60a6dc]">{selectedDomains.length} / 3 selected</span>
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || selectedDomains.length === 0}
              className="group relative w-full flex justify-center py-3.5 px-4 text-sm font-bold rounded-xl text-[#02223e] bg-[#60a6dc] hover:bg-[#60a6dc]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#60a6dc] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Completing Onboarding...' : 'Save Domains & Enter Bootcamp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
