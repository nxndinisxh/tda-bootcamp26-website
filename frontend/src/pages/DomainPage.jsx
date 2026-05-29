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
  Edit,
  User,
  Sun,
  Waves,
  Lock,
  Unlock
} from 'lucide-react';

const DOMAIN_DESCRIPTIONS = {
  'DSA': 'Master advanced concepts of algorithms, data structures, complexity analysis, and competitive programming techniques.',
  'AI ML': 'Explore supervised learning, classification, clustering, regression models, and optimization strategies.',
  'Gen Ai': 'Understand artificial neural networks, convolution neural networks, sequence modeling, and deep generative architectures.',
  'WebDev': 'Build fast, interactive, and beautiful frontends combined with scalable APIs, databases, and hosting pipelines.',
  'DAV': 'Gain command over data engineering, cleaning, exploratory statistics, and visual graphing tools.'
};

const BeachDecoration = ({ icon: Icon, className }) => (
  <span className={`text-beach-coral/30 pointer-events-none select-none absolute ${className}`}>
    <Icon size={16} />
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
  const [weekLocks, setWeekLocks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Leaderboard filter states
  const [leaderboardView, setLeaderboardView] = useState('overall'); // 'overall' or 'weekly'
  const [leaderboardWeek, setLeaderboardWeek] = useState('');
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Leaderboard Upload Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalType, setUploadModalType] = useState('weekly'); // 'weekly' or 'overall'
  const [uploadModalWeek, setUploadModalWeek] = useState('1');
  const [uploadModalFile, setUploadModalFile] = useState(null);
  const [uploadModalError, setUploadModalError] = useState('');
  const [uploadModalSuccess, setUploadModalSuccess] = useState('');
  const [uploadModalSkipped, setUploadModalSkipped] = useState([]);
  const [uploadModalLoading, setUploadModalLoading] = useState(false);

  // Admin controls
  const isAdmin = user && (user.role === 'super_admin' || (user.role === 'admin' && user.adminDomains.includes(decodedDomain)));
  
  // Resource Form modal state
  const [showResModal, setShowResModal] = useState(false);
  const [resForm, setResForm] = useState({ id: null, title: '', description: '', link: '', week: 'Week 1', order: 0 });
  
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
      
      const [resResources, resAnnouncements, resWeeks] = await Promise.all([
        fetch(`/api/domains/${encodeURIComponent(decodedDomain)}/resources`, { headers }),
        fetch(`/api/domains/${encodeURIComponent(decodedDomain)}/announcements`, { headers }),
        fetch(`/api/leaderboards/${encodeURIComponent(decodedDomain)}/weeks`, { headers })
      ]);

      if (!resResources.ok || !resAnnouncements.ok || !resWeeks.ok) {
        throw new Error('Failed to load some domain data. Please refresh.');
      }

      const resourcesData = await resResources.json();
      const announcementsData = await resAnnouncements.json();
      const weeksData = await resWeeks.json();

      setResources(resourcesData.resources || []);
      setWeekLocks(resourcesData.weekLocks || []);
      setAnnouncements(announcementsData);
      setAvailableWeeks(weeksData);

      // Default week selection if available
      if (weeksData.length > 0) {
        setLeaderboardWeek(String(weeksData[0]));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaderboard standings separately
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!user) return;
      setLeaderboardLoading(true);
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        let url = `/api/leaderboards/${encodeURIComponent(decodedDomain)}/overall`;
        
        if (leaderboardView === 'weekly' && leaderboardWeek) {
          url = `/api/leaderboards/${encodeURIComponent(decodedDomain)}/weekly/${leaderboardWeek}`;
        }
        
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
        }
      } catch (err) {
        console.error('Failed to load standings:', err);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [decodedDomain, leaderboardView, leaderboardWeek, token, user]);

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
          week: resForm.week,
          order: Number(resForm.order) || 0
        })
      });

      if (!res.ok) throw new Error('Failed to save resource.');
      
      setShowResModal(false);
      setResForm({ id: null, title: '', description: '', link: '', week: 'Week 1', order: 0 });
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

  const isWeekLocked = (weekName) => {
    const lockObj = weekLocks.find(l => l.week === weekName);
    return lockObj ? lockObj.isLocked : true; // Default to locked
  };

  const handleWeekLockToggle = async (weekName, currentLockStatus) => {
    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(decodedDomain)}/weeks/${encodeURIComponent(weekName)}/lock`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isLocked: !currentLockStatus })
      });
      if (!res.ok) throw new Error('Failed to toggle week lock.');
      await fetchDomainData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProgressToggle = async (resId, currentCompleted) => {
    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(decodedDomain)}/resources/${resId}/progress`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed: !currentCompleted })
      });
      if (!res.ok) throw new Error('Failed to update progress.');
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

  const handleLeaderboardUpload = async (e) => {
    e.preventDefault();
    setUploadModalError('');
    setUploadModalSuccess('');
    setUploadModalSkipped([]);
    setUploadModalLoading(true);

    if (!uploadModalFile) {
      setUploadModalError('Please select a CSV file.');
      setUploadModalLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('domain', decodedDomain);
    formData.append('csvFile', uploadModalFile);
    if (uploadModalType === 'weekly') {
      formData.append('weekNumber', uploadModalWeek);
    }

    try {
      const url = uploadModalType === 'weekly' 
        ? '/api/admin/leaderboards/weekly' 
        : '/api/admin/leaderboards/overall';

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload leaderboard.');

      setUploadModalSuccess(`Successfully uploaded standings: ${data.uploaded} records inserted.`);
      if (data.skipped > 0 && data.errors) {
        setUploadModalSkipped(data.errors);
      }

      setUploadModalFile(null);
      
      // Refresh weeks and standings list
      const resWeeks = await fetch(`/api/leaderboards/${encodeURIComponent(decodedDomain)}/weeks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resWeeks.ok) {
        const weeksData = await resWeeks.json();
        setAvailableWeeks(weeksData);
      }

      let standingsUrl = `/api/leaderboards/${encodeURIComponent(decodedDomain)}/overall`;
      if (leaderboardView === 'weekly' && leaderboardWeek) {
        standingsUrl = `/api/leaderboards/${encodeURIComponent(decodedDomain)}/weekly/${leaderboardWeek}`;
      }
      const resStandings = await fetch(standingsUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resStandings.ok) {
        const standingsData = await resStandings.json();
        setLeaderboard(standingsData);
      }

      if (data.skipped === 0) {
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadModalSuccess('');
        }, 1500);
      }
    } catch (err) {
      setUploadModalError(err.message);
    } finally {
      setUploadModalLoading(false);
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
      <div className="min-h-[50vh] flex items-center justify-center text-beach-teal font-semibold">
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
      {/* Domain Header - Beach Cove Styling */}
      <div className="relative glass p-8 sm:p-12 rounded-3xl border border-white/60 overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-br from-beach-glass via-white/10 to-beach-seafoam/25 shadow-md">
        
        {/* Decorative elements */}
        <BeachDecoration icon={Sun} className="top-4 left-4" />
        <BeachDecoration icon={Waves} className="top-4 right-4" />
        <BeachDecoration icon={Waves} className="bottom-4 left-4" />
        <BeachDecoration icon={Sun} className="bottom-4 right-4" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(42,157,143,0.08)_0,transparent_55%)] pointer-events-none" />
        
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-beach-teal">Domain Hub</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-beach-teal-dark mt-2">{decodedDomain}</h1>
          <p className="text-beach-teal/80 text-xs sm:text-sm max-w-2xl mt-4 leading-relaxed font-semibold">
            {DOMAIN_DESCRIPTIONS[decodedDomain] || 'Access domain learning paths, projects, and weekly announcements.'}
          </p>
        </div>

        {isAdmin && (
          <span className="shrink-0 self-start sm:self-auto bg-beach-coral/10 text-beach-coral border border-beach-coral/20 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider">
            Domain Head Control Active
          </span>
        )}
      </div>

      {error && (
        <div className="bg-beach-coral/10 border border-beach-coral/20 text-beach-coral p-4 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Menu styled as beach indicators */}
      <div className="flex border-b border-beach-teal/15 gap-8 overflow-x-auto pb-px">
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
              className={`flex items-center gap-2 pb-4 text-sm font-bold tracking-wide border-b-2 px-1 transition whitespace-nowrap cursor-pointer ${
                isActive 
                  ? 'border-beach-coral text-beach-coral' 
                  : 'border-transparent text-beach-teal/60 hover:text-beach-teal'
              }`}
            >
              {Icon && <Icon size={16} />}
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-beach-coral/10 text-beach-coral' : 'bg-beach-teal/5 text-beach-teal/60'}`}>
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
              <div className="glass p-6 rounded-2xl border border-white/60 space-y-4 relative overflow-hidden shadow-sm">
                <BeachDecoration icon={Sun} className="top-3 right-3" />
                <h3 className="text-lg font-bold text-beach-teal-dark">Welcome to the {decodedDomain} Track</h3>
                <p className="text-beach-teal/80 text-xs leading-relaxed font-semibold">
                  This track is designed to take you from foundational logic directly to real-world applications. 
                  Make sure to check the <strong className="text-beach-coral font-bold">Resources</strong> tab weekly for curated documentation, video tutorials, and reference code.
                </p>
                <p className="text-beach-teal/80 text-xs leading-relaxed font-semibold">
                  Important deadlines, live sessions, and assignment releases will be posted in the <strong className="text-beach-coral font-bold">Announcements</strong> tab.
                </p>
              </div>

              {/* Timeline represented as a seaweed/pathway line */}
              <div className="glass p-6 rounded-2xl border border-white/60 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-beach-teal-dark">Curriculum Timeline</h3>
                <div className="space-y-6 timeline-path ml-2">
                  {[
                    { title: 'Week 1: Foundations & Fundamentals', desc: 'Basic terminology, structural framework, and sandbox setup.' },
                    { title: 'Week 2: Mid-level Architectures & Design', desc: 'Advanced techniques, styling schemes, and computational optimization.' },
                    { title: 'Week 3: Project Phase & Final Assessment', desc: 'Integrate your learnings into a production-grade bootcamp project.' }
                  ].map((w, index) => (
                    <div key={index} className="relative pl-7 space-y-1">
                      <div className="absolute left-0 top-1 w-[19px] h-[19px] rounded-full bg-beach-teal-light border-4 border-beach-sand flex items-center justify-center shadow-sm" />
                      <h4 className="font-bold text-xs text-beach-teal-dark">{w.title}</h4>
                      <p className="text-[11px] text-beach-teal/70 font-semibold">{w.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Domain Stats widget */}
              <div className="glass p-6 rounded-2xl border border-white/60 space-y-4 shadow-sm">
                <h4 className="font-bold text-xs text-beach-teal/70 uppercase tracking-wider">Your Progress Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-beach-teal-light/10 border border-beach-teal-light/20 p-4 rounded-xl text-center">
                    <p className="text-xl font-extrabold text-beach-teal">{resources.length}</p>
                    <p className="text-[9px] text-beach-teal/60 font-bold uppercase tracking-widest mt-1">Resources</p>
                  </div>
                  <div className="bg-beach-coral/10 border border-beach-coral/20 p-4 rounded-xl text-center">
                    <p className="text-xl font-extrabold text-beach-coral">{announcements.length}</p>
                    <p className="text-[9px] text-beach-coral/70 font-bold uppercase tracking-widest mt-1">Updates</p>
                  </div>
                </div>
              </div>

              {/* Top Leaderboard Snippet */}
              <div className="glass p-6 rounded-2xl border border-white/60 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-beach-teal/70 uppercase tracking-wider">Top Performers</h4>
                  <button onClick={() => setActiveTab('leaderboard')} className="text-xxs font-bold text-beach-coral hover:underline cursor-pointer">View All</button>
                </div>
                <div className="space-y-3">
                  {leaderboard.slice(0, 3).map((player, idx) => (
                    <div key={player.userId || idx} className="flex items-center justify-between bg-white/40 p-3 rounded-xl border border-white/60 text-xs shadow-xxs">
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          idx === 0 ? 'bg-beach-gold/20 text-beach-coral border border-beach-gold/45' :
                          idx === 1 ? 'bg-beach-seafoam/20 text-beach-teal border border-beach-seafoam/35' :
                          'bg-beach-sand-dark/25 text-beach-teal-dark border border-beach-sand-dark/20'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-bold text-beach-teal-dark">{player.userName}</span>
                      </div>
                      <span className="font-extrabold text-beach-teal">{player.score} pts</span>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="text-xs text-beach-teal/40 italic font-semibold">No scores posted yet</p>
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
                <h3 className="text-lg font-bold text-beach-teal-dark">Curated Syllabus Resources</h3>
                <p className="text-xxs text-beach-teal/70 font-semibold mt-1">Study lists recommended by mentors and domain heads</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => {
                    setResForm({ id: null, title: '', description: '', link: '', week: 'Week 1', order: resources.length + 1 });
                    setShowResModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-beach-teal hover:bg-beach-teal/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-beach-teal/15 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add Resource</span>
                </button>
              )}
            </div>

            {Object.keys(resourcesByWeek).length === 0 ? (
              <div className="glass p-12 text-center rounded-2xl border border-white/60 text-beach-teal/40 italic font-semibold">
                No learning resources have been added to this domain yet. Check back soon!
              </div>
            ) : (
              <div className="space-y-10">
                {Object.keys(resourcesByWeek).sort().map(weekName => {
                  const weekLocked = isWeekLocked(weekName);
                  const weekResources = resourcesByWeek[weekName] || [];
                  const totalCount = weekResources.length;
                  const completedCount = weekResources.filter(r => r.completed).length;
                  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                  return (
                    <div key={weekName} className="space-y-4">
                      {/* Week Header */}
                      <h4 className="text-sm font-bold text-beach-teal border-b border-beach-teal/10 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>{weekName}</span>
                          {weekLocked ? (
                            <span className="flex items-center gap-1 bg-beach-coral/10 text-beach-coral border border-beach-coral/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <Lock size={10} />
                              <span>Locked</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 bg-beach-teal-light/10 text-beach-teal-light border border-beach-teal-light/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <Unlock size={10} />
                              <span>Active</span>
                            </span>
                          )}
                        </div>

                        {isAdmin && (
                          <button
                            onClick={() => handleWeekLockToggle(weekName, weekLocked)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xxs font-bold transition border shadow-sm cursor-pointer ${
                              weekLocked
                                ? 'bg-beach-teal hover:bg-beach-teal/95 text-white border-beach-teal/15'
                                : 'bg-beach-coral hover:bg-beach-coral/95 text-white border-beach-coral/15'
                            }`}
                          >
                            {weekLocked ? <Unlock size={12} /> : <Lock size={12} />}
                            <span>{weekLocked ? 'Unlock Week' : 'Lock Week'}</span>
                          </button>
                        )}
                      </h4>

                      {/* Progress Tracker Bar */}
                      <div className="glass-teal p-4 rounded-xl border border-beach-seafoam/25 space-y-2">
                        <div className="flex items-center justify-between text-xxs font-bold">
                          <span className="text-beach-teal/70">Week Progress Tracker</span>
                          <span className={progressPercent === 100 ? 'text-beach-teal-light font-extrabold' : 'text-beach-coral'}>
                            {progressPercent}% Complete ({completedCount}/{totalCount})
                          </span>
                        </div>
                        <div className="h-3 w-full bg-white/40 rounded-full overflow-hidden border border-white/60 relative">
                          <div
                            className={`h-full bg-gradient-to-r transition-all duration-700 ease-out rounded-full ${
                              progressPercent === 100 ? 'from-beach-teal-light to-beach-seafoam' : 'from-beach-gold to-beach-coral'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                          {progressPercent === 100 && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
                          )}
                        </div>
                      </div>

                      {/* Resources Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {weekResources.map(res => (
                          <div 
                            key={res.id} 
                            className={`glass p-5 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                              res.isLocked 
                                ? 'opacity-65 border-beach-teal/5 bg-white/20 select-none' 
                                : 'border-white/60 hover:border-beach-teal-light/35 shadow-sm'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-4">
                                <h5 className="font-bold text-beach-teal-dark text-sm leading-snug">{res.title}</h5>
                                {res.isLocked && (
                                  <span className="text-beach-coral/60 self-start">
                                    <Lock size={14} />
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs mt-2 leading-relaxed font-semibold ${res.isLocked ? 'text-beach-teal/40 italic' : 'text-beach-teal/70'}`}>
                                {res.description}
                              </p>
                              {res.order > 0 && !res.isLocked && (
                                <span className="inline-block mt-2 bg-beach-teal/5 text-beach-teal border border-beach-teal/10 px-2 py-0.5 rounded text-[9px] font-bold">
                                  Step {res.order}
                                </span>
                              )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-beach-teal/10 flex items-center justify-between gap-2">
                              {!res.isLocked ? (
                                <button
                                  onClick={() => handleProgressToggle(res.id, res.completed)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xxs font-bold transition border cursor-pointer ${
                                    res.completed
                                      ? 'bg-beach-teal-light/10 text-beach-teal-light border-beach-teal-light/25 hover:bg-beach-teal-light/20'
                                      : 'bg-white/50 text-beach-teal/75 border-white/80 hover:bg-white/80 hover:text-beach-teal-dark'
                                  }`}
                                >
                                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                    res.completed
                                      ? 'bg-beach-teal-light border-beach-teal-light text-white'
                                      : 'border-beach-teal/20 bg-white/80'
                                  }`}>
                                    {res.completed && (
                                      <svg className="w-2 h-2 fill-current" viewBox="0 0 20 20">
                                        <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                                      </svg>
                                    )}
                                  </span>
                                  <span>{res.completed ? 'Completed' : 'Mark Done'}</span>
                                </button>
                              ) : (
                                <span className="flex items-center gap-1.5 text-beach-teal/40 font-bold text-xxs bg-beach-sand-dark/15 border border-beach-sand-dark/10 px-2.5 py-1 rounded-xl">
                                  <Lock size={11} />
                                  <span>Locked</span>
                                </span>
                              )}

                              <div className="flex items-center gap-3">
                                <a
                                  href={res.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-xs font-bold flex items-center gap-1 hover:underline ${
                                    res.isLocked
                                      ? 'text-beach-teal/30 pointer-events-none cursor-not-allowed'
                                      : 'text-beach-coral hover:text-beach-coral/80'
                                  }`}
                                >
                                  <span>Reference</span>
                                  <ExternalLink size={12} />
                                </a>

                                {isAdmin && (
                                  <div className="flex items-center gap-1.5 border-l border-beach-teal/15 pl-3">
                                    <button
                                      onClick={() => {
                                        setResForm(res);
                                        setShowResModal(true);
                                      }}
                                      className="text-beach-teal/60 hover:text-beach-teal-dark p-1 rounded transition cursor-pointer"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleResourceDelete(res.id)}
                                      className="text-beach-coral hover:text-beach-coral/80 p-1 rounded transition cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-beach-teal-dark">Broadcast Announcements</h3>
                <p className="text-xxs text-beach-teal/70 font-semibold mt-1">Official updates from the organizers and domain head</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAnnModal(true)}
                  className="flex items-center gap-1.5 bg-beach-teal hover:bg-beach-teal/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-beach-teal/15 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Post Announcement</span>
                </button>
              )}
            </div>

            {announcements.length === 0 ? (
              <div className="glass p-12 text-center rounded-2xl border border-white/60 text-beach-teal/40 italic font-semibold">
                No announcements posted in this domain yet.
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className="glass p-6 rounded-2xl border border-white/60 relative overflow-hidden shadow-sm text-beach-teal-dark">
                    <BeachDecoration icon={Sun} className="top-3 right-3" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-beach-coral/10 text-beach-coral">
                          <Megaphone size={16} />
                        </span>
                        <div>
                          <h4 className="font-bold text-beach-teal text-sm">{ann.title}</h4>
                          <p className="text-[10px] text-beach-teal/60 font-semibold mt-0.5">
                            By {ann.author} • {new Date(ann.date).toLocaleDateString()} at {new Date(ann.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => handleAnnouncementDelete(ann.id)}
                          className="text-beach-coral hover:text-beach-coral/80 p-1.5 rounded-lg hover:bg-beach-coral/5 transition cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-beach-teal/80 mt-4 leading-relaxed font-semibold whitespace-pre-wrap">{ann.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (() => {
          const top10 = leaderboard.slice(0, 10);
          const userRankIndex = leaderboard.findIndex(entry => entry.userId === user?.id);
          const isUserInTop10 = userRankIndex !== -1 && userRankIndex < 10;
          const showUserRowAtBottom = user && userRankIndex !== -1 && !isUserInTop10;
          const userLeaderboardEntry = showUserRowAtBottom ? leaderboard[userRankIndex] : null;

          return (
            <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-beach-teal/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-beach-teal-dark">Domain Rankings</h3>
                <p className="text-xxs text-beach-teal/70 font-semibold mt-1">Standings and performance tracking</p>
              </div>
              
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setUploadModalType('weekly');
                      setShowUploadModal(true);
                      setUploadModalError('');
                      setUploadModalSuccess('');
                      setUploadModalSkipped([]);
                    }}
                    className="bg-beach-teal hover:bg-beach-teal/90 text-white font-bold text-xxs px-3 py-2 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    Upload Weekly CSV
                  </button>
                  <button
                    onClick={() => {
                      setUploadModalType('overall');
                      setShowUploadModal(true);
                      setUploadModalError('');
                      setUploadModalSuccess('');
                      setUploadModalSkipped([]);
                    }}
                    className="bg-beach-coral hover:bg-beach-coral/90 text-white font-bold text-xxs px-3 py-2 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    Upload Overall CSV
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <label className="text-xxs font-bold text-beach-teal/70 uppercase">View:</label>
                <select
                  value={leaderboardView === 'overall' ? 'overall' : `weekly:${leaderboardWeek}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'overall') {
                      setLeaderboardView('overall');
                    } else {
                      const wk = val.split(':')[1];
                      setLeaderboardView('weekly');
                      setLeaderboardWeek(wk);
                    }
                  }}
                  className="px-3 py-2 bg-white/70 border border-beach-teal/15 rounded-xl text-xs font-bold text-beach-teal-dark focus:outline-none cursor-pointer shadow-sm"
                >
                  <option value="overall">Overall Standing</option>
                  {availableWeeks.map(w => (
                    <option key={w} value={`weekly:${w}`}>Week {w}</option>
                  ))}
                </select>
              </div>
            </div>

            {leaderboardLoading ? (
              <div className="text-beach-teal/40 text-xs italic font-semibold text-center py-12">Loading standings...</div>
            ) : leaderboard.length === 0 ? (
              <div className="glass p-12 text-center rounded-2xl border border-white/60 text-beach-teal/40 italic font-semibold">
                No standings records posted for this view yet.
              </div>
            ) : (
              <div className="glass rounded-2xl border border-white/60 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-beach-teal-light/10 border-b border-beach-teal/10 text-xxs font-bold uppercase tracking-wider text-beach-teal-dark">
                        <th className="py-4 px-6 text-center w-16">Rank</th>
                        <th className="py-4 px-6">Participant</th>
                        <th className="py-4 px-6 text-right w-32">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-beach-teal/5 text-xs font-semibold text-beach-teal-dark bg-white/20">
                      {top10.map((entry, idx) => {
                        const isCurrentUser = entry.userId === user?.id;
                        return (
                          <tr key={entry._id || idx} className={`transition ${isCurrentUser ? 'bg-beach-teal/10 hover:bg-beach-teal/15 font-bold border-l-4 border-beach-teal' : 'hover:bg-white/40'}`}>
                            <td className="py-4 px-6 text-center">
                              <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-[10px] ${
                                entry.rank === 1 ? 'bg-beach-gold/20 text-beach-coral border border-beach-gold/40' :
                                entry.rank === 2 ? 'bg-beach-seafoam/35 text-beach-teal border border-beach-seafoam/30' :
                                entry.rank === 3 ? 'bg-beach-sand-dark/35 text-beach-teal-dark border border-beach-sand-dark/20' :
                                isCurrentUser ? 'bg-beach-teal/20 text-beach-teal border border-beach-teal/40' :
                                'text-beach-teal/40 border border-beach-teal/10'
                              }`}>
                                {entry.rank}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-bold flex items-center gap-2">
                              <User size={14} className={isCurrentUser ? 'text-beach-teal' : 'text-beach-teal/50'} />
                              <span>{entry.userName} {isCurrentUser && <span className="text-[10px] text-beach-teal font-extrabold">(You)</span>}</span>
                            </td>
                            <td className="py-4 px-6 text-right font-extrabold text-beach-teal-dark">
                              <span className={entry.rank <= 3 || isCurrentUser ? 'text-beach-coral' : ''}>{entry.score} pts</span>
                            </td>
                          </tr>
                        );
                      })}
                      {showUserRowAtBottom && (
                        <>
                          <tr className="bg-beach-teal-light/5 border-b border-beach-teal/10">
                            <td colSpan={3} className="py-2 px-6 text-center text-beach-teal/45 font-bold italic select-none">
                              •••
                            </td>
                          </tr>
                          <tr key={userLeaderboardEntry._id || 'user-row'} className="bg-beach-teal/10 hover:bg-beach-teal/15 transition border-l-4 border-beach-teal font-bold text-beach-teal-dark">
                            <td className="py-4 px-6 text-center">
                              <span className="w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-[10px] bg-beach-teal/20 text-beach-teal border border-beach-teal/40">
                                {userLeaderboardEntry.rank}
                              </span>
                            </td>
                            <td className="py-4 px-6 flex items-center gap-2">
                              <User size={14} className="text-beach-teal" />
                              <span>{userLeaderboardEntry.userName} <span className="text-[10px] text-beach-teal font-extrabold">(You)</span></span>
                            </td>
                            <td className="py-4 px-6 text-right font-extrabold text-beach-coral">
                              {userLeaderboardEntry.score} pts
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </div>
          );
        })()}
      </div>

      {/* --- RESOURCE MODAL --- */}
      {showResModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-beach-teal-dark/30 backdrop-blur-sm">
          <div className="glass max-w-lg w-full p-8 rounded-3xl border border-white/70 space-y-6 relative shadow-xl text-beach-teal-dark">
            <BeachDecoration icon={Sun} className="top-4 right-4" />
            <h4 className="text-base font-bold text-beach-teal-dark">{resForm.id ? 'Edit Resource' : 'Add New Resource'}</h4>
            
            <form onSubmit={handleResourceSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Week Section</label>
                <select
                  value={resForm.week}
                  onChange={(e) => setResForm({ ...resForm, week: e.target.value })}
                  className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark focus:outline-none text-xs cursor-pointer font-semibold bg-white/70"
                >
                  <option className="bg-[#f7f5f0]" value="Week 1">Week 1</option>
                  <option className="bg-[#f7f5f0]" value="Week 2">Week 2</option>
                  <option className="bg-[#f7f5f0]" value="Week 3">Week 3</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Resource Title</label>
                <input
                  type="text"
                  required
                  value={resForm.title}
                  onChange={(e) => setResForm({ ...resForm, title: e.target.value })}
                  placeholder="e.g. Master React Hooks"
                  className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark placeholder-beach-teal/30 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Reference Link</label>
                <input
                  type="url"
                  required
                  value={resForm.link}
                  onChange={(e) => setResForm({ ...resForm, link: e.target.value })}
                  placeholder="https://..."
                  className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark placeholder-beach-teal/30 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Description</label>
                <textarea
                  value={resForm.description}
                  onChange={(e) => setResForm({ ...resForm, description: e.target.value })}
                  placeholder="Brief summary..."
                  rows={3}
                  className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark placeholder-beach-teal/30 text-xs font-semibold resize-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Resource Sequence Order (Number)</label>
                <input
                  type="number"
                  min="0"
                  value={resForm.order || 0}
                  onChange={(e) => setResForm({ ...resForm, order: Number(e.target.value) })}
                  placeholder="e.g. 1 (smaller orders appear first)"
                  className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark placeholder-beach-teal/30 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResModal(false);
                    setResForm({ id: null, title: '', description: '', link: '', week: 'Week 1', order: 0 });
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/40 hover:bg-white/60 text-beach-teal border border-beach-teal/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-beach-teal hover:bg-beach-teal/90 text-white cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-beach-teal-dark/30 backdrop-blur-sm">
          <div className="glass max-w-lg w-full p-8 rounded-3xl border border-white/70 space-y-6 relative shadow-xl text-beach-teal-dark">
            <BeachDecoration icon={Sun} className="top-4 right-4" />
            <h4 className="text-base font-bold text-beach-teal-dark">Broadcast New Announcement</h4>
            
            <form onSubmit={handleAnnouncementSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  placeholder="e.g. Workshop Session Postponed"
                  className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark placeholder-beach-teal/30 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Announcement Content</label>
                <textarea
                  required
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  placeholder="Write the announcement details here..."
                  rows={5}
                  className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark placeholder-beach-teal/30 text-xs font-semibold resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/40 hover:bg-white/60 text-beach-teal border border-beach-teal/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-beach-teal hover:bg-beach-teal/90 text-white cursor-pointer"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- LEADERBOARD UPLOAD MODAL --- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-beach-teal-dark/30 backdrop-blur-sm">
          <div className="glass max-w-lg w-full p-8 rounded-3xl border border-white/70 space-y-6 relative shadow-xl text-beach-teal-dark">
            <BeachDecoration icon={Sun} className="top-4 right-4" />
            <h4 className="text-base font-bold text-beach-teal-dark">
              Upload {uploadModalType === 'weekly' ? 'Weekly' : 'Overall'} Standings CSV
            </h4>
            
            <form onSubmit={handleLeaderboardUpload} className="space-y-4 text-left">
              {uploadModalType === 'weekly' && (
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Week Number</label>
                  <select
                    value={uploadModalWeek}
                    onChange={(e) => setUploadModalWeek(e.target.value)}
                    className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark text-xs cursor-pointer font-semibold bg-white/70"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                      <option className="bg-[#f7f5f0]" key={w} value={w}>Week {w}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Select CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setUploadModalFile(e.target.files[0])}
                  className="block w-full text-xs text-beach-teal-dark font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xxs file:font-bold file:bg-beach-teal/10 file:text-beach-teal file:cursor-pointer hover:file:bg-beach-teal/20"
                />
                <p className="text-[10px] text-beach-teal/60 font-semibold mt-1">
                  {uploadModalType === 'weekly' 
                    ? 'Expected headers: Rank, Reg no, Name, Points'
                    : 'Expected headers: Rank, Reg no, Name, Points Week 1, Points Week 2, ..., Total'
                  }
                </p>
              </div>

              {uploadModalError && (
                <div className="bg-beach-coral/10 border border-beach-coral/20 text-beach-coral p-3 rounded-xl text-xxs font-semibold">
                  {uploadModalError}
                </div>
              )}

              {uploadModalSuccess && (
                <div className="bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 p-3 rounded-xl text-xxs font-semibold">
                  {uploadModalSuccess}
                </div>
              )}

              {uploadModalSkipped.length > 0 && (
                <div className="bg-beach-coral/10 border border-beach-coral/20 p-4 rounded-xl space-y-2 text-beach-coral text-xxs font-semibold max-h-32 overflow-y-auto">
                  <p className="font-bold uppercase tracking-wider">Skipped Rows / Errors ({uploadModalSkipped.length}):</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {uploadModalSkipped.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadModalFile(null);
                    setUploadModalError('');
                    setUploadModalSuccess('');
                    setUploadModalSkipped([]);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/40 hover:bg-white/60 text-beach-teal border border-beach-teal/10 cursor-pointer"
                  disabled={uploadModalLoading}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-beach-teal hover:bg-beach-teal/90 text-white cursor-pointer"
                  disabled={uploadModalLoading}
                >
                  {uploadModalLoading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
