import React, { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { Link, useNavigate } from 'react-router-dom';

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const EyeIcon = ({ open }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
  );

const Spinner = () => (
  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function Login() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = (e) => e.toLowerCase().endsWith('@learner.manipal.edu');

  const handleEmailLogin = async (evt) => {
    evt.preventDefault();
    if (!isLoaded) return;

    if (!isValidEmail(email)) {
      setError('Only @learner.manipal.edu email addresses are allowed.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await signIn.create({ identifier: email.toLowerCase(), password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/');
      }
    } catch (err) {
      setError(
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        'Invalid email or password. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    if (!isLoaded) return;
    setMsLoading(true);
    setError('');
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_microsoft',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch (err) {
      setError(err.errors?.[0]?.longMessage || 'Microsoft sign-in failed. Please try again.');
      setMsLoading(false);
    }
  };

  const emailDomainOk = email.length === 0 || isValidEmail(email);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full glass p-8 sm:p-10 rounded-3xl border border-[#d4c1b6]/15 relative flex flex-col gap-6">
        {/* Corner Sparkles */}
        <span className="absolute top-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute top-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,166,220,0.06)_0,transparent_50%)] pointer-events-none rounded-3xl" />

        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back</h2>
          <p className="mt-1.5 text-sm text-gray-400">Sign in with your Manipal University account</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            <span>{error}</span>
          </div>
        )}

        {/* Microsoft OAuth Button */}
        <button
          onClick={handleMicrosoftLogin}
          disabled={msLoading || !isLoaded}
          id="btn-microsoft-login"
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-semibold text-sm py-3 px-5 rounded-xl transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {msLoading ? <Spinner /> : <MicrosoftIcon />}
          <span>{msLoading ? 'Redirecting...' : 'Sign in with Microsoft Outlook'}</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">or with email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              University Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </span>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@learner.manipal.edu"
                className={`w-full pl-9 pr-4 py-2.5 brand-input text-white placeholder-gray-600 text-sm transition ${
                  !emailDomainOk ? 'border-red-500/50 focus:border-red-500' : ''
                }`}
              />
            </div>
            {!emailDomainOk && (
              <p className="text-[10px] text-red-400">Only @learner.manipal.edu emails are allowed</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-10 py-2.5 brand-input text-white placeholder-gray-600 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition cursor-pointer"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="btn-email-login"
            disabled={loading || !isLoaded || !emailDomainOk}
            className="w-full flex items-center justify-center gap-2 bg-[#60a6dc] hover:bg-[#60a6dc]/90 text-[#02223e] font-bold text-sm py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-1"
          >
            {loading ? <Spinner /> : null}
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          New to TDA Bootcamp?{' '}
          <Link to="/register" className="text-[#60a6dc] hover:text-[#d4c1b6] font-semibold transition">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
