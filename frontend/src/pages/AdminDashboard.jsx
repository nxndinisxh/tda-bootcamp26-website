import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Award, 
  Check, 
  UserCheck, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Sun,
  Waves
} from 'lucide-react';

const VALID_DOMAINS = ['Machine Learning', 'Deep Learning', 'DAV', 'DSA', 'WebDev'];

const BeachDecoration = ({ icon: Icon, className }) => (
  <span className={`text-beach-coral/25 pointer-events-none select-none absolute ${className}`}>
    <Icon size={16} />
  </span>
);

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [activePanel, setActivePanel] = useState('scores'); // 'users' or 'scores'
  
  // Data states
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Score management states
  const [selectedDomain, setSelectedDomain] = useState('');
  const [leaderboardList, setLeaderboardList] = useState([]);
  const [scoreForm, setScoreForm] = useState({
    userId: '',
    taskName: '',
    score: ''
  });

  // User promotion states (Super Admin only)
  const [editingUserId, setEditingUserId] = useState(null);
  const [promotionForm, setPromotionForm] = useState({
    role: 'user',
    adminDomains: []
  });

  const isSuperAdmin = user && user.role === 'super_admin';
  const isDomainAdmin = user && user.role === 'admin';
  const accessibleDomains = isSuperAdmin ? VALID_DOMAINS : (user ? user.adminDomains : []);

  useEffect(() => {
    // Access control check
    if (user && user.role !== 'super_admin' && user.role !== 'admin') {
      navigate('/');
      return;
    }

    // Set default domain
    if (accessibleDomains.length > 0 && !selectedDomain) {
      setSelectedDomain(accessibleDomains[0]);
    }

    fetchInitialData();
  }, [user, selectedDomain, activePanel]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch users if super admin and on users panel
      if (isSuperAdmin && activePanel === 'users') {
        const res = await fetch('/api/admin/users', { headers });
        if (!res.ok) throw new Error('Failed to load user list.');
        const data = await res.json();
        setAllUsers(data);
      }

      // Fetch leaderboard for selected domain
      if (selectedDomain) {
        const res = await fetch(`/api/leaderboard/${encodeURIComponent(selectedDomain)}`, { headers });
        if (!res.ok) throw new Error(`Failed to load ${selectedDomain} leaderboard.`);
        const data = await res.json();
        setLeaderboardList(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Switch panels
  const handlePanelChange = (panel) => {
    setActivePanel(panel);
    setError('');
    setSuccess('');
  };

  // Promotion Handlers (Super Admin)
  const startPromotion = (usr) => {
    setEditingUserId(usr.id);
    setPromotionForm({
      role: usr.role,
      adminDomains: usr.adminDomains || []
    });
  };

  const handleDomainCheckboxChange = (dom) => {
    const isChecked = promotionForm.adminDomains.includes(dom);
    if (isChecked) {
      setPromotionForm({
        ...promotionForm,
        adminDomains: promotionForm.adminDomains.filter(d => d !== dom)
      });
    } else {
      setPromotionForm({
        ...promotionForm,
        adminDomains: [...promotionForm.adminDomains, dom]
      });
    }
  };

  const handleSaveRole = async (userId) => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(promotionForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user role.');

      setSuccess(`Role updated successfully for user.`);
      setEditingUserId(null);
      await fetchInitialData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Score Handlers (Admins / Super Admin)
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!scoreForm.userId || !scoreForm.taskName || scoreForm.score === '') {
      setError('Please fill in all score details.');
      return;
    }

    try {
      const res = await fetch(`/api/leaderboard/${encodeURIComponent(selectedDomain)}/scores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: scoreForm.userId,
          taskName: scoreForm.taskName,
          score: scoreForm.score
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update score.');

      setSuccess(`Updated score successfully for participant.`);
      setScoreForm({ userId: '', taskName: '', score: '' });
      await fetchInitialData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8 py-4 text-beach-teal-dark">
      {/* Page Header - Beach Cove theme */}
      <div className="relative glass p-8 sm:p-12 rounded-3xl border border-white/60 overflow-hidden bg-gradient-to-br from-beach-glass via-white/10 to-beach-seafoam/25 shadow-md">
        
        {/* Decorative elements */}
        <BeachDecoration icon={Sun} className="top-4 left-4" />
        <BeachDecoration icon={Waves} className="top-4 right-4" />
        <BeachDecoration icon={Waves} className="bottom-4 left-4" />
        <BeachDecoration icon={Sun} className="bottom-4 right-4" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(42,157,143,0.08)_0,transparent_55%)] pointer-events-none" />
        
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-beach-coral font-bold">Admin Operations</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-beach-teal-dark mt-2">Management Console</h1>
          <p className="text-beach-teal/80 text-sm sm:text-base max-w-2xl mt-4 leading-relaxed font-semibold">
            {isSuperAdmin 
              ? 'Super Admin level access: Assign admin domains, manage roles, and review leaderboards.' 
              : 'Domain Head level access: Update participant grades and manage leaderboards for your assigned domains.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-beach-coral/10 border border-beach-coral/20 text-beach-coral p-4 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 p-4 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Tab Menu for Super Admin */}
      {isSuperAdmin && (
        <div className="flex border-b border-beach-teal/15 gap-8 overflow-x-auto pb-px">
          <button
            onClick={() => handlePanelChange('scores')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold tracking-wide border-b-2 px-1 transition cursor-pointer ${
              activePanel === 'scores' 
                ? 'border-beach-coral text-beach-coral' 
                : 'border-transparent text-beach-teal/60 hover:text-beach-teal'
            }`}
          >
            <Award size={16} />
            <span>Score Board Grading</span>
          </button>
          
          <button
            onClick={() => handlePanelChange('users')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold tracking-wide border-b-2 px-1 transition cursor-pointer ${
              activePanel === 'users' 
                ? 'border-beach-coral text-beach-coral' 
                : 'border-transparent text-beach-teal/60 hover:text-beach-teal'
            }`}
          >
            <Users size={16} />
            <span>User Directory & Roles</span>
          </button>
        </div>
      )}

      {/* Panel Render */}
      <div>
        {activePanel === 'scores' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Score Form Widget */}
            <div className="relative glass p-6 rounded-2xl border border-white/60 space-y-6 self-start overflow-hidden shadow-sm">
              <BeachDecoration icon={Sun} className="top-3 right-3" />
              <div className="flex items-center gap-2 text-beach-coral">
                <TrendingUp size={18} />
                <h3 className="font-bold text-base text-beach-teal-dark">Enter Score Details</h3>
              </div>

              {accessibleDomains.length === 0 ? (
                <p className="text-xs text-beach-teal/40 italic font-semibold">No assigned domains to manage.</p>
              ) : (
                <form onSubmit={handleScoreSubmit} className="space-y-4">
                  {/* Select Domain */}
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Select Domain</label>
                    <select
                      value={selectedDomain}
                      onChange={(e) => {
                        setSelectedDomain(e.target.value);
                        setScoreForm({ ...scoreForm, userId: '' });
                      }}
                      className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark text-xs cursor-pointer font-semibold bg-white/70"
                    >
                      {accessibleDomains.map(d => (
                        <option className="bg-[#f7f5f0]" key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Participant */}
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Select Participant</label>
                    <select
                      required
                      value={scoreForm.userId}
                      onChange={(e) => setScoreForm({ ...scoreForm, userId: e.target.value })}
                      className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark text-xs cursor-pointer font-semibold bg-white/70"
                    >
                      <option className="bg-[#f7f5f0]" value="">-- Choose Participant --</option>
                      {leaderboardList.map(item => (
                        <option className="bg-[#f7f5f0]" key={item.userId} value={item.userId}>
                          {item.userName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Task Name */}
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Task Title</label>
                    <input
                      type="text"
                      required
                      value={scoreForm.taskName}
                      onChange={(e) => setScoreForm({ ...scoreForm, taskName: e.target.value })}
                      placeholder="e.g. Week 1 Task, Quiz 2"
                      className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark placeholder-beach-teal/30 text-xs font-semibold"
                    />
                  </div>

                  {/* Score */}
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Score</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="150"
                      value={scoreForm.score}
                      onChange={(e) => setScoreForm({ ...scoreForm, score: e.target.value })}
                      placeholder="e.g. 95"
                      className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark placeholder-beach-teal/30 text-xs font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 bg-beach-teal hover:bg-beach-teal/90 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-beach-teal/15 cursor-pointer"
                  >
                    <span>Update Rankings</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              )}
            </div>

            {/* Current Domain Leaderboard Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base text-beach-teal-dark">
                  Registered Participants on <span className="text-beach-coral">{selectedDomain}</span>
                </h3>
              </div>

              {loading && leaderboardList.length === 0 ? (
                <div className="text-beach-teal/40 text-xs italic font-semibold">Loading participant list...</div>
              ) : leaderboardList.length === 0 ? (
                <div className="glass p-8 text-center rounded-2xl border border-white/60 text-beach-teal/40 italic font-semibold shadow-sm">
                  No participants registered for this domain yet.
                </div>
              ) : (
                <div className="glass rounded-2xl border border-white/60 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-beach-teal-light/10 border-b border-beach-teal/10 text-xxs font-bold uppercase tracking-wider text-beach-teal-dark">
                          <th className="py-3 px-4 text-center w-12">Rank</th>
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Scores</th>
                          <th className="py-3 px-4 text-right w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-beach-teal/5 text-xs font-semibold text-beach-teal-dark bg-white/20">
                        {leaderboardList.map((entry) => (
                          <tr key={entry.id} className="hover:bg-white/40 transition">
                            <td className="py-3 px-4 text-center">
                              <span className={`w-5.5 h-5.5 rounded-full inline-flex items-center justify-center font-bold text-[10px] ${
                                entry.rank === 1 ? 'bg-beach-gold/20 text-beach-coral border border-beach-gold/40' :
                                entry.rank === 2 ? 'bg-beach-seafoam/35 text-beach-teal border border-beach-seafoam/30' :
                                entry.rank === 3 ? 'bg-beach-sand-dark/35 text-beach-teal-dark border border-beach-sand-dark/20' :
                                'text-beach-teal/40 border border-beach-teal/10'
                              }`}>
                                {entry.rank}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold">
                              {entry.userName}
                            </td>
                            <td className="py-3 px-4 text-beach-teal/80">
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(entry.scores).map(([task, score]) => (
                                  <span key={task} className="bg-white/50 text-[9px] px-2 py-0.5 rounded border border-white/80 shadow-xxs">
                                    {task}: <strong className="text-beach-teal-dark font-extrabold">{score}</strong>
                                  </span>
                                ))}
                                {Object.keys(entry.scores).length === 0 && (
                                  <span className="text-xxs text-beach-teal/40 italic">No task grades</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-extrabold text-beach-coral">
                              {entry.totalScore}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Panel (Super Admin only) */}
        {activePanel === 'users' && isSuperAdmin && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-beach-teal-dark">Registered Student Directory</h3>
            
            <div className="glass rounded-2xl border border-white/60 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-beach-teal-light/10 border-b border-beach-teal/10 text-xxs font-bold uppercase tracking-wider text-beach-teal-dark">
                      <th className="py-4 px-6">User</th>
                      <th className="py-4 px-6">Email</th>
                      <th className="py-4 px-6">Selected Tracks</th>
                      <th className="py-4 px-6">Access Level</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-beach-teal/5 text-xs font-semibold text-beach-teal-dark bg-white/20">
                    {allUsers.map((usr) => {
                      const isEditing = editingUserId === usr.id;
                      
                      return (
                        <tr key={usr.id} className="hover:bg-white/40 transition">
                          {/* Name */}
                          <td className="py-4 px-6 font-bold">
                            {usr.name}
                          </td>
                          
                          {/* Email */}
                          <td className="py-4 px-6 text-beach-teal/80 font-mono">
                            {usr.email}
                          </td>
                          
                          {/* Selected Domains */}
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1.5">
                              {usr.domains.map(d => (
                                <span key={d} className="bg-beach-teal/10 text-beach-teal border border-beach-teal/20 px-2 py-0.5 rounded-full text-xxs font-bold">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Access Level role badge */}
                          <td className="py-4 px-6">
                            {isEditing ? (
                              <div className="flex flex-col gap-2">
                                <select
                                  value={promotionForm.role}
                                  onChange={(e) => setPromotionForm({ ...promotionForm, role: e.target.value })}
                                  className="px-2.5 py-1.5 brand-input text-beach-teal-dark text-xs focus:outline-none cursor-pointer font-bold bg-white/70"
                                >
                                  <option className="bg-[#f7f5f0]" value="user">Participant</option>
                                  <option className="bg-[#f7f5f0]" value="admin">Domain Head</option>
                                  <option className="bg-[#f7f5f0]" value="super_admin">Super Admin</option>
                                </select>
                                
                                {promotionForm.role === 'admin' && (
                                  <div className="space-y-1 bg-white/60 p-2.5 rounded border border-beach-teal/15 mt-1 shadow-xxs">
                                    <p className="text-[10px] text-beach-teal/70 font-bold uppercase tracking-wider">Select Assigned Tracks:</p>
                                    {VALID_DOMAINS.map(d => (
                                      <label key={d} className="flex items-center gap-1.5 text-xxs font-bold text-beach-teal-dark cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={promotionForm.adminDomains.includes(d)}
                                          onChange={() => handleDomainCheckboxChange(d)}
                                          className="accent-beach-coral"
                                        />
                                        <span>{d}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className={`self-start uppercase tracking-wider text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                                  usr.role === 'super_admin' ? 'bg-beach-coral/15 text-beach-coral border-beach-coral/25' :
                                  usr.role === 'admin' ? 'bg-beach-teal/15 text-beach-teal border-beach-teal/25' :
                                  'bg-white/50 text-beach-teal/50 border-beach-teal/10'
                                }`}>
                                  {usr.role.replace('_', ' ')}
                                </span>
                                {usr.role === 'admin' && usr.adminDomains && (
                                  <span className="text-[10px] text-beach-teal/50 font-bold">
                                    Heads: {usr.adminDomains.join(', ')}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleSaveRole(usr.id)}
                                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm shadow-emerald-600/10"
                                >
                                  <Check size={12} />
                                  <span>Save</span>
                                </button>
                                  <button
                                  onClick={() => setEditingUserId(null)}
                                  className="text-beach-teal hover:text-beach-coral font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer border border-beach-teal/10 bg-white/40"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startPromotion(usr)}
                                className="flex items-center gap-1 ml-auto bg-white/50 hover:bg-white/80 border border-beach-teal/10 text-beach-teal hover:text-beach-coral font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer shadow-xxs"
                              >
                                <UserCheck size={12} className="text-beach-coral" />
                                <span>Adjust Access</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
