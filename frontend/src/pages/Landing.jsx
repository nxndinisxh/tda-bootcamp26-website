import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code, Brain, Globe, BarChart2, Shield, ArrowRight, Moon, Sun } from 'lucide-react';

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
    name: 'ML/DL',
    desc: 'Linear & Logistic regression, loss functions, clustering, decision trees, random forests, boosting techniques, and artificial neural networks (ANNs).',
    icon: Brain,
    gradient: 'from-[#0891b2] to-[#06b6d4]',
    pill: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    dot: 'bg-cyan-400',
  },
  {
    name: 'Gen & Agentic AI',
    desc: 'Explore Large Language Models, APIs, prompt engineering, chatbot building, diffusion models, Agentic AI, RAG architectures, and vector search.',
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
  const [standings, setStandings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('tda_token');

        const headers = {
          Authorization: `Bearer ${token}`
        };

        const standingsRes = await fetch(
          '/api/dashboard/standings',
          { headers }
        );

        const announcementsRes = await fetch(
          '/api/dashboard/announcements',
          { headers }
        );

        const progressRes = await fetch(
          '/api/dashboard/progress',
          { headers }
        );

        if (standingsRes.ok) {
          const standingsData = await standingsRes.json();
          setStandings(standingsData.standings || []);
        }

        if (announcementsRes.ok) {
          const announcementsData = await announcementsRes.json();
          setAnnouncements(announcementsData || []);
        }

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setProgress(progressData.progress || []);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);
  const displayedDomains = DOMAIN_DETAILS.filter((d) =>
    !user ? true : user.domains?.includes(d.name)
  );

  return (
    <div className="flex flex-col gap-0 relative overflow-x-hidden">

      {/* ── HERO ────────────────────────────────────────────── */}
      {/* ── HERO ────────────────────────────────────────────── */}
      {!user && (
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
            TDA Bootcamp '26
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
            <Link
              to="/login"
              className="group flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-[#7c3aed]/25 hover:shadow-[#7c3aed]/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
            >
              <span>Access Portal</span>
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Stat row */}
          <div
            className="mt-12 flex items-center gap-8 sm:gap-14 justify-center"
            style={{ animation: 'fadeUp 0.6s 0.4s ease both' }}
          >
            <StatPill value={5} label="Tracks" />
            <div className="w-px h-8 bg-beach-teal/15" />
            <StatPill value={400} suffix="+" label="Students" duration={1600} />
            <div className="w-px h-8 bg-beach-teal/15" />
            <StatPill value={7} label="Weeks" />
          </div>
        </section>
      )}
      {user && (
        <section className="max-w-6xl mx-auto w-full px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* PROGRESS OVERVIEW (Left Panel) */}
            <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-3xl p-6 shadow-sm">
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-beach-coral mb-4">
                Progress Overview
              </p>
              <div className="space-y-4">
                {progress.length === 0 ? (
                  <p className="text-beach-teal/50 text-xs italic font-semibold">
                    No progress data available.
                  </p>
                ) : (
                  progress.map((item) => {
                    const details = DOMAIN_DETAILS.find(d => d.name === item.domain) || {};
                    const Icon = details.icon || Code;
                    const gradient = details.gradient || 'from-beach-teal to-beach-teal-light';
                    return (
                      <Link
                        key={item.domain}
                        to={`/domains/${encodeURIComponent(item.domain)}`}
                        className="block border border-beach-teal/10 rounded-2xl p-4 bg-white/40 hover:bg-white/60 hover:border-beach-teal/20 transition-all duration-200 shadow-xxs cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white shrink-0`}>
                              <Icon size={15} />
                            </div>
                            <span className="font-black text-beach-teal-dark text-sm">{item.domain}</span>
                          </div>
                          <span className="text-xxs font-bold text-beach-teal/70">
                            {item.completed}/{item.total} Resources
                          </span>
                        </div>
                        
                        {/* Progress Bar Container */}
                        <div className="w-full bg-beach-teal/10 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`bg-gradient-to-r ${gradient} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[9px] text-beach-teal/40 font-semibold uppercase tracking-wider">Completion</span>
                          <span className="text-xs font-extrabold text-beach-teal-dark">{item.percentage}%</span>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            {/* STANDING & RECENT UPDATES (Right Panel Stacked) */}
            <div className="space-y-6">
              
              {/* MY STANDINGS */}
              <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-3xl p-6 shadow-sm">
                <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-beach-coral mb-4">
                  My Standings
                </p>

                <div className="space-y-3">
                  {standings.length === 0 ? (
                    <p className="text-beach-teal/50 text-xs italic font-semibold">
                      No standings available.
                    </p>
                  ) : (
                    standings.map((item) => {
                      const details = DOMAIN_DETAILS.find(d => d.name === item.domain) || {};
                      const gradient = details.gradient || 'from-beach-teal to-beach-teal-light';
                      return (
                        <div
                          key={item.domain}
                          className="border border-beach-teal/10 rounded-2xl p-4 bg-white/40 shadow-xxs"
                        >
                          <h3 className="font-black text-beach-teal-dark text-sm mb-2">
                            {item.domain}
                          </h3>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-beach-teal/5 rounded-xl p-2.5 text-center border border-beach-teal/5">
                              <p className="text-[9px] text-beach-teal/50 font-bold uppercase tracking-wider">
                                Weekly Rank
                              </p>
                              <p className={`text-xl font-black bg-gradient-to-br ${gradient} bg-clip-text text-transparent mt-1`}>
                                {item.weeklyRank ? `#${item.weeklyRank}` : '-'}
                              </p>
                              {item.weeklyRank && (
                                <p className="text-[8px] text-beach-teal/45 mt-0.5 font-medium">
                                  Score: {item.weeklyScore} (W{item.latestWeek})
                                </p>
                              )}
                            </div>

                            <div className="bg-beach-teal/5 rounded-xl p-2.5 text-center border border-beach-teal/5">
                              <p className="text-[9px] text-beach-teal/50 font-bold uppercase tracking-wider">
                                Overall Rank
                              </p>
                              <p className={`text-xl font-black bg-gradient-to-br ${gradient} bg-clip-text text-transparent mt-1`}>
                                {item.overallRank ? `#${item.overallRank}` : '-'}
                              </p>
                              {item.overallRank && (
                                <p className="text-[8px] text-beach-teal/45 mt-0.5 font-medium">
                                  Score: {item.overallScore}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RECENT UPDATES (Announcements) */}
              <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-3xl p-6 shadow-sm">
                <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-beach-coral mb-4">
                  Recent Updates
                </p>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {announcements.length === 0 ? (
                    <p className="text-beach-teal/50 text-xs italic font-semibold">
                      No announcements yet.
                    </p>
                  ) : (
                    announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className="border border-beach-teal/10 rounded-2xl p-4 bg-white/40 shadow-xxs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xxs font-bold text-beach-coral">
                            {announcement.domain}
                          </span>

                          <span className="text-[10px] text-beach-teal/40 font-semibold">
                            {new Date(
                              announcement.date
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-beach-teal-dark mt-1.5">
                          {announcement.title}
                        </h4>

                        <p className="text-xs text-beach-teal/70 mt-1 leading-relaxed font-semibold">
                          {announcement.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </section>
      )}

      {/* ── THIN DIVIDER ─────────────────────────────────────── */}
      {!user && (
        <div className="w-full h-px bg-gradient-to-r from-transparent via-beach-teal/15 to-transparent my-2" />
      )}

      {/* ── DOMAINS ──────────────────────────────────────────── */}
      {!user && (
        <section className="py-16 px-4 max-w-6xl mx-auto w-full">

          <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-beach-coral mb-1">Learning Tracks</p>
              <h2 className="text-2xl sm:text-3xl font-black text-beach-teal-dark tracking-tight">
                Choose Your Path
              </h2>
            </div>
            <p className="text-beach-teal/55 text-sm font-medium max-w-xs text-right hidden sm:block">
              Curated resources + live leaderboards.
            </p>
          </div>

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
                      </div>
                      <p className="text-beach-teal/60 text-[12px] font-medium truncate">{domain.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="mt-8 py-6 px-4 border-t border-beach-teal/10 flex flex-col sm:flex-row items-center justify-between text-beach-teal/35 text-[11px] font-semibold tracking-wide max-w-6xl mx-auto w-full">
        <p>© 2026 The Data Alchemists Bootcamp — Manipal Institute of Technology</p>
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
