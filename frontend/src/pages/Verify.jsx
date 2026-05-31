import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ShieldCheck, AlertCircle, ArrowRight, RefreshCw, Loader2, Sun, Waves } from 'lucide-react';

const BeachDecoration = ({ icon: Icon, className }) => (
  <span className={`text-beach-coral/25 pointer-events-none select-none absolute ${className}`}>
    <Icon size={16} />
  </span>
);

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmailWithOtp, verifyEmailWithToken, resendOtp } = useAuth();

  const tokenParam = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Resend Timer State
  const [resendTimer, setResendTimer] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef([]);

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (tokenParam) {
      const verifyToken = async () => {
        setLoading(true);
        setError('');
        const res = await verifyEmailWithToken(tokenParam);
        setLoading(false);
        if (res.success) {
          setSuccess('Email verified successfully! Logging you in...');
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else {
          setError(res.error || 'This verification link is invalid or has expired.');
        }
      };
      verifyToken();
    }
  }, [tokenParam]);

  // Resend timer countdown effect
  useEffect(() => {
    if (resendTimer > 0 && emailParam && !tokenParam) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer, emailParam, tokenParam]);

  // Handle single digit input changes
  const handleOtpChange = (e, index) => {
    const val = e.target.value;
    if (isNaN(val)) return;

    const newOtp = [...otp];
    // Keep only the last character entered
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Auto-focus next input field
    if (val && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle backspaces to go to previous input
  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      }
    }
  };

  // Handle paste events across inputs
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const digits = pasteData.split('');
    setOtp(digits);
    inputRefs.current[5].focus();
  };

  // Submit OTP
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    const res = await verifyEmailWithOtp(emailParam, otpCode);
    setLoading(false);

    if (res.success) {
      setSuccess('Account verified and activated! Logging you in...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } else {
      setError(res.error || 'Invalid or expired verification code.');
    }
  };

  // Resend OTP handler
  const handleResend = async () => {
    if (resendTimer > 0) return;

    setResendLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await resendOtp(emailParam);

      if (!res.success) {
        throw new Error(res.error || 'Failed to resend verification code.');
      }

      setSuccess('A new verification code has been sent to your email.');
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  // Render direct link verification status
  if (tokenParam) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 glass p-8 sm:p-10 rounded-3xl border border-white/60 text-center relative shadow-md text-beach-teal-dark">
          <BeachDecoration icon={Sun} className="top-4 left-4" />
          <BeachDecoration icon={Waves} className="top-4 right-4" />

          {loading && (
            <div className="space-y-6 py-6">
              <Loader2 className="h-16 w-16 text-beach-teal animate-spin mx-auto" />
              <h3 className="text-xl font-extrabold text-beach-teal-dark">Verifying Link</h3>
              <p className="text-beach-teal/70 text-sm font-semibold">Please wait while we confirm your registration details...</p>
            </div>
          )}

          {success && (
            <div className="space-y-6 py-6">
              <div className="h-16 w-16 bg-emerald-600/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-600/20">
                <ShieldCheck size={36} />
              </div>
              <h3 className="text-xl font-extrabold text-beach-teal-dark">Verification Successful</h3>
              <p className="text-emerald-600 text-sm font-bold">{success}</p>
            </div>
          )}

          {error && (
            <div className="space-y-6 py-6">
              <div className="h-16 w-16 bg-beach-coral/10 text-beach-coral rounded-full flex items-center justify-center mx-auto border border-beach-coral/20">
                <AlertCircle size={36} />
              </div>
              <h3 className="text-xl font-extrabold text-beach-teal-dark">Verification Failed</h3>
              <p className="text-beach-coral text-sm font-bold">{error}</p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-beach-teal hover:text-beach-coral transition"
                >
                  Return to Login <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render OTP verification status
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass p-8 sm:p-10 rounded-3xl border border-white/60 relative shadow-md text-beach-teal-dark">

        {/* Decorative elements */}
        <BeachDecoration icon={Sun} className="top-4 left-4" />
        <BeachDecoration icon={Waves} className="top-4 right-4" />
        <BeachDecoration icon={Waves} className="bottom-4 left-4" />
        <BeachDecoration icon={Sun} className="bottom-4 right-4" />

        <div className="text-center">
          <div className="h-12 w-12 bg-beach-teal/10 text-beach-teal rounded-full flex items-center justify-center mx-auto border border-beach-teal/20 mb-4 shadow-xxs">
            <Mail size={24} />
          </div>
          <h2 className="text-3xl font-extrabold text-beach-teal-dark tracking-tight">Verify Your Email</h2>
          <p className="mt-2 text-sm text-beach-teal/70 font-semibold">
            {emailParam ? (
              <span>We sent a verification code to <strong className="text-beach-coral font-bold">{emailParam}</strong></span>
            ) : (
              <span>Please enter the code sent to your student email</span>
            )}
          </p>
        </div>

        {error && (
          <div className="bg-beach-coral/10 border border-beach-coral/20 text-beach-coral p-4 rounded-xl flex items-start gap-2 text-sm font-bold animate-pulse">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 p-4 rounded-xl flex items-start gap-2 text-sm font-bold">
            <ShieldCheck size={18} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {emailParam ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block text-center text-xs font-bold uppercase tracking-wider text-beach-teal/70">
                Enter 6-Digit OTP Code
              </label>

              {/* Digit Input Matrix */}
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    required
                    ref={(el) => (inputRefs.current[idx] = el)}
                    value={digit}
                    onChange={(e) => handleOtpChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold bg-white/55 border border-beach-teal/20 rounded-xl text-beach-teal-dark focus:outline-none focus:border-beach-teal-light focus:ring-1 focus:ring-beach-teal-light transition shadow-xxs"
                  />
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="group relative w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-[#7c3aed] hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#7c3aed]/20"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <span className="flex items-center gap-2">Activate Account <ArrowRight size={16} /></span>
                )}
              </button>
            </div>

            {/* Resend Action Footer */}
            <div className="text-center pt-2">
              {resendTimer > 0 ? (
                <p className="text-xs text-beach-teal/50 font-bold">
                  Resend verification code in <span className="font-extrabold text-beach-teal/70">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-xs font-bold text-beach-coral hover:text-beach-teal transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {resendLoading ? (
                    <>Sending...</>
                  ) : (
                    <><RefreshCw size={12} /> Resend Verification Email</>
                  )}
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="text-center py-4 space-y-4">
            <p className="text-sm text-beach-teal/60 font-semibold">
              No email was provided. Please return to the login screen to sign in.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-beach-teal hover:text-beach-coral transition"
              >
                Go to Login <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
