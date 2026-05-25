import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ShieldCheck, AlertCircle, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmailWithOtp, verifyEmailWithToken } = useAuth();

  const tokenParam = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Resend Timer State
  const [resendTimer, setResendTimer] = useState(60);
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
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to resend verification code.');
      }
      
      setSuccess('A new verification code has been sent to your email.');
      setResendTimer(60);
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
        <div className="max-w-md w-full space-y-8 glass p-8 sm:p-10 rounded-3xl border border-[#d4c1b6]/15 text-center relative">
          <span className="absolute top-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
          <span className="absolute top-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>

          {loading && (
            <div className="space-y-6 py-6">
              <Loader2 className="h-16 w-16 text-[#60a6dc] animate-spin mx-auto" />
              <h3 className="text-xl font-bold text-white">Verifying Link</h3>
              <p className="text-gray-400 text-sm">Please wait while we confirm your registration details...</p>
            </div>
          )}

          {success && (
            <div className="space-y-6 py-6">
              <div className="h-16 w-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                <ShieldCheck size={36} />
              </div>
              <h3 className="text-xl font-bold text-white">Verification Successful</h3>
              <p className="text-emerald-400 text-sm font-semibold">{success}</p>
            </div>
          )}

          {error && (
            <div className="space-y-6 py-6">
              <div className="h-16 w-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <AlertCircle size={36} />
              </div>
              <h3 className="text-xl font-bold text-white">Verification Failed</h3>
              <p className="text-red-400 text-sm">{error}</p>
              <div className="pt-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#60a6dc] hover:text-[#d4c1b6] transition"
                >
                  Return to Register <ArrowRight size={16} />
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
      <div className="max-w-md w-full space-y-8 glass p-8 sm:p-10 rounded-3xl border border-[#d4c1b6]/15 relative">
        <span className="absolute top-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute top-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>

        <div className="text-center">
          <div className="h-12 w-12 bg-[#60a6dc]/10 text-[#60a6dc] rounded-full flex items-center justify-center mx-auto border border-[#60a6dc]/20 mb-4">
            <Mail size={24} />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Verify Your Email</h2>
          <p className="mt-2 text-sm text-gray-400">
            {emailParam ? (
              <span>We sent a verification code to <strong className="text-white">{emailParam}</strong></span>
            ) : (
              <span>Please enter the code sent to your student email</span>
            )}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-2 text-sm animate-pulse">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start gap-2 text-sm">
            <ShieldCheck size={18} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {emailParam ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
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
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold bg-[#02223e]/65 border border-[#d4c1b6]/25 rounded-xl text-white focus:outline-none focus:border-[#60a6dc] focus:ring-1 focus:ring-[#60a6dc] transition"
                  />
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="group relative w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-[#02223e] bg-[#60a6dc] hover:bg-[#60a6dc]/90 focus:outline-none focus:ring-2 focus:ring-[#60a6dc] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#02223e]" />
                ) : (
                  <span className="flex items-center gap-2">Activate Account <ArrowRight size={16} /></span>
                )}
              </button>
            </div>
            
            {/* Resend Action Footer */}
            <div className="text-center pt-2">
              {resendTimer > 0 ? (
                <p className="text-xs text-gray-500">
                  Resend verification code in <span className="font-semibold text-gray-400">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-xs font-semibold text-[#60a6dc] hover:text-[#d4c1b6] transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
            <p className="text-sm text-gray-400">
              No email was provided. Please go back to the registration screen to sign up.
            </p>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#60a6dc] hover:text-[#d4c1b6] transition"
              >
                Go to Register <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
