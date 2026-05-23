import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Award, 
  Shield, 
  Check, 
  UserCheck, 
  Plus, 
  AlertCircle, 
  HelpCircle,
  Database,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const VALID_DOMAINS = ['Machine Learning', 'Deep Learning', 'DAV', 'DSA', 'WebDev'];

const Sparkle = ({ className }) => (
  <span className={`text-white/30 font-bold select-none pointer-events-none sparkle-pulse ${className}`}>
    ✦
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
  }, [user, selectedDomain]);

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
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <div className="relative glass p-8 sm:p-12 rounded-3xl border border-[#d4c1b6]/10 overflow-hidden bg-hero-gradient">
        {/* Corner Sparkles */}
        <Sparkle className="absolute top-4 left-4 text-base" />
        <Sparkle className="absolute top-4 right-4 text-base" />
        <Sparkle className="absolute bottom-4 left-4 text-base" />
        <Sparkle className="absolute bottom-4 right-4 text-base" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(96,166,220,0.06)_0,transparent_55%)] pointer-events-none" />
        
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#60a6dc]">Admin Operations</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mt-2">Management Console</h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mt-4 leading-relaxed">
            {isSuperAdmin 
              ? 'Super Admin level access: Assign admin domains, manage roles, and review leaderboards.' 
              : 'Domain Head level access: Update participant grades and manage leaderboards for your assigned domains.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-2 text-sm">
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Tab Menu for Super Admin */}
      {isSuperAdmin && (
        <div className="flex border-b border-white/10 gap-8">
          <button
            onClick={() => handlePanelChange('scores')}
            className={`flex items-center gap-2 pb-4 text-sm font-semibold tracking-wide border-b-2 px-1 transition cursor-pointer ${
              activePanel === 'scores' 
                ? 'border-[#60a6dc] text-[#60a6dc]' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Award size={16} />
            <span>Score Board Grading</span>
          </button>
          
          <button
            onClick={() => handlePanelChange('users')}
            className={`flex items-center gap-2 pb-4 text-sm font-semibold tracking-wide border-b-2 px-1 transition cursor-pointer ${
              activePanel === 'users' 
                ? 'border-[#60a6dc] text-[#60a6dc]' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
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
            <div className="relative glass p-6 rounded-2xl border border-[#d4c1b6]/10 space-y-6 self-start overflow-hidden">
              <Sparkle className="absolute top-3 right-3 text-xs" />
              <div className="flex items-center gap-2 text-[#60a6dc]">
                <TrendingUp size={18} />
                <h3 className="font-bold text-base text-white">Enter Score Details</h3>
              </div>

              {accessibleDomains.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No assigned domains to manage.</p>
              ) : (
                <form onSubmit={handleScoreSubmit} className="space-y-4">
                  {/* Select Domain */}
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-gray-400 mb-2">Select Domain</label>
                    <select
                      value={selectedDomain}
                      onChange={(e) => {
                        setSelectedDomain(e.target.value);
                        setScoreForm({ ...scoreForm, userId: '' });
                      }}
                      className="block w-full px-3 py-2.5 brand-input text-white text-xs cursor-pointer"
                    >
                      {accessibleDomains.map(d => (
                        <option className="bg-[#02223e]" key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Participant */}
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-gray-400 mb-2">Select Participant</label>
                    <select
                      required
                      value={scoreForm.userId}
                      onChange={(e) => setScoreForm({ ...scoreForm, userId: e.target.value })}
                      className="block w-full px-3 py-2.5 brand-input text-white text-xs cursor-pointer"
                    >
                      <option className="bg-[#02223e]" value="">-- Choose Participant --</option>
                      {leaderboardList.map(item => (
                        <option className="bg-[#02223e]" key={item.userId} value={item.userId}>
                          {item.userName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Task Name */}
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-gray-400 mb-2">Task Title</label>
                    <input
                      type="text"
                      required
                      value={scoreForm.taskName}
                      onChange={(e) => setScoreForm({ ...scoreForm, taskName: e.target.value })}
                      placeholder="e.g. Week 1 Task, Quiz 2"
                      className="block w-full px-3 py-2.5 brand-input text-white placeholder-gray-500 text-xs"
                    />
                  </div>

                  {/* Score */}
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-gray-400 mb-2">Score</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="150"
                      value={scoreForm.score}
                      onChange={(e) => setScoreForm({ ...scoreForm, score: e.target.value })}
                      placeholder="e.g. 95"
                      className="block w-full px-3 py-2.5 brand-input text-white placeholder-gray-500 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 bg-[#60a6dc] hover:bg-[#60a6dc]/90 text-[#02223e] font-bold text-xs py-3 rounded-xl transition cursor-pointer"
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
                <h3 className="font-bold text-base text-gray-200">
                  Registered Participants on <span className="text-[#60a6dc]">{selectedDomain}</span>
                </h3>
              </div>

              {loading && leaderboardList.length === 0 ? (
                <div className="text-gray-500 text-xs italic">Loading participant list...</div>
              ) : leaderboardList.length === 0 ? (
                <div className="glass p-8 text-center rounded-2xl border border-white/5 text-gray-500 italic">
                  No participants registered for this domain yet.
                </div>
              ) : (
                <div className="glass rounded-2xl border border-[#d4c1b6]/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#06385d]/35 border-b border-[#d4c1b6]/10 text-xxs font-bold uppercase tracking-wider text-gray-300">
                          <th className="py-3 px-4 text-center w-12">Rank</th>
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Scores</th>
                          <th className="py-3 px-4 text-right w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs">
                        {leaderboardList.map((entry) => (
                          <tr key={entry.id} className="hover:bg-white/2 transition">
                            <td className="py-3 px-4 text-center">
                              <span className={`w-5.5 h-5.5 rounded-full inline-flex items-center justify-center font-bold text-[10px] ${
                                entry.rank === 1 ? 'bg-[#d4c1b6]/25 text-[#d4c1b6] border border-[#d4c1b6]/40' :
                                entry.rank === 2 ? 'bg-[#60a6dc]/25 text-[#60a6dc] border border-[#60a6dc]/30' :
                                entry.rank === 3 ? 'bg-[#06385d]/50 text-gray-400 border border-white/10' :
                                'text-gray-500'
                              }`}>
                                {entry.rank}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-white">
                              {entry.userName}
                            </td>
                            <td className="py-3 px-4 text-gray-400">
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(entry.scores).map(([task, score]) => (
                                  <span key={task} className="bg-white/3 text-[9px] px-2 py-0.5 rounded border border-white/5">
                                    {task}: <strong className="text-gray-300">{score}</strong>
                                  </span>
                                ))}
                                {Object.keys(entry.scores).length === 0 && (
                                  <span className="text-xxs text-gray-500 italic">No task grades</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-extrabold text-[#60a6dc]">
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
            <h3 className="font-bold text-base text-gray-200">Registered Student Directory</h3>
            
            <div className="glass rounded-2xl border border-[#d4c1b6]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#06385d]/35 border-b border-[#d4c1b6]/10 text-xxs font-bold uppercase tracking-wider text-gray-300">
                      <th className="py-4 px-6">User</th>
                      <th className="py-4 px-6">Email</th>
                      <th className="py-4 px-6">Selected Tracks</th>
                      <th className="py-4 px-6">Access Level</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {allUsers.map((usr) => {
                      const isEditing = editingUserId === usr.id;
                      
                      return (
                        <tr key={usr.id} className="hover:bg-white/2 transition">
                          {/* Name */}
                          <td className="py-4 px-6 font-semibold text-white">
                            {usr.name}
                          </td>
                          
                          {/* Email */}
                          <td className="py-4 px-6 text-gray-400 font-mono">
                            {usr.email}
                          </td>
                          
                          {/* Selected Domains */}
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1.5">
                              {usr.domains.map(d => (
                                <span key={d} className="bg-[#60a6dc]/10 text-[#60a6dc] border border-[#60a6dc]/20 px-2 py-0.5 rounded-full text-xxs font-semibold">
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
                                  className="px-2.5 py-1.5 brand-input text-white text-xs focus:outline-none cursor-pointer"
                                >
                                  <option className="bg-[#02223e]" value="user">Participant</option>
                                  <option className="bg-[#02223e]" value="admin">Domain Head</option>
                                  <option className="bg-[#02223e]" value="super_admin">Super Admin</option>
                                </select>
                                
                                {promotionForm.role === 'admin' && (
                                  <div className="space-y-1 bg-[#02223e]/50 p-2.5 rounded border border-[#d4c1b6]/10 mt-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Select Assigned Tracks:</p>
                                    {VALID_DOMAINS.map(d => (
                                      <label key={d} className="flex items-center gap-1.5 text-xxs font-medium text-gray-300 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={promotionForm.adminDomains.includes(d)}
                                          onChange={() => handleDomainCheckboxChange(d)}
                                          className="accent-[#60a6dc]"
                                        />
                                        <span>{d}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className={`self-start uppercase tracking-wider text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${
                                  usr.role === 'super_admin' ? 'bg-[#d4c1b6]/15 text-[#d4c1b6] border-[#d4c1b6]/25' :
                                  usr.role === 'admin' ? 'bg-[#60a6dc]/15 text-[#60a6dc] border-[#60a6dc]/25' :
                                  'bg-white/5 text-gray-400 border-white/10'
                                }`}>
                                  {usr.role.replace('_', ' ')}
                                </span>
                                {usr.role === 'admin' && usr.adminDomains && (
                                  <span className="text-[10px] text-gray-500">
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
                                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer"
                                >
                                  <Check size={12} />
                                  <span>Save</span>
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="text-gray-400 hover:text-white font-semibold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startPromotion(usr)}
                                className="flex items-center gap-1 ml-auto bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white font-semibold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                <UserCheck size={12} className="text-[#60a6dc]" />
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
