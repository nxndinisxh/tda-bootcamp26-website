import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code, Database, Brain, Globe, BarChart2, Shield, ArrowRight, Award, Users } from 'lucide-react';

const DOMAIN_DETAILS = [
  {
    name: 'DSA',
    desc: 'Master algorithms, data structures, and problem-solving patterns. Essential for technical interviews and efficient code.',
    icon: Code,
    color: 'from-[#60a6dc] to-[#d4c1b6]',
    accent: 'bg-[#60a6dc]/10 text-[#60a6dc] border-[#60a6dc]/25'
  },
  {
    name: 'Machine Learning',
    desc: 'Dive into supervised and unsupervised learning, regression models, classification algorithms, and feature engineering.',
    icon: Brain,
    color: 'from-[#60a6dc] to-[#06385d]',
    accent: 'bg-[#60a6dc]/10 text-[#60a6dc] border-[#60a6dc]/25'
  },
  {
    name: 'Deep Learning',
    desc: 'Build and train neural networks, CNNs for computer vision, RNNs/Transformers for NLP, and generative models.',
    icon: Shield,
    color: 'from-[#d4c1b6] to-[#02223e]',
    accent: 'bg-[#d4c1b6]/10 text-[#d4c1b6] border-[#d4c1b6]/25'
  },
  {
    name: 'WebDev',
    desc: 'Create highly responsive, modern, and high-performance full-stack web applications with modern frameworks.',
    icon: Globe,
    color: 'from-[#60a6dc] to-[#d4c1b6]',
    accent: 'bg-[#60a6dc]/10 text-[#60a6dc] border-[#60a6dc]/25'
  },
  {
    name: 'DAV',
    desc: 'Analyze, clean, and visualize complex datasets. Make data-driven decisions using stats, Pandas, and Matplotlib.',
    icon: BarChart2,
    color: 'from-[#d4c1b6] to-[#06385d]',
    accent: 'bg-[#d4c1b6]/10 text-[#d4c1b6] border-[#d4c1b6]/25'
  }
];

const TEAM_MEMBERS = [
  { name: 'Dr. Anita Rao', role: 'Faculty Advisor', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60' },
  { name: 'Aryan Mehta', role: 'Super Admin / Lead', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60' },
  { name: 'Rohan Sharma', role: 'DSA Domain Head', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60' },
  { name: 'Pooja Hegde', role: 'ML Domain Head', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60' }
];

// 4-point sparkle component matching Bright Path layout
const Sparkle = ({ className }) => (
  <span className={`text-white/40 font-bold select-none pointer-events-none sparkle-pulse ${className}`}>
    ✦
  </span>
);

export default function Landing() {
  const { user, isOnboardingRequired, logout, isSignedIn } = useAuth();

  if (isOnboardingRequired) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex flex-col gap-20 py-8 relative">
      {/* Background Decorative Sparkles */}
      <Sparkle className="absolute top-48 left-12 text-sm animate-pulse" />
      <Sparkle className="absolute top-96 right-24 text-lg animate-pulse" />
      <Sparkle className="absolute bottom-[30%] left-[15%] text-base animate-pulse" />

      {/* Hero Section */}
      <section className="relative text-center py-20 flex flex-col items-center justify-center min-h-[65vh] rounded-3xl overflow-hidden glass border border-[#d4c1b6]/10 px-6 bg-hero-gradient">
        {/* Four Corner Sparkles matching the reference image */}
        <Sparkle className="absolute top-6 left-6 text-xl" />
        <Sparkle className="absolute top-6 right-6 text-xl" />
        <Sparkle className="absolute bottom-6 left-6 text-xl" />
        <Sparkle className="absolute bottom-6 right-6 text-xl" />

        {/* Glow circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(96,166,220,0.1)_0%,transparent_60%)] pointer-events-none" />

        <span className="text-xs font-bold tracking-widest text-[#60a6dc] bg-[#60a6dc]/10 border border-[#60a6dc]/20 px-4 py-2 rounded-full mb-6 uppercase">
          The Data Alchemists (TDA) Bootcamp '26
        </span>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          BUILDING BRIGHTER MINDS <br />
          <span className="bg-gradient-to-r from-[#60a6dc] via-[#d4c1b6] to-[#60a6dc] bg-clip-text text-transparent text-glow-primary">
            TOGETHER
          </span>
        </h1>

        <p className="mt-6 text-gray-300 text-base sm:text-lg max-w-2xl leading-relaxed font-light">
          Welcome to TDA BootCamp'26.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          {user ? (
            <div className="flex flex-col items-center gap-4">
              <span className="text-gray-400 text-sm">Welcome back, {user.name}! Access your registered domains below:</span>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {user.domains.map(d => (
                  <Link
                    key={d}
                    to={`/domains/${encodeURIComponent(d)}`}
                    className="flex items-center gap-2 bg-[#60a6dc] hover:bg-[#60a6dc]/90 text-[#02223e] font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-[#60a6dc]/15"
                  >
                    <span>{d}</span>
                    <ArrowRight size={16} />
                  </Link>
                ))}
              </div>
              <button
                onClick={logout}
                className="mt-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-6 py-3 rounded-xl transition"
              >
                Logout
              </button>
            </div>
          ) : isSignedIn ? (
            <div className="flex flex-col items-center gap-4">
              <span className="text-gray-400 text-sm">Syncing your profile with the database...</span>
              <button
                onClick={logout}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-6 py-3 rounded-xl transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/register"
                className="flex items-center gap-2 bg-[#60a6dc] hover:bg-[#60a6dc]/95 text-[#02223e] font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-[#60a6dc]/10"
              >
                <span>Register with @learner.manipal.edu</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="bg-white/5 hover:bg-white/10 text-white border border-[#d4c1b6]/15 font-semibold px-6 py-3 rounded-xl transition"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Domains Section */}
      <section id="domains" className="flex flex-col gap-8">
        <div className="text-center relative">
          <Sparkle className="absolute -top-6 right-1/4 text-xs animate-bounce" />
          <h2 className="text-3xl font-bold tracking-tight">Select & Excel in Domains</h2>
          <p className="text-gray-400 mt-2 max-w-xl mx-auto text-sm">
            Choose up to 3 tracks to access curated resources, class announcements, and check your rank.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DOMAIN_DETAILS.map((domain) => {
            const Icon = domain.icon;
            const isRegistered = user && user.domains.includes(domain.name);

            return (
              <div
                key={domain.name}
                className="relative group rounded-2xl glass p-6 border border-[#d4c1b6]/10 hover:border-[#d4c1b6]/20 hover:shadow-xl transition flex flex-col justify-between"
              >
                {/* Visual sparkles on card hover */}
                <Sparkle className="absolute top-4 right-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${domain.color} text-white mb-4 shadow-sm`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                    {domain.name}
                    {isRegistered && (
                      <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#60a6dc]/15 text-[#60a6dc] border border-[#60a6dc]/25">
                        Registered
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-400 text-xs mt-3 leading-relaxed">
                    {domain.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  {user ? (
                    isRegistered ? (
                      <Link
                        to={`/domains/${encodeURIComponent(domain.name)}`}
                        className="text-[#60a6dc] hover:text-[#60a6dc]/80 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <span>Access Resources</span>
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <span className="text-gray-500 text-xxs italic">
                        Not in your registered domains
                      </span>
                    )
                  ) : (
                    <Link
                      to={isSignedIn ? "/onboarding" : "/register"}
                      className="text-[#60a6dc] hover:text-[#60a6dc]/80 font-semibold text-xs flex items-center gap-1.5 transition"
                    >
                      <span>Join Bootcamp</span>
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Leadership & Organizers */}
      <section className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 items-center p-8 sm:p-12 rounded-3xl border border-[#d4c1b6]/10 glass overflow-hidden">
        {/* Background stars */}
        <Sparkle className="absolute top-6 left-6 text-sm" />
        <Sparkle className="absolute bottom-6 right-6 text-sm" />

        <div className="lg:col-span-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#d4c1b6]">Team</span>
          <h2 className="text-3xl font-bold tracking-tight mt-2">Organizers & Mentors</h2>
          <p className="text-gray-400 mt-4 leading-relaxed text-xs">
            Meet the faculty advisors and student domain heads coordinating the bootcamp. They upload resources, structure syllabi, and score tasks.
          </p>
          <div className="flex gap-4 mt-6">
            <div className="flex items-center gap-1 bg-[#60a6dc]/5 px-3 py-1.5 rounded-lg border border-[#60a6dc]/15 text-xxs text-gray-300">
              <Users size={12} className="text-[#60a6dc]" />
              <span>300+ Students</span>
            </div>
            <div className="flex items-center gap-1 bg-[#d4c1b6]/5 px-3 py-1.5 rounded-lg border border-[#d4c1b6]/15 text-xxs text-gray-300">
              <Award size={12} className="text-[#d4c1b6]" />
              <span>5 Domains</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TEAM_MEMBERS.map((member) => (
            <div key={member.name} className="flex flex-col items-center text-center bg-[#06385d]/30 border border-[#d4c1b6]/10 rounded-2xl p-4 hover:border-[#d4c1b6]/20 transition">
              <img
                src={member.img}
                alt={member.name}
                className="w-14 h-14 rounded-full object-cover border border-[#d4c1b6]/20 mb-3"
              />
              <h4 className="font-bold text-xs text-white leading-tight">{member.name}</h4>
              <p className="text-[10px] text-gray-400 mt-1">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-[#d4c1b6]/10 flex flex-col sm:flex-row items-center justify-between text-gray-500 text-xs">
        <p>© 2026 TDA Bootcamp. Exclusive to Students of Manipal Institute of Technology.</p>
      </footer>
    </div>
  );
}
