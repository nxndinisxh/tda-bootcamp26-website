import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, LogIn } from 'lucide-react';

export default function Register() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass p-8 sm:p-10 rounded-3xl border border-[#d4c1b6]/15 relative text-center">
        {/* Corner Sparkles */}
        <span className="absolute top-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute top-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 left-4 text-xs text-white/30 sparkle-pulse">✦</span>
        <span className="absolute bottom-4 right-4 text-xs text-white/30 sparkle-pulse">✦</span>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,166,220,0.06)_0,transparent_50%)] pointer-events-none" />

        <div className="space-y-4">
          <div className="h-16 w-16 bg-[#60a6dc]/10 text-[#60a6dc] rounded-full flex items-center justify-center mx-auto border border-[#60a6dc]/25">
            <ShieldCheck size={36} />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Onboarding Pre-Configured</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            The organizers have pre-created accounts for all enrolled participants. Self-registration is not required.
          </p>
        </div>

        <div className="bg-[#06385d]/20 border border-[#60a6dc]/25 p-5 rounded-2xl space-y-3 text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#60a6dc]">How to access your account:</p>
          <ul className="text-xs text-gray-300 space-y-2 list-disc pl-4">
            <li>Your **User ID** is your student **Registration Number** (e.g. `240962067`).</li>
            <li>Your **Temporary Password** is also set as your Registration Number by default.</li>
            <li>On your first login, the system will prompt you to reset your password for security.</li>
          </ul>
        </div>

        <div className="pt-4">
          <Link
            to="/login"
            className="group relative w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-[#02223e] bg-[#60a6dc] hover:bg-[#60a6dc]/90 focus:outline-none transition cursor-pointer"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LogIn className="h-5 w-5 text-[#02223e]/70 group-hover:text-[#02223e] transition" aria-hidden="true" />
            </span>
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
