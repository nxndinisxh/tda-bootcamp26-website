import React, { useState } from 'react';
import { useSignUp } from '@clerk/clerk-react';
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );

const Spinner = () => (
  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function Register() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const navigate = useNavigate();

  // Step 1 = registration form, Step 2 = OTP verification
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = (e) => e.toLowerCase().endsWith('@learner.manipal.edu');
  const emailDomainOk = email.length === 0 || isValidEmail(email);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  // Step 1 — Create account with email + password
  const handleRegister = async (evt) => {
    evt.preventDefault();
    if (!isLoaded) return;

    if (!isValidEmail(email)) {
      setError('Only @learner.manipal.edu email addresses are allowed.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signUp.create({ emailAddress: email.toLowerCase(), password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep(2);
    } catch (err) {
      setError(
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        'Registration failed. This email may already be registered.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOtp = async (evt) => {
    evt.preventDefault();
    if (!isLoaded) return;

    if (otp.length < 4) {
      setError('Please enter the full verification code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: otp });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/onboarding');
      } else {
        setError('Verification incomplete. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError(
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        'Invalid or expired code. Please check and try again.'
      );
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    } catch (err) {
      setError('Failed to resend code. Please wait a moment and try again.');
    }
  };

  const handleMicrosoftRegister = async () => {
    if (!isLoaded) return;
    setMsLoading(true);
    setError('');
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_microsoft',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/onboarding',
      });
    } catch (err) {
      setError(err.errors?.[0]?.longMessage || 'Microsoft sign-up failed. Please try again.');
      setMsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full glass p-8 sm:p-10 rounded-3xl border border-[#d4c1b6]/15 relative flex flex-col gap-6">
        {/* Corner Sparkles */}
        <span className="absolute top-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute top-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,166,220,0.05)_0,transparent_50%)] pointer-events-none rounded-3xl" />

        {/* ── STEP 2: OTP Verification ── */}
        {step === 2 ? (
          <>
            {/* Header */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#60a6dc]/10 border border-[#60a6dc]/20 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a6dc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Check Your Email</h2>
              <p className="mt-1.5 text-sm text-gray-400">
                We sent a 6-digit code to
              </p>
              <p className="text-sm font-semibold text-[#60a6dc] mt-0.5">{email}</p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Verification Code
                </label>
                <input
                  id="register-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 brand-input text-white placeholder-gray-600 text-sm text-center tracking-[0.4em] font-bold text-lg"
                />
              </div>

              <button
                type="submit"
                id="btn-verify-otp"
                disabled={loading || !isLoaded}
                className="w-full flex items-center justify-center gap-2 bg-[#60a6dc] hover:bg-[#60a6dc]/90 text-[#02223e] font-bold text-sm py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? <Spinner /> : null}
                <span>{loading ? 'Verifying...' : 'Verify & Create Account'}</span>
              </button>
            </form>

            <div className="flex flex-col items-center gap-2 text-xs text-gray-500">
              <span>Didn't receive the code?</span>
              <button
                onClick={handleResendOtp}
                className="text-[#60a6dc] hover:text-[#d4c1b6] font-semibold transition cursor-pointer"
              >
                Resend Code
              </button>
              <button
                onClick={() => { setStep(1); setError(''); setOtp(''); }}
                className="text-gray-500 hover:text-gray-300 transition mt-1 cursor-pointer"
              >
                ← Change email address
              </button>
            </div>
          </>
        ) : (
          /* ── STEP 1: Registration Form ── */
          <>
            {/* Header */}
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Your Account</h2>
              <p className="mt-1.5 text-sm text-gray-400">Join TDA Bootcamp with your Manipal University email</p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                <span>{error}</span>
              </div>
            )}

            {/* Microsoft Button */}
            <button
              onClick={handleMicrosoftRegister}
              disabled={msLoading || !isLoaded}
              id="btn-microsoft-register"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-semibold text-sm py-3 px-5 rounded-xl transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {msLoading ? <Spinner /> : <MicrosoftIcon />}
              <span>{msLoading ? 'Redirecting...' : 'Continue with Microsoft Outlook'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">or with email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  University Email
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  </span>
                  <input
                    id="register-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@learner.manipal.edu"
                    className={`w-full pl-9 pr-4 py-2.5 brand-input text-white placeholder-gray-600 text-sm transition ${!emailDomainOk ? 'border-red-500/50' : ''
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
                  Password <span className="normal-case font-normal text-gray-600">(min. 8 characters)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </span>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
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

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </span>
                  <input
                    id="register-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className={`w-full pl-9 pr-10 py-2.5 brand-input text-white placeholder-gray-600 text-sm transition ${!passwordsMatch ? 'border-red-500/50' : ''
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition cursor-pointer"
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {!passwordsMatch && (
                  <p className="text-[10px] text-red-400">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                id="btn-email-register"
                disabled={loading || !isLoaded || !emailDomainOk || !passwordsMatch}
                className="w-full flex items-center justify-center gap-2 bg-[#60a6dc] hover:bg-[#60a6dc]/90 text-[#02223e] font-bold text-sm py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-1"
              >
                {loading ? <Spinner /> : null}
                <span>{loading ? 'Creating account...' : 'Create Account'}</span>
              </button>
            </form>

            <p className="text-center text-xs text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-[#60a6dc] hover:text-[#d4c1b6] font-semibold transition">
                Sign in here
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
