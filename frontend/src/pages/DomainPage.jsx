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
  'ML/DL': 'Explore supervised & unsupervised learning, classification, clustering, boosting, neural networks, and computer vision models.',
  'Gen & Agentic AI': 'Dive into LLMs, prompt engineering, custom chatbots, image generation, RAG databases, and agentic workflows.',
  'WebDev': 'Build fast, interactive, and beautiful frontends combined with scalable APIs, databases, and hosting pipelines.',
  'DAV': 'Gain command over data engineering, statistics, visual graphing, and Power BI dashboards.'
};

const WEEK_TITLES = {
  'DSA': {
    'Week 1': 'Introduction & Basics',
    'Week 2': 'Basic Data Structures (Maps, Sets, Stacks, Queues)',
    'Week 3': 'Recursion, Memorisation, Backtracking, Binary Search & Sorting',
    'Week 4': 'Graphs, DFS, BFS & Dijkstra\'s Algorithm',
    'Week 5': 'Trees, Traversals, Binary Search Trees & Merge Sort',
    'Week 6': 'Basic Math, Sliding Window, Prefix Sum & Disjoint Set Union (DSU)',
    'Week 7': 'Conclusion & Coding Contest'
  },
  'DAV': {
    'Week 1': 'Python Basics & DAV Revision',
    'Week 2': 'Statistics (Part 1)',
    'Week 3': 'Statistics (Part 2)',
    'Week 4': 'Usage of Graphs',
    'Week 5': 'Power BI Dashboards',
    'Week 6': 'SQL, PostgreSQL & Django Integration',
    'Week 7': 'Telemetry Presentation'
  },
  'Gen & Agentic AI': {
    'Week 1': 'LLMs and APIs',
    'Week 2': 'Fundamentals of Prompting',
    'Week 3': 'Building a Chatbot',
    'Week 4': 'Image Generation & Diffusion Models',
    'Week 5': 'Agentic AI',
    'Week 6': 'RAG (Retrieval-Augmented Generation)',
    'Week 7': 'Final Test'
  },
  'WebDev': {
    'Week 1': 'React Fundamentals (Part 1)',
    'Week 2': 'React Fundamentals (Part 2)',
    'Week 3': 'Core Logic & TypeScript',
    'Week 4': 'Databases & Canvas',
    'Week 5': 'Data Implementation',
    'Week 6': 'Advanced Version Control & DevOps',
    'Week 7': 'Deployment Strategies'
  },
  'ML/DL': {
    'Week 1': 'Linear & Logistic Regression, Loss Functions & Gradient Descent',
    'Week 2': 'K-Means Clustering, Centroid Initialization, KNN & Decision Trees',
    'Week 3': 'Random Forest, AdaBoost, XGBoost & Ensembling Techniques',
    'Week 4': 'Neurons, Activation Functions & Artificial Neural Networks (ANN)',
    'Week 5': 'TensorFlow, PyTorch & Convolutional Neural Networks (CNN) Basics',
    'Week 6': 'Advanced CNNs, Object Detection, Classification & YOLO Basics',
    'Week 7': 'Capstone Project Submission & Evaluation'
  }
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

  const [activeTab, setActiveTab] = useState('resources');
  const [expandedWeeks, setExpandedWeeks] = useState({ 'Week 1': true });

  const toggleWeek = (weekName) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekName]: !prev[weekName]
    }));
  };
  
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

  // Calculate leaderboard states for the side panel
  const top10 = leaderboard.slice(0, 10);
  const userRankIndex = leaderboard.findIndex(entry => entry.userId === user?.id);
  const isUserInTop10 = userRankIndex !== -1 && userRankIndex < 10;
  const showUserRowAtBottom = user && userRankIndex !== -1 && !isUserInTop10;
  const userLeaderboardEntry = showUserRowAtBottom ? leaderboard[userRankIndex] : null;

  return (
    <div className="space-y-6 py-4">
      {/* Clean minimal title header replacing hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-beach-teal/15 gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-beach-teal">Domain Hub</span>
          <h1 className="text-3xl font-black tracking-tight text-beach-teal-dark mt-1">{decodedDomain}</h1>
          <p className="text-beach-teal/70 text-xs mt-1 font-semibold">
            {DOMAIN_DESCRIPTIONS[decodedDomain] || 'Access domain learning paths, projects, and weekly announcements.'}
          </p>
        </div>

        {isAdmin && (
          <span className="bg-beach-coral/10 text-beach-coral border border-beach-coral/20 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider shrink-0 self-start sm:self-auto">
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

      {/* Main layout with two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Resources and Announcements tabs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tabs Menu */}
          <div className="flex border-b border-beach-teal/15 gap-8 overflow-x-auto pb-px">
            {[
              { id: 'resources', label: 'Resources', count: resources.length },
              { id: 'announcements', label: 'Announcements', count: announcements.length }
            ].map(t => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 pb-3.5 text-xs font-bold tracking-wider border-b-2 px-1 transition whitespace-nowrap cursor-pointer uppercase ${
                    isActive 
                      ? 'border-beach-coral text-beach-coral' 
                      : 'border-transparent text-beach-teal/60 hover:text-beach-teal'
                  }`}
                >
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

          <div className="min-h-[40vh] space-y-6">
            
            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="space-y-6">
                
                {/* 1. Introduction Card at the top */}
                <div className="glass p-6 rounded-2xl border border-white/60 space-y-4 relative overflow-hidden shadow-sm">
                  <BeachDecoration icon={Sun} className="top-3 right-3" />
                  <h3 className="text-base font-black text-beach-teal-dark">Welcome to the {decodedDomain} Track</h3>
                  <p className="text-beach-teal/80 text-xs leading-relaxed font-semibold">
                    This track is designed to take you from foundational logic directly to real-world applications. 
                    Make sure to check the weekly reading lists, video tutorials, and references listed under each active week.
                  </p>
                  <p className="text-beach-teal/80 text-xs leading-relaxed font-semibold">
                    Important deadlines, live sessions, and assignment releases will be posted in the <strong className="text-beach-coral font-bold">Announcements</strong> tab.
                  </p>
                </div>

                {/* 2. Collapsible Week Curriculum */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-beach-teal-dark">Curriculum Resources</h3>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setResForm({ id: null, title: '', description: '', link: '', week: 'Week 1', order: resources.length + 1 });
                        setShowResModal(true);
                      }}
                      className="flex items-center gap-1.5 bg-beach-teal hover:bg-beach-teal/90 text-white font-bold text-xs px-3 py-2 rounded-xl transition shadow-xs cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add Resource</span>
                    </button>
                  )}
                </div>

                {Object.keys(resourcesByWeek).length === 0 ? (
                  <div className="glass p-12 text-center rounded-2xl border border-white/60 text-beach-teal/40 italic font-semibold text-xs">
                    No learning resources have been added to this domain yet. Check back soon!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.keys(resourcesByWeek).sort().map(weekName => {
                      const weekLocked = isWeekLocked(weekName);
                      const weekResources = resourcesByWeek[weekName] || [];
                      const totalCount = weekResources.length;
                      const completedCount = weekResources.filter(r => r.completed).length;
                      const isExpanded = !!expandedWeeks[weekName];
                      const weekTitle = WEEK_TITLES[decodedDomain]?.[weekName] || '';

                      return (
                        <div key={weekName} className="glass rounded-2xl border border-white/60 overflow-hidden shadow-xs">
                          
                          {/* Collapsible Header */}
                          <div 
                            onClick={() => toggleWeek(weekName)}
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/40 transition select-none bg-white/20 border-b border-beach-teal/5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-beach-teal/10 flex items-center justify-center text-beach-teal shrink-0">
                                <Clock size={16} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-black text-beach-teal-dark text-sm flex flex-wrap items-center gap-x-2 leading-tight">
                                  <span>{weekName}</span>
                                  {weekTitle && <span className="text-beach-teal/50 font-medium">| {weekTitle}</span>}
                                </h4>
                                <p className="text-[10px] text-beach-teal/50 font-bold uppercase tracking-wider mt-0.5">
                                  {completedCount}/{totalCount} Completed
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
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

                              {isAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWeekLockToggle(weekName, weekLocked);
                                  }}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold transition border shadow-xs cursor-pointer ${
                                    weekLocked
                                      ? 'bg-beach-teal text-white border-beach-teal/15'
                                      : 'bg-beach-coral text-white border-beach-coral/15'
                                  }`}
                                >
                                  {weekLocked ? 'Unlock' : 'Lock'}
                                </button>
                              )}

                              <span className="text-beach-teal/40 font-bold text-xs">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                            </div>
                          </div>

                          {/* Collapsible Resources List */}
                          {isExpanded && (
                            <div className="p-4 bg-white/10">
                              {totalCount === 0 ? (
                                <p className="text-xs text-beach-teal/40 italic font-semibold py-2 pl-2">No resources added yet.</p>
                              ) : (
                                <ol className="list-decimal pl-5 space-y-3">
                                  {weekResources.map((res) => (
                                    <li key={res.id} className={`pl-2 py-2 border-b border-beach-teal/5 last:border-b-0 ${res.isLocked ? 'opacity-60' : ''}`}>
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-beach-teal-dark text-sm">
                                              {res.title}
                                            </span>
                                            {res.isLocked ? (
                                              <span className="flex items-center gap-1 bg-beach-coral/10 text-beach-coral px-1.5 py-0.5 rounded text-[9px] font-bold">
                                                <Lock size={8} />
                                                <span>Locked</span>
                                              </span>
                                            ) : (
                                              res.completed && (
                                                <span className="bg-beach-teal-light/10 text-beach-teal-light border border-beach-teal-light/20 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                                  Completed
                                                </span>
                                              )
                                            )}
                                          </div>
                                          <p className="text-xs text-beach-teal/70 mt-1 leading-relaxed">
                                            {res.description}
                                          </p>
                                          {!res.isLocked && (
                                            <a
                                              href={res.link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1.5 text-xs text-beach-coral hover:text-beach-gold font-bold mt-2 transition"
                                            >
                                              <span>Access Resource</span>
                                              <ExternalLink size={12} />
                                            </a>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          {!res.isLocked ? (
                                            <button
                                              onClick={() => handleProgressToggle(res.id, res.completed)}
                                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xxs font-bold transition border cursor-pointer ${
                                                res.completed
                                                  ? 'bg-beach-teal-light/10 text-beach-teal-light border-beach-teal-light/25 hover:bg-beach-teal-light/20'
                                                  : 'bg-white text-beach-teal border-beach-teal/15 hover:bg-beach-teal/5'
                                              }`}
                                            >
                                              <span className={`w-3 h-3 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                                res.completed
                                                  ? 'bg-beach-teal-light border-beach-teal-light text-white'
                                                  : 'border-beach-teal/20 bg-white'
                                              }`}>
                                                {res.completed && (
                                                  <svg className="w-1.5 h-1.5 fill-current" viewBox="0 0 20 20">
                                                    <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                                                  </svg>
                                                )}
                                              </span>
                                              <span>{res.completed ? 'Completed' : 'Mark Done'}</span>
                                            </button>
                                          ) : (
                                            <span className="flex items-center gap-1 text-beach-teal/40 font-bold text-[10px] bg-beach-sand-dark/10 border border-beach-sand-dark/5 px-2 py-1 rounded-xl">
                                              <Lock size={10} />
                                              <span>Locked</span>
                                            </span>
                                          )}

                                          {isAdmin && (
                                            <div className="flex items-center gap-1 border-l border-beach-teal/15 pl-2">
                                              <button
                                                onClick={() => {
                                                  setResForm(res);
                                                  setShowResModal(true);
                                                }}
                                                className="text-beach-teal hover:text-beach-teal/80 p-1 rounded transition cursor-pointer"
                                              >
                                                <Edit size={13} />
                                              </button>
                                              <button
                                                onClick={() => handleResourceDelete(res.id)}
                                                className="text-beach-coral hover:text-beach-coral/85 p-1 rounded transition cursor-pointer"
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </div>
                          )}

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
                  <div className="glass p-12 text-center rounded-2xl border border-white/60 text-beach-teal/40 italic font-semibold text-xs">
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
                              className="text-beach-coral hover:text-beach-coral/80 p-1.5 rounded-lg hover:bg-beach-coral/5 transition cursor-pointer shrink-0"
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

          </div>

        </div>

        {/* Right Column: Leaderboard Panel (Always Visible) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-beach-teal/10 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-black text-beach-teal-dark">Domain Rankings</h3>
                <p className="text-[9px] text-beach-teal/65 font-bold uppercase tracking-wider mt-0.5">Leaderboard</p>
              </div>
              
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
                className="px-2 py-1.5 bg-white/70 border border-beach-teal/15 rounded-lg text-[10px] font-bold text-beach-teal-dark focus:outline-none cursor-pointer shadow-xs"
              >
                <option value="overall">Overall</option>
                {availableWeeks.map(w => (
                  <option key={w} value={`weekly:${w}`}>Week {w}</option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <div className="grid grid-cols-2 gap-2 border-b border-beach-teal/5 pb-3">
                <button
                  onClick={() => {
                    setUploadModalType('weekly');
                    setShowUploadModal(true);
                    setUploadModalError('');
                    setUploadModalSuccess('');
                    setUploadModalSkipped([]);
                  }}
                  className="bg-beach-teal hover:bg-beach-teal/90 text-white font-bold text-[9px] py-1.5 rounded-lg transition shadow-xs cursor-pointer text-center"
                >
                  Upload Weekly
                </button>
                <button
                  onClick={() => {
                    setUploadModalType('overall');
                    setShowUploadModal(true);
                    setUploadModalError('');
                    setUploadModalSuccess('');
                    setUploadModalSkipped([]);
                  }}
                  className="bg-beach-coral hover:bg-beach-coral/90 text-white font-bold text-[9px] py-1.5 rounded-lg transition shadow-xs cursor-pointer text-center"
                >
                  Upload Overall
                </button>
              </div>
            )}

            {leaderboardLoading ? (
              <div className="text-beach-teal/40 text-[11px] italic font-semibold text-center py-8">Loading standings...</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-beach-teal/40 italic font-semibold text-xs bg-white/20 border border-beach-teal/5 rounded-xl">
                No standings posted yet.
              </div>
            ) : (
              <div className="overflow-hidden border border-beach-teal/5 rounded-xl bg-white/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-beach-teal-light/5 border-b border-beach-teal/10 text-[9px] font-bold uppercase tracking-wider text-beach-teal-dark">
                        <th className="py-2.5 px-3 text-center w-12">Rank</th>
                        <th className="py-2.5 px-3">Participant</th>
                        <th className="py-2.5 px-3 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-beach-teal/5 text-[11px] font-semibold text-beach-teal-dark bg-white/10">
                      {top10.map((entry, idx) => {
                        const isCurrentUser = entry.userId === user?.id;
                        return (
                          <tr key={entry._id || idx} className={`transition ${isCurrentUser ? 'bg-beach-teal/10 font-bold border-l-2 border-beach-teal' : 'hover:bg-white/40'}`}>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center font-bold text-[9px] ${
                                entry.rank === 1 ? 'bg-beach-gold/20 text-beach-coral border border-beach-gold/30' :
                                entry.rank === 2 ? 'bg-beach-seafoam/25 text-beach-teal border border-beach-seafoam/20' :
                                entry.rank === 3 ? 'bg-beach-sand-dark/25 text-beach-teal-dark border border-beach-sand-dark/15' :
                                isCurrentUser ? 'bg-beach-teal/20 text-beach-teal border border-beach-teal/30' :
                                'text-beach-teal/40 border border-beach-teal/5'
                              }`}>
                                {entry.rank}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold truncate max-w-[110px] flex items-center gap-1.5">
                              <User size={12} className={isCurrentUser ? 'text-beach-teal' : 'text-beach-teal/50'} />
                              <span>{entry.userName}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-beach-teal-dark">
                              <span className={entry.rank <= 3 || isCurrentUser ? 'text-beach-coral' : ''}>{entry.score}</span>
                            </td>
                          </tr>
                        );
                      })}
                      {showUserRowAtBottom && (
                        <>
                          <tr className="bg-beach-teal-light/5 border-b border-beach-teal/10">
                            <td colSpan={3} className="py-1 px-3 text-center text-beach-teal/45 font-bold italic select-none">
                              •••
                            </td>
                          </tr>
                          <tr key={userLeaderboardEntry._id || 'user-row'} className="bg-beach-teal/10 transition border-l-2 border-beach-teal font-bold text-beach-teal-dark">
                            <td className="py-2.5 px-3 text-center">
                              <span className="w-5 h-5 rounded-full inline-flex items-center justify-center font-bold text-[9px] bg-beach-teal/20 text-beach-teal border border-beach-teal/35">
                                {userLeaderboardEntry.rank}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold truncate max-w-[110px] flex items-center gap-1.5">
                              <User size={12} className="text-beach-teal" />
                              <span>{userLeaderboardEntry.userName}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-beach-coral">
                              {userLeaderboardEntry.score}
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
        </div>

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
                  <option className="bg-[#f7f5f0]" value="Week 4">Week 4</option>
                  <option className="bg-[#f7f5f0]" value="Week 5">Week 5</option>
                  <option className="bg-[#f7f5f0]" value="Week 6">Week 6</option>
                  <option className="bg-[#f7f5f0]" value="Week 7">Week 7</option>
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
