import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code, Brain, Globe, BarChart2, Shield, ArrowRight, ArrowUpRight } from 'lucide-react';

const DOMAIN_DETAILS = [
  {
    name: 'DSA',
    desc: 'Algorithms, data structures & problem-solving patterns for technical interviews.',
    icon: Code,
    gradient: 'from-[#0d9488] to-[#14b8a6]',
    pill: 'bg-teal-50 text-teal-700 border-teal-200',
    dot: 'bg-teal-400',
  },
  {
    name: 'Machine Learning',
    desc: 'Supervised & unsupervised learning, regression, classification & feature engineering.',
    icon: Brain,
    gradient: 'from-[#0891b2] to-[#06b6d4]',
    pill: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    dot: 'bg-cyan-400',
  },
  {
    name: 'Deep Learning',
    desc: 'Neural networks, CNNs, RNNs, Transformers and generative architectures.',
    icon: Shield,
    gradient: 'from-[#f97316] to-[#fb923c]',
    pill: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-400',
  },
  {
    name: 'WebDev',
    desc: 'Full-stack modern web apps with performance-first frameworks and tooling.',
    icon: Globe,
    gradient: 'from-[#8b5cf6] to-[#a78bfa]',
    pill: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-400',
  },
  {
    name: 'DAV',
    desc: 'Data analysis, visualization & decision-making with Pandas and Matplotlib.',
    icon: BarChart2,
    gradient: 'from-[#eab308] to-[#facc15]',
    pill: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-400',
  },
];

/* Animated counter */
function useCountUp(target, duration = 1400, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return val;
}

function StatPill({ value, label, suffix = '', duration = 1400 }) {
  const ref = useRef(null);
  const [fired, setFired] = useState(false);
  const count = useCountUp(value, duration, fired);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setFired(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="flex flex-col items-center">
      <span className="text-2xl font-black text-beach-teal-dark tabular-nums">{count}{suffix}</span>
      <span className="text-xs text-beach-teal/55 font-semibold mt-0.5 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const displayedDomains = DOMAIN_DETAILS.filter((d) =>
    !user ? true : user.domains?.includes(d.name)
  );

  return (
    <div className="flex flex-col gap-0 relative overflow-x-hidden">

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center pt-20 pb-16 px-6 min-h-[52vh]">

        {/* Subtle radial bloom */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 10%, rgba(20,184,166,0.10) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(249,115,22,0.07) 0%, transparent 70%)',
          }}
        />

        {/* Eyebrow */}
        <span
          className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase text-beach-teal border border-beach-teal/25 bg-beach-teal/5 px-4 py-1.5 rounded-full mb-6"
          style={{ animation: 'fadeUp 0.5s ease both' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-beach-coral animate-pulse" />
          TDA Bootcamp '26 · Summer Edition
        </span>

        {/* Headline — tight & impactful */}
        <h1
          className="text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[1.04] tracking-tighter text-beach-teal-dark max-w-3xl"
          style={{ animation: 'fadeUp 0.55s 0.08s ease both' }}
        >
          Build Brighter<br />
          <span className="relative inline-block">
            <span
              className="bg-gradient-to-r from-beach-coral via-beach-gold to-beach-coral bg-clip-text text-transparent"
              style={{ backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite' }}
            >
              Minds Together
            </span>
            {/* underline stroke */}
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 300 6" preserveAspectRatio="none">
              <path d="M0 4 Q75 0 150 4 Q225 8 300 4" stroke="#F4A261" strokeWidth="2.5" fill="none" strokeLinecap="round"
                style={{ strokeDasharray: 320, strokeDashoffset: 320, animation: 'drawLine 0.9s 0.5s ease forwards' }} />
            </svg>
          </span>
        </h1>

        <p
          className="mt-5 text-beach-teal/65 text-base sm:text-[17px] max-w-lg leading-relaxed font-medium"
          style={{ animation: 'fadeUp 0.6s 0.18s ease both' }}
        >
          Catch the wave of knowledge this summer — curated tracks, live rankings & a community of builders.
        </p>

        {/* CTA */}
        <div
          className="mt-8 flex flex-wrap gap-3 justify-center"
          style={{ animation: 'fadeUp 0.6s 0.28s ease both' }}
        >
          {user ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {user.domains.map((d) => (
                <Link
                  key={d}
                  to={`/domains/${encodeURIComponent(d)}`}
                  className="group flex items-center gap-2 bg-gradient-to-r from-beach-coral to-beach-gold text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-beach-coral/20 hover:shadow-beach-coral/35 hover:-translate-y-0.5 transition-all duration-200"
                >
                  {d}
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          ) : (
            <>
              <Link
                to="/register"
                className="group flex items-center gap-2 bg-gradient-to-r from-beach-coral to-beach-gold text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-beach-coral/25 hover:shadow-beach-coral/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              >
                Register with @gmail
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-beach-teal border border-beach-teal/25 bg-beach-teal/5 hover:bg-beach-teal/10 font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Stat row */}
        <div
          className="mt-12 flex items-center gap-8 sm:gap-14 justify-center"
          style={{ animation: 'fadeUp 0.6s 0.4s ease both' }}
        >
          <StatPill value={5} label="Tracks" />
          <div className="w-px h-8 bg-beach-teal/15" />
          <StatPill value={200} suffix="+" label="Students" duration={1600} />
          <div className="w-px h-8 bg-beach-teal/15" />
          <StatPill value={8} label="Weeks" />
        </div>
      </section>

      {/* ── THIN DIVIDER ─────────────────────────────────────── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-beach-teal/15 to-transparent my-2" />

      {/* ── DOMAINS ──────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-6xl mx-auto w-full">

        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-beach-coral mb-1">Learning Tracks</p>
            <h2 className="text-2xl sm:text-3xl font-black text-beach-teal-dark tracking-tight">
              {user ? 'Your Active Tracks' : 'Choose Your Path'}
            </h2>
          </div>
          <p className="text-beach-teal/55 text-sm font-medium max-w-xs text-right hidden sm:block">
            {user ? 'Access exclusive resources & track your rank.' : 'Up to 3 tracks. Curated resources + live leaderboards.'}
          </p>
        </div>

        {user ? (
          /* ── REGISTERED: single row, max 5, no wrapping ── */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(displayedDomains.length, 5)}, minmax(0, 1fr))`,
              gap: '12px',
            }}
          >
            {displayedDomains.slice(0, 5).map((domain, i) => {
              const Icon = domain.icon;
              return (
                <div
                  key={domain.name}
                  className="group relative bg-white/60 backdrop-blur-sm border border-white/80 hover:border-beach-teal/20 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-xl hover:shadow-beach-teal/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  style={{ animation: `fadeUp 0.5s ${i * 70}ms ease both` }}
                >
                  {/* Hover gradient wash */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${domain.gradient} opacity-0 group-hover:opacity-[0.05] transition-opacity duration-300 pointer-events-none`} />

                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${domain.gradient} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                    <Icon size={16} />
                  </div>

                  {/* Name — single line, no wrap */}
                  <h3 className="text-[13px] font-black text-beach-teal-dark tracking-tight truncate leading-tight">
                    {domain.name}
                  </h3>

                  {/* Description — 2 lines max */}
                  <p className="text-beach-teal/60 text-[11px] leading-relaxed font-medium line-clamp-2 flex-1">
                    {domain.desc}
                  </p>

                  {/* Footer */}
                  <div className="pt-2 border-t border-beach-teal/8 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${domain.dot}`} />
                    <Link
                      to={`/domains/${encodeURIComponent(domain.name)}`}
                      className="group/lnk flex items-center gap-0.5 text-beach-coral text-[11px] font-black hover:opacity-75 transition-opacity truncate"
                    >
                      Open
                      <ArrowUpRight size={11} className="shrink-0 group-hover/lnk:translate-x-0.5 group-hover/lnk:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── UNREGISTERED: animated slide-in list ── */
          <div className="flex flex-col gap-3 max-w-3xl">
            {DOMAIN_DETAILS.map((domain, i) => {
              const Icon = domain.icon;
              return (
                <div
                  key={domain.name}
                  className="group flex items-center justify-between gap-4 bg-white/55 backdrop-blur-sm border border-white/80 hover:border-beach-teal/20 rounded-2xl px-5 py-4 hover:shadow-lg hover:shadow-beach-teal/5 hover:translate-x-1 transition-all duration-300"
                  style={{
                    animation: 'slideInLeft 0.55s cubic-bezier(0.16,1,0.3,1) both',
                    animationDelay: `${i * 90}ms`,
                  }}
                >
                  {/* Left: icon + text */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${domain.gradient} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-[15px] font-black text-beach-teal-dark tracking-tight">{domain.name}</h3>
                        <span className={`text-[9px] font-bold tracking-wider uppercase border px-2 py-0.5 rounded-full shrink-0 ${domain.pill}`}>
                          Track
                        </span>
                      </div>
                      <p className="text-beach-teal/60 text-[12px] font-medium truncate">{domain.desc}</p>
                    </div>
                  </div>

                  {/* Right: CTA */}
                  <Link
                    to="/register"
                    className="shrink-0 flex items-center gap-1.5 bg-white/90 hover:bg-beach-coral hover:text-white text-beach-coral border border-beach-teal/15 font-bold text-[11px] px-4 py-2 rounded-xl transition-all duration-250 shadow-sm group-hover:shadow-md"
                  >
                    Join
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="mt-8 py-6 px-4 border-t border-beach-teal/10 flex flex-col sm:flex-row items-center justify-between text-beach-teal/35 text-[11px] font-semibold tracking-wide max-w-6xl mx-auto w-full">
        <p>© 2026 TDA Bootcamp — Manipal Institute of Technology</p>
        <p className="mt-1 sm:mt-0 text-beach-teal/25">Exclusive · Private · Internal</p>
      </footer>

      {/* ── GLOBAL KEYFRAMES ─────────────────────────────────── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-36px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}