import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldCheck, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { changePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setLoading(false);

    if (res.success) {
      setSuccess('Password updated successfully! Redirecting to home...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } else {
      setError(res.error || 'Failed to update password.');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass p-8 sm:p-10 rounded-3xl border border-white/60 relative shadow-md">
        <span className="absolute top-4 left-4 text-xs text-beach-teal/20 sparkle-pulse">✦</span>
        <span className="absolute top-4 right-4 text-xs text-beach-teal/20 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 left-4 text-xs text-beach-teal/20 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 right-4 text-xs text-beach-teal/20 sparkle-pulse">✦</span>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,166,220,0.06)_0,transparent_50%)] pointer-events-none" />

        <div className="text-center">
          <div className="h-12 w-12 bg-beach-teal/10 text-beach-teal rounded-full flex items-center justify-center mx-auto border border-beach-teal/20 mb-4 shadow-xxs">
            <Lock size={24} />
          </div>
          <h2 className="text-3xl font-extrabold text-beach-teal-dark tracking-tight">Change Password</h2>
          <p className="mt-2 text-sm text-beach-teal/70 font-semibold">
            For security, you must update your temporary password before accessing the bootcamp.
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
            <ShieldCheck size={18} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">
                Temporary / Current Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-beach-teal/40 pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-beach-teal/40 pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 brand-input transition text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">
                Confirm New Password
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
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-[#7c3aed] hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] transition cursor-pointer disabled:opacity-50 shadow-md shadow-[#7c3aed]/20"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-brand-bg" />
              ) : (
                <span className="flex items-center gap-2">
                  Update Password <ArrowRight size={16} />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
