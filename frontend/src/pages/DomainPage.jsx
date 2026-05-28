import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Megaphone, 
  Award, 
  Plus, 
  Trash2, 
  ExternalLink, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  Edit,
  User
} from 'lucide-react';

const DOMAIN_DESCRIPTIONS = {
  'DSA': 'Master advanced concepts of algorithms, data structures, complexity analysis, and competitive programming techniques.',
  'AI ML': 'Explore supervised learning, classification, clustering, regression models, and optimization strategies.',
  'Gen Ai': 'Understand artificial neural networks, convolution neural networks, sequence modeling, and deep generative architectures.',
  'WebDev': 'Build fast, interactive, and beautiful frontends combined with scalable APIs, databases, and hosting pipelines.',
  'DAV': 'Gain command over data engineering, cleaning, exploratory statistics, and visual graphing tools.'
};

const Sparkle = ({ className }) => (
  <span className={`text-white/30 font-bold select-none pointer-events-none ${className}`}>
    ✦
  </span>
);

export default function DomainPage() {
  const { domain } = useParams();
  const decodedDomain = decodeURIComponent(domain);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [resources, setResources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin controls
  const isAdmin = user && (user.role === 'super_admin' || (user.role === 'admin' && user.adminDomains.includes(decodedDomain)));
  
  // Resource Form modal state
  const [showResModal, setShowResModal] = useState(false);
  const [resForm, setResForm] = useState({ id: null, title: '', description: '', link: '', week: 'Week 1' });
  
  // Announcement Form state
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', content: '' });

  useEffect(() => {
    // Validate domain access
    if (user && user.role === 'user' && !user.domains.includes(decodedDomain)) {
      navigate('/', { replace: true });
      return;
    }

    fetchDomainData();
  }, [decodedDomain, user]);

  const fetchDomainData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [resResources, resAnnouncements, resLeaderboard] = await Promise.all([
        fetch(`/api/domains/${encodeURIComponent(decodedDomain)}/resources`, { headers }),
        fetch(`/api/domains/${encodeURIComponent(decodedDomain)}/announcements`, { headers }),
        fetch(`/api/leaderboard/${encodeURIComponent(decodedDomain)}`, { headers })
      ]);

      if (!resResources.ok || !resAnnouncements.ok || !resLeaderboard.ok) {
        throw new Error('Failed to load some domain data. Please refresh.');
      }

      const resourcesData = await resResources.json();
      const announcementsData = await resAnnouncements.json();
      const leaderboardData = await resLeaderboard.json();

      setResources(resourcesData);
      setAnnouncements(announcementsData);
      setLeaderboard(leaderboardData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resources Operations
  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const url = resForm.id 
        ? `/api/domains/${encodeURIComponent(decodedDomain)}/resources/${resForm.id}`
        : `/api/domains/${encodeURIComponent(decodedDomain)}/resources`;
      
      const method = resForm.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          title: resForm.title,
          description: resForm.description,
          link: resForm.link,
          week: resForm.week
        })
      });

      if (!res.ok) throw new Error('Failed to save resource.');
      
      setShowResModal(false);
      setResForm({ id: null, title: '', description: '', link: '', week: 'Week 1' });
      await fetchDomainData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResourceDelete = async (resId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(decodedDomain)}/resources/${resId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete resource.');
      await fetchDomainData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Announcements Operations
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(decodedDomain)}/announcements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(annForm)
      });

      if (!res.ok) throw new Error('Failed to create announcement.');

      setShowAnnModal(false);
      setAnnForm({ title: '', content: '' });
      await fetchDomainData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAnnouncementDelete = async (annId) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(decodedDomain)}/announcements/${annId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete.');
      await fetchDomainData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-400">
        Loading domain workspace...
      </div>
    );
  }

  // Group resources by Week
  const resourcesByWeek = {};
  resources.forEach(r => {
    if (!resourcesByWeek[r.week]) {
      resourcesByWeek[r.week] = [];
    }
    resourcesByWeek[r.week].push(r);
  });

  return (
    <div className="space-y-8 py-4">
      {/* Domain Header */}
      <div className="relative glass p-8 sm:p-12 rounded-3xl border border-[#d4c1b6]/10 overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-hero-gradient">
        {/* Corner Sparkles */}
        <Sparkle className="absolute top-4 left-4 text-base" />
        <Sparkle className="absolute top-4 right-4 text-base" />
        <Sparkle className="absolute bottom-4 left-4 text-base" />
        <Sparkle className="absolute bottom-4 right-4 text-base" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(96,166,220,0.05)_0,transparent_55%)] pointer-events-none" />
        
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#60a6dc]">Domain Hub</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mt-2">{decodedDomain}</h1>
          <p className="text-gray-300 text-xs sm:text-sm max-w-2xl mt-4 leading-relaxed">
            {DOMAIN_DESCRIPTIONS[decodedDomain] || 'Access domain learning paths, projects, and weekly announcements.'}
          </p>
        </div>

        {isAdmin && (
          <span className="shrink-0 self-start sm:self-auto bg-[#d4c1b6]/10 text-[#d4c1b6] border border-[#d4c1b6]/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider">
            Domain Head Control Active
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-white/10 gap-8 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'resources', label: 'Resources', count: resources.length },
          { id: 'announcements', label: 'Announcements', count: announcements.length },
          { id: 'leaderboard', label: 'Leaderboard', count: leaderboard.length }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 pb-4 text-sm font-semibold tracking-wide border-b-2 px-1 transition whitespace-nowrap cursor-pointer ${
                isActive 
                  ? 'border-[#60a6dc] text-[#60a6dc]' 
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {Icon && <Icon size={16} />}
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${isActive ? 'bg-[#60a6dc]/15 text-[#60a6dc]' : 'bg-white/5 text-gray-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[40vh]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass p-6 rounded-2xl border border-[#d4c1b6]/10 space-y-4 relative overflow-hidden">
                <Sparkle className="absolute top-3 right-3 text-xs" />
                <h3 className="text-lg font-bold text-white">Welcome to the {decodedDomain} Track</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  This track is designed to take you from foundational logic directly to real-world applications. 
                  Make sure to check the <strong>Resources</strong> tab weekly for curated documentation, video tutorials, and reference code.
                </p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Important deadlines, live sessions, and assignment releases will be posted in the <strong>Announcements</strong> tab.
                </p>
              </div>

              <div className="glass p-6 rounded-2xl border border-[#d4c1b6]/10 space-y-4">
                <h3 className="text-base font-bold text-white">Curriculum Timeline</h3>
                <div className="space-y-4 relative pl-4 border-l border-[#60a6dc]/20 ml-2">
                  {[
                    { title: 'Week 1: Foundations & Fundamentals', desc: 'Basic terminology, structural framework, and sandbox setup.' },
                    { title: 'Week 2: Mid-level Architectures & Design', desc: 'Advanced techniques, styling schemes, and computational optimization.' },
                    { title: 'Week 3: Project Phase & Final Assessment', desc: 'Integrate your learnings into a production-grade bootcamp project.' }
                  ].map((w, index) => (
                    <div key={index} className="relative space-y-1">
                      <div className="absolute -left-[21px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#60a6dc] border-2 border-brand-bg" />
                      <h4 className="font-semibold text-xs text-gray-200">{w.title}</h4>
                      <p className="text-[10px] text-gray-400">{w.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Domain Stats widget */}
              <div className="glass p-6 rounded-2xl border border-[#d4c1b6]/10 space-y-4">
                <h4 className="font-bold text-xs text-gray-300 uppercase tracking-wider">Your Progress Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#06385d]/30 border border-white/5 p-4 rounded-xl text-center">
                    <p className="text-xl font-extrabold text-[#60a6dc]">{resources.length}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Resources</p>
                  </div>
                  <div className="bg-[#06385d]/30 border border-white/5 p-4 rounded-xl text-center">
                    <p className="text-xl font-extrabold text-[#d4c1b6]">{announcements.length}</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">Updates</p>
                  </div>
                </div>
              </div>

              {/* Top Leaderboard Snippet */}
              <div className="glass p-6 rounded-2xl border border-[#d4c1b6]/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-gray-300 uppercase tracking-wider">Top Performers</h4>
                  <button onClick={() => setActiveTab('leaderboard')} className="text-xxs text-[#60a6dc] hover:underline cursor-pointer">View All</button>
                </div>
                <div className="space-y-3">
                  {leaderboard.slice(0, 3).map((player, idx) => (
                    <div key={player.id} className="flex items-center justify-between bg-white/2 p-3 rounded-xl border border-white/5 text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          idx === 0 ? 'bg-[#d4c1b6]/25 text-[#d4c1b6] border border-[#d4c1b6]/40' :
                          idx === 1 ? 'bg-[#60a6dc]/25 text-[#60a6dc] border border-[#60a6dc]/30' :
                          'bg-[#06385d]/50 text-gray-400 border border-white/10'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-medium text-gray-300">{player.userName}</span>
                      </div>
                      <span className="font-bold text-gray-200">{player.totalScore} pts</span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="text-xs text-gray-500 italic">No scores posted yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Curated Syllabus Resources</h3>
                <p className="text-xxs text-gray-400 mt-1">Study lists recommended by mentors and domain heads</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => {
                    setResForm({ id: null, title: '', description: '', link: '', week: 'Week 1' });
                    setShowResModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-[#60a6dc] hover:bg-[#60a6dc]/90 text-[#02223e] font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add Resource</span>
                </button>
              )}
            </div>

            {Object.keys(resourcesByWeek).length === 0 ? (
              <div className="glass p-12 text-center rounded-2xl border border-white/5 text-gray-500 italic">
                No learning resources have been added to this domain yet. Check back soon!
              </div>
            ) : (
              <div className="space-y-10">
                {Object.keys(resourcesByWeek).sort().map(weekName => (
                  <div key={weekName} className="space-y-4">
                    <h4 className="text-sm font-bold text-[#60a6dc] border-b border-white/5 pb-2 flex items-center gap-2">
                      <Clock size={14} />
                      <span>{weekName}</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {resourcesByWeek[weekName].map(res => (
                        <div key={res.id} className="glass p-5 rounded-xl border border-white/5 hover:border-[#d4c1b6]/20 transition flex flex-col justify-between">
                          <div>
                            <h5 className="font-bold text-gray-200 text-sm leading-snug">{res.title}</h5>
                            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{res.description}</p>
                          </div>

                          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                            <a
                              href={res.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#60a6dc] hover:text-[#60a6dc]/80 font-semibold flex items-center gap-1 hover:underline"
                            >
                              <span>Open Reference</span>
                              <ExternalLink size={12} />
                            </a>

                            {isAdmin && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setResForm(res);
                                    setShowResModal(true);
                                  }}
                                  className="text-gray-400 hover:text-white p-1 rounded transition"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleResourceDelete(res.id)}
                                  className="text-red-400 hover:text-red-300 p-1 rounded transition cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Broadcast Announcements</h3>
                <p className="text-xxs text-gray-400 mt-1">Official updates from the organizers and domain head</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAnnModal(true)}
                  className="flex items-center gap-1.5 bg-[#60a6dc] hover:bg-[#60a6dc]/90 text-[#02223e] font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Post Announcement</span>
                </button>
              )}
            </div>

            {announcements.length === 0 ? (
              <div className="glass p-12 text-center rounded-2xl border border-white/5 text-gray-500 italic">
                No announcements posted in this domain yet.
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="glass p-6 rounded-2xl border border-[#d4c1b6]/10 relative overflow-hidden">
                    <Sparkle className="absolute top-3 right-3 text-xs" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-[#d4c1b6]/10 text-[#d4c1b6]">
                          <Megaphone size={16} />
                        </span>
                        <div>
                          <h4 className="font-bold text-[#60a6dc] text-sm">{ann.title}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            By {ann.author} • {new Date(ann.date).toLocaleDateString()} at {new Date(ann.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => handleAnnouncementDelete(ann.id)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/5 transition cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 mt-4 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Domain Rankings</h3>
              <p className="text-xxs text-gray-400 mt-1">Manual score listings verified by domain admins</p>
            </div>

            {leaderboard.length === 0 ? (
              <div className="glass p-12 text-center rounded-2xl border border-white/5 text-gray-500 italic">
                No participants registered or scores posted in this domain.
              </div>
            ) : (
              <div className="glass rounded-2xl border border-[#d4c1b6]/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#06385d]/35 border-b border-[#d4c1b6]/10 text-xxs font-bold uppercase tracking-wider text-gray-300">
                        <th className="py-4 px-6 text-center w-16">Rank</th>
                        <th className="py-4 px-6">Participant</th>
                        <th className="py-4 px-6">Task Breakdown</th>
                        <th className="py-4 px-6 text-right w-32">Total Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {leaderboard.map((entry, idx) => {
                        return (
                          <tr key={entry.id} className="hover:bg-white/2 transition">
                            <td className="py-4 px-6 text-center">
                              <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-[10px] ${
                                idx === 0 ? 'bg-[#d4c1b6]/25 text-[#d4c1b6] border border-[#d4c1b6]/40' :
                                idx === 1 ? 'bg-[#60a6dc]/25 text-[#60a6dc] border border-[#60a6dc]/30' :
                                idx === 2 ? 'bg-[#06385d]/50 text-gray-400 border border-white/10' :
                                'text-gray-500'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-semibold text-white flex items-center gap-2">
                              <User size={14} className="text-gray-500" />
                              <span>{entry.userName}</span>
                            </td>
                            <td className="py-4 px-6 text-gray-400">
                              <div className="flex flex-wrap gap-2">
                                {!entry.scores || Object.keys(entry.scores).length === 0 ? (
                                  <span className="text-[10px] text-gray-500 italic">No tasks completed yet</span>
                                ) : (
                                  Object.entries(entry.scores || {}).map(([task, score]) => (
                                    <span key={task} className="bg-white/5 text-xxs px-2.5 py-1 rounded-md border border-white/5 flex gap-1">
                                      <span className="text-gray-500">{task}:</span>
                                      <span className="font-semibold text-gray-300">{score}</span>
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right font-extrabold text-white">
                              <span className={idx < 3 ? 'text-[#60a6dc]' : ''}>{entry.totalScore} pts</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- RESOURCE MODAL --- */}
      {showResModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-lg w-full p-8 rounded-3xl border border-[#d4c1b6]/10 space-y-6 relative">
            <Sparkle className="absolute top-4 right-4 text-xs" />
            <h4 className="text-base font-bold text-white">{resForm.id ? 'Edit Resource' : 'Add New Resource'}</h4>
            
            <form onSubmit={handleResourceSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-gray-400 mb-2">Week Section</label>
                <select
                  value={resForm.week}
                  onChange={(e) => setResForm({ ...resForm, week: e.target.value })}
                  className="block w-full px-3 py-2.5 brand-input text-white focus:outline-none text-xs cursor-pointer"
                >
                  <option className="bg-[#02223e]" value="Week 1">Week 1</option>
                  <option className="bg-[#02223e]" value="Week 2">Week 2</option>
                  <option className="bg-[#02223e]" value="Week 3">Week 3</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-gray-400 mb-2">Resource Title</label>
                <input
                  type="text"
                  required
                  value={resForm.title}
                  onChange={(e) => setResForm({ ...resForm, title: e.target.value })}
                  placeholder="e.g. Master React Hooks"
                  className="block w-full px-3 py-2.5 brand-input text-white placeholder-gray-600 text-xs"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-gray-400 mb-2">Reference Link</label>
                <input
                  type="url"
                  required
                  value={resForm.link}
                  onChange={(e) => setResForm({ ...resForm, link: e.target.value })}
                  placeholder="https://..."
                  className="block w-full px-3 py-2.5 brand-input text-white placeholder-gray-600 text-xs"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-gray-400 mb-2">Description</label>
                <textarea
                  value={resForm.description}
                  onChange={(e) => setResForm({ ...resForm, description: e.target.value })}
                  placeholder="Brief summary..."
                  rows={3}
                  className="block w-full px-3 py-2.5 brand-input text-white placeholder-gray-600 text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#60a6dc] hover:bg-[#60a6dc]/90 text-[#02223e] cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ANNOUNCEMENT MODAL --- */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-lg w-full p-8 rounded-3xl border border-[#d4c1b6]/10 space-y-6 relative">
            <Sparkle className="absolute top-4 right-4 text-xs" />
            <h4 className="text-base font-bold text-white">Broadcast New Announcement</h4>
            
            <form onSubmit={handleAnnouncementSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-gray-400 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  placeholder="e.g. Workshop Session Postponed"
                  className="block w-full px-3 py-2.5 brand-input text-white placeholder-gray-600 text-xs"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-gray-400 mb-2">Announcement Content</label>
                <textarea
                  required
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  placeholder="Write the announcement details here..."
                  rows={5}
                  className="block w-full px-3 py-2.5 brand-input text-white placeholder-gray-600 text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#60a6dc] hover:bg-[#60a6dc]/90 text-[#02223e] cursor-pointer"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
