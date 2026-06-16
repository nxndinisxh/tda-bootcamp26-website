import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toTitleCase } from '../utils/string';
import { 
  Users, 
  Award, 
  Check, 
  UserCheck, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  Sun,
  Waves,
  Search,
  Filter,
  Plus,
  Key,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  BookOpen
} from 'lucide-react';

const VALID_DOMAINS = ['DSA', 'DAV', 'ML/DL', 'Gen & Agentic AI', 'WebDev'];

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
  
  // CSV Upload states
  const [uploadType, setUploadType] = useState('weekly');
  const [weekNumber, setWeekNumber] = useState('1');
  const [csvFile, setCsvFile] = useState(null);
  const [skippedErrors, setSkippedErrors] = useState([]);

  // Viewing states
  const [viewType, setViewType] = useState('overall'); // 'overall' or 'weekly'
  const [viewWeek, setViewWeek] = useState('');
  const [availableWeeks, setAvailableWeeks] = useState([]);

  // User promotion states (Super Admin only)
  const [editingUserId, setEditingUserId] = useState(null);
  const [promotionForm, setPromotionForm] = useState({
    role: 'user',
    adminDomains: []
  });

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Expanded user progress details
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userProgressData, setUserProgressData] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Onboard new user modal state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    id: '',
    name: '',
    email: '',
    domains: [],
    role: 'user',
    adminDomains: [],
    password: ''
  });

  // Edit user details modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    domains: []
  });

  // Reset password modal state
  const [showResetPwdModal, setShowResetPwdModal] = useState(false);
  const [resetPwdUserId, setResetPwdUserId] = useState(null);
  const [resetPwdForm, setResetPwdForm] = useState({
    password: '',
    forceFirstLogin: true
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
  }, [user, selectedDomain, activePanel, viewType, viewWeek]);

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
        // Fetch available weeks
        const resWeeks = await fetch(`/api/leaderboards/${encodeURIComponent(selectedDomain)}/weeks`, { headers });
        let weeksData = [];
        if (resWeeks.ok) {
          weeksData = await resWeeks.json();
          setAvailableWeeks(weeksData);
        }

        // Set default viewWeek if not set or not in list
        let currentWeek = viewWeek;
        if (weeksData.length > 0 && (!currentWeek || !weeksData.includes(Number(currentWeek)))) {
          currentWeek = String(weeksData[0]);
          setViewWeek(currentWeek);
        }

        // Fetch standings based on viewType
        let fetchUrl = `/api/leaderboards/${encodeURIComponent(selectedDomain)}/overall`;
        if (viewType === 'weekly' && currentWeek) {
          fetchUrl = `/api/leaderboards/${encodeURIComponent(selectedDomain)}/weekly/${currentWeek}`;
        }

        const resStandings = await fetch(fetchUrl, { headers });
        if (!resStandings.ok) throw new Error(`Failed to load standings.`);
        const standingsData = await resStandings.json();
        setLeaderboardList(standingsData);
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

  const handleToggleExpand = async (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setUserProgressData(null);
      return;
    }
    setExpandedUserId(userId);
    setLoadingProgress(true);
    setUserProgressData(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProgressData(data.progress);
      } else {
        throw new Error('Failed to load user progress.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve user progress details.');
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/users/onboard', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(onboardForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to onboard user.');
      
      setSuccess(`User "${onboardForm.name}" onboarded successfully!`);
      setShowOnboardModal(false);
      setOnboardForm({
        id: '',
        name: '',
        email: '',
        domains: [],
        role: 'user',
        adminDomains: [],
        password: ''
      });
      await fetchInitialData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user details.');
      
      setSuccess(`User details updated successfully.`);
      setShowEditModal(false);
      setEditingUser(null);
      await fetchInitialData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPwdSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/users/${resetPwdUserId}/reset-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resetPwdForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset user password.');
      
      setSuccess(`User password updated successfully.`);
      setShowResetPwdModal(false);
      setResetPwdUserId(null);
      setResetPwdForm({ password: '', forceFirstLogin: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you absolutely sure you want to delete participant "${userName}"? This will permanently remove their record.`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete user.');
      
      setSuccess(`User "${userName}" deleted successfully.`);
      await fetchInitialData();
    } catch (err) {
      setError(err.message);
    }
  };

  // CSV Upload Handlers (Admins / Super Admin)
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSkippedErrors([]);

    if (!selectedDomain) {
      setError('Please select a domain.');
      return;
    }

    if (!csvFile) {
      setError('Please select a CSV file.');
      return;
    }

    const formData = new FormData();
    formData.append('domain', selectedDomain);
    formData.append('csvFile', csvFile);
    if (uploadType === 'weekly') {
      formData.append('weekNumber', weekNumber);
    }

    try {
      const uploadUrl = uploadType === 'weekly' 
        ? '/api/admin/leaderboards/weekly' 
        : '/api/admin/leaderboards/overall';

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload leaderboard.');

      setSuccess(`Uploaded successfully: ${data.uploaded} records inserted.`);
      if (data.skipped > 0 && data.errors) {
        setSkippedErrors(data.errors);
      }

      setCsvFile(null);
      const fileInput = document.getElementById('csvFileInput');
      if (fileInput) fileInput.value = '';

      await fetchInitialData();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredUsers = allUsers.filter(usr => {
    const matchesSearch = 
      usr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usr.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usr.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = 
      roleFilter === 'all' ||
      (roleFilter === 'user' && usr.role === 'user') ||
      (roleFilter === 'admin' && usr.role === 'admin') ||
      (roleFilter === 'super_admin' && usr.role === 'super_admin');
      
    return matchesSearch && matchesRole;
  });

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
            {/* CSV Upload Widget */}
            <div className="relative glass p-6 rounded-2xl border border-white/60 space-y-6 self-start overflow-hidden shadow-sm">
              <BeachDecoration icon={Sun} className="top-3 right-3" />
              <div className="flex items-center gap-2 text-beach-coral">
                <TrendingUp size={18} />
                <h3 className="font-bold text-base text-beach-teal-dark">Leaderboard CSV Upload</h3>
              </div>

              {accessibleDomains.length === 0 ? (
                <p className="text-xs text-beach-teal/40 italic font-semibold">No assigned domains to manage.</p>
              ) : (
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  {/* Select Domain */}
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Select Domain</label>
                    <select
                      value={selectedDomain}
                      onChange={(e) => {
                        setSelectedDomain(e.target.value);
                        setSkippedErrors([]);
                      }}
                      className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark text-xs cursor-pointer font-semibold bg-white/70"
                    >
                      {accessibleDomains.map(d => (
                        <option className="bg-[#f7f5f0]" key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Upload Type Selection */}
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Leaderboard Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setUploadType('weekly')}
                        className={`py-2 text-xxs font-bold rounded-xl border transition cursor-pointer ${
                          uploadType === 'weekly'
                            ? 'bg-[#7c3aed] text-white border-transparent shadow-xs'
                            : 'bg-white/40 text-[#7c3aed] border-[#7c3aed]/15 hover:bg-[#7c3aed]/5'
                        }`}
                      >
                        Weekly
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadType('overall')}
                        className={`py-2 text-xxs font-bold rounded-xl border transition cursor-pointer ${
                          uploadType === 'overall'
                            ? 'bg-[#7c3aed] text-white border-transparent shadow-xs'
                            : 'bg-white/40 text-[#7c3aed] border-[#7c3aed]/15 hover:bg-[#7c3aed]/5'
                        }`}
                      >
                        Overall
                      </button>
                    </div>
                  </div>

                  {/* Week Selector (For Weekly Type Only) */}
                  {uploadType === 'weekly' && (
                    <div>
                      <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Week Number</label>
                      <select
                        value={weekNumber}
                        onChange={(e) => setWeekNumber(e.target.value)}
                        className="block w-full px-3 py-2.5 brand-input text-beach-teal-dark text-xs cursor-pointer font-semibold bg-white/70"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                          <option className="bg-[#f7f5f0]" key={w} value={w}>Week {w}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* File Input */}
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-2">Choose CSV File</label>
                    <input
                      id="csvFileInput"
                      type="file"
                      accept=".csv"
                      required
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      className="block w-full text-xs text-beach-teal-dark font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xxs file:font-bold file:bg-beach-teal/10 file:text-beach-teal file:cursor-pointer hover:file:bg-beach-teal/20"
                    />
                    <p className="text-[10px] text-beach-teal/60 font-semibold mt-1">
                      {uploadType === 'weekly' 
                        ? 'Expected headers: Rank, Reg no, Name, Points'
                        : 'Expected headers: Rank, Reg no, Name, Points Week 1, Points Week 2, ..., Total'
                      }
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-[#7c3aed]/20 cursor-pointer"
                  >
                    <span>Upload Standings</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
              )}

              {/* Skipped / Unregistered Student Errors Display */}
              {skippedErrors.length > 0 && (
                <div className="bg-beach-coral/10 border border-beach-coral/20 p-4 rounded-xl space-y-2 text-beach-coral text-xxs font-semibold max-h-48 overflow-y-auto">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <AlertCircle size={14} />
                    <span>Skipped Rows / Errors ({skippedErrors.length})</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    {skippedErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Current Domain Standings Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="font-bold text-base text-beach-teal-dark">
                  Standings for <span className="text-beach-coral">{selectedDomain}</span>
                </h3>

                {/* View Selection Controls */}
                <div className="flex items-center gap-2 bg-white/40 border border-white/60 p-1.5 rounded-xl text-xxs font-bold shadow-xxs">
                  <button
                    onClick={() => setViewType('overall')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      viewType === 'overall'
                        ? 'bg-[#7c3aed] text-white shadow-sm'
                        : 'text-[#7c3aed] hover:bg-[#7c3aed]/5'
                    }`}
                  >
                    Overall
                  </button>
                  <button
                    onClick={() => setViewType('weekly')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      viewType === 'weekly'
                        ? 'bg-[#7c3aed] text-white shadow-sm'
                        : 'text-[#7c3aed] hover:bg-[#7c3aed]/5'
                    }`}
                  >
                    Weekly
                  </button>
                  {viewType === 'weekly' && availableWeeks.length > 0 && (
                    <select
                      value={viewWeek}
                      onChange={(e) => setViewWeek(e.target.value)}
                      className="ml-2 px-2 py-1 bg-white/70 border border-beach-teal/15 rounded-lg text-beach-teal-dark focus:outline-none cursor-pointer text-xxs"
                    >
                      {availableWeeks.map(w => (
                        <option key={w} value={w}>Week {w}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {loading && leaderboardList.length === 0 ? (
                <div className="text-beach-teal/40 text-xs italic font-semibold">Loading standings...</div>
              ) : leaderboardList.length === 0 ? (
                <div className="glass p-8 text-center rounded-2xl border border-white/60 text-beach-teal/40 italic font-semibold shadow-sm">
                  No standings records uploaded for this view yet.
                </div>
              ) : (
                <div className="glass rounded-2xl border border-white/60 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-beach-teal-light/10 border-b border-beach-teal/10 text-xxs font-bold uppercase tracking-wider text-beach-teal-dark">
                          <th className="py-3 px-4 text-center w-12">Rank</th>
                          <th className="py-3 px-4">Name</th>
                          {viewType === 'weekly' && <th className="py-3 px-4">Info</th>}
                          <th className="py-3 px-4 text-right w-24">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-beach-teal/5 text-xs font-semibold text-beach-teal-dark bg-white/20">
                        {leaderboardList.map((entry, index) => (
                          <tr key={entry._id || index} className="hover:bg-white/40 transition">
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
                              {toTitleCase(entry.userName)}
                            </td>
                            {viewType === 'weekly' && (
                              <td className="py-3 px-4 text-beach-teal/80">
                                <span className="text-xxs text-beach-teal/50 italic">Weekly Standings (Week {entry.weekNumber})</span>
                              </td>
                            )}
                            <td className="py-3 px-4 text-right font-extrabold text-beach-coral">
                              {entry.score}
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
            {/* Header / Search bar & Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/30 p-4 rounded-2xl border border-white/40 shadow-xs">
              <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-beach-teal/40">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by Name, Email, or Reg No..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-beach-teal/15 text-xs text-beach-teal-dark font-semibold focus:outline-none focus:border-[#7c3aed] bg-white/70 shadow-xxs placeholder-beach-teal/40"
                  />
                </div>

                {/* Role Filter */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-beach-teal/40">
                    <Filter size={14} />
                  </span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="pl-8 pr-4 py-2.5 rounded-xl border border-beach-teal/15 text-xs text-beach-teal-dark font-semibold focus:outline-none focus:border-[#7c3aed] bg-white/70 shadow-xxs cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Participants</option>
                    <option value="admin">Domain Heads</option>
                    <option value="super_admin">Super Admins</option>
                  </select>
                </div>
              </div>

              {/* Onboard Button */}
              <button
                onClick={() => {
                  setOnboardForm({ id: '', name: '', email: '', domains: [], role: 'user', adminDomains: [], password: '' });
                  setShowOnboardModal(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-[#7c3aed]/10 cursor-pointer"
              >
                <Plus size={14} />
                <span>Onboard Participant</span>
              </button>
            </div>

            <div className="glass rounded-2xl border border-white/60 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-beach-teal-light/10 border-b border-beach-teal/10 text-xxs font-bold uppercase tracking-wider text-beach-teal-dark">
                      <th className="py-4 px-4 w-10"></th>
                      <th className="py-4 px-4">User</th>
                      <th className="py-4 px-4">Email</th>
                      <th className="py-4 px-4">Selected Tracks</th>
                      <th className="py-4 px-4">Access Level</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-beach-teal/5 text-xs font-semibold text-beach-teal-dark bg-white/20">
                    {filteredUsers.map((usr) => {
                      const isEditing = editingUserId === usr.id;
                      const isExpanded = expandedUserId === usr.id;
                      
                      return (
                        <React.Fragment key={usr.id}>
                          <tr className="hover:bg-white/40 transition">
                            {/* Expand arrow */}
                            <td className="py-4 px-4 text-center w-10">
                              <button
                                onClick={() => handleToggleExpand(usr.id)}
                                className="text-beach-teal/60 hover:text-[#7c3aed] transition p-1 hover:bg-white/55 rounded-lg cursor-pointer"
                                title="View Progress Details"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>

                            {/* Name */}
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-beach-teal-dark">{toTitleCase(usr.name)}</span>
                                <span className="text-[10px] text-beach-teal/55 font-mono mt-0.5">{usr.id}</span>
                              </div>
                            </td>
                            
                            {/* Email */}
                            <td className="py-4 px-4 text-beach-teal/80 font-mono">
                              {usr.email}
                            </td>
                            
                            {/* Selected Tracks */}
                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1">
                                {usr.domains && usr.domains.length > 0 ? (
                                  usr.domains.map(d => (
                                    <span key={d} className="bg-beach-teal/10 text-beach-teal border border-beach-teal/15 px-2 py-0.5 rounded-full text-xxs font-bold">
                                      {d}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xxs text-beach-teal/40 italic">None</span>
                                )}
                              </div>
                            </td>

                            {/* Access Level role badge */}
                            <td className="py-4 px-4">
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
                                            className="accent-[#7c3aed]"
                                          />
                                          <span>{d}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <span className={`self-start uppercase tracking-wider text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${
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
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveRole(usr.id)}
                                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-1.5 rounded-lg transition cursor-pointer shadow-sm shadow-emerald-600/10"
                                    >
                                      <Check size={12} />
                                      <span>Save</span>
                                    </button>
                                    <button
                                      onClick={() => setEditingUserId(null)}
                                      className="text-beach-teal hover:text-beach-coral font-bold text-[10px] uppercase tracking-wider px-2 py-1.5 rounded-lg transition cursor-pointer border border-beach-teal/10 bg-white/40"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {/* Edit Details */}
                                    <button
                                      onClick={() => {
                                        setEditingUser(usr);
                                        setEditForm({ name: usr.name, email: usr.email, domains: usr.domains || [] });
                                        setShowEditModal(true);
                                      }}
                                      className="p-1.5 text-beach-teal hover:text-beach-coral hover:bg-white/50 rounded-lg transition cursor-pointer border border-transparent"
                                      title="Edit Details"
                                    >
                                      <Edit size={14} />
                                    </button>

                                    {/* Reset Password */}
                                    <button
                                      onClick={() => {
                                        setResetPwdUserId(usr.id);
                                        setResetPwdForm({ password: '', forceFirstLogin: true });
                                        setShowResetPwdModal(true);
                                      }}
                                      className="p-1.5 text-beach-teal hover:text-[#7c3aed] hover:bg-white/50 rounded-lg transition cursor-pointer border border-transparent"
                                      title="Reset Password"
                                    >
                                      <Key size={14} />
                                    </button>

                                    {/* Adjust Access Level */}
                                    <button
                                      onClick={() => startPromotion(usr)}
                                      className="p-1.5 text-beach-teal hover:text-beach-coral hover:bg-white/50 rounded-lg transition cursor-pointer border border-transparent"
                                      title="Adjust Role & Access Level"
                                    >
                                      <UserCheck size={14} />
                                    </button>

                                    {/* Delete User */}
                                    {usr.email !== 'admin@learner.manipal.edu' && (
                                      <button
                                        onClick={() => handleDeleteUser(usr.id, usr.name)}
                                        className="p-1.5 text-beach-teal hover:text-red-500 hover:bg-white/50 rounded-lg transition cursor-pointer border border-transparent"
                                        title="Delete Participant"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Progress details sub-row */}
                          {isExpanded && (
                            <tr className="bg-beach-seafoam/5">
                              <td colSpan="6" className="py-4 px-6 border-b border-beach-teal/10">
                                {loadingProgress ? (
                                  <div className="flex items-center gap-2 text-xxs text-beach-teal/60 font-semibold italic animate-pulse">
                                    <RefreshCw size={12} className="animate-spin text-beach-coral" />
                                    <span>Fetching progress statistics...</span>
                                  </div>
                                ) : !userProgressData || userProgressData.length === 0 ? (
                                  <div className="text-xxs text-beach-teal/50 italic">
                                    No learning progress recorded for this user yet.
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <h4 className="text-xxs font-bold uppercase tracking-wider text-beach-coral flex items-center gap-1.5">
                                      <BookOpen size={12} />
                                      <span>Learning Progress Profile</span>
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {userProgressData.map((prog, pidx) => (
                                        <div key={pidx} className="bg-white/50 border border-beach-teal/10 rounded-xl p-3.5 space-y-3 shadow-xxs">
                                          {/* Track Header */}
                                          <div className="flex justify-between items-center">
                                            <span className="font-bold text-xs text-beach-teal-dark">{prog.domain}</span>
                                            <span className="text-xxs font-extrabold text-[#7c3aed] bg-[#7c3aed]/5 px-2 py-0.5 rounded-full">
                                              {prog.completed}/{prog.total} Completed ({prog.percentage}%)
                                            </span>
                                          </div>

                                          {/* Simple Progress Bar */}
                                          <div className="w-full bg-beach-teal/10 rounded-full h-1.5 overflow-hidden">
                                            <div
                                              className="bg-[#7c3aed] h-1.5 rounded-full transition-all duration-300"
                                              style={{ width: `${prog.percentage}%` }}
                                            />
                                          </div>

                                          {/* Resource completions list */}
                                          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xxs font-semibold">
                                            {prog.resources && prog.resources.length > 0 ? (
                                              prog.resources.map((resItem) => (
                                                <div key={resItem.id} className="flex justify-between items-center bg-white/40 p-1.5 rounded border border-beach-teal/5">
                                                  <span className="text-beach-teal-dark/80 line-clamp-1 flex-1 pr-2 text-left">
                                                    [{resItem.week}] {resItem.title}
                                                  </span>
                                                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${
                                                    resItem.completed 
                                                      ? 'bg-emerald-600/10 text-emerald-600'
                                                      : resItem.isLocked
                                                        ? 'bg-beach-teal/5 text-beach-teal/40 italic'
                                                        : 'bg-beach-coral/10 text-beach-coral'
                                                  }`}>
                                                    {resItem.completed ? 'Done' : resItem.isLocked ? 'Locked' : 'Pending'}
                                                  </span>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="text-[10px] text-beach-teal/40 italic">No resources added to this track yet.</p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Onboard User Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#fcfbf7] border border-white/60 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 relative">
            <button 
              onClick={() => setShowOnboardModal(false)}
              className="absolute top-4 right-4 text-beach-teal/60 hover:text-beach-coral transition p-1 hover:bg-beach-teal/10 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-extrabold text-lg text-beach-teal-dark flex items-center gap-2 border-b border-beach-teal/10 pb-2.5">
              <Plus size={18} className="text-[#7c3aed]" />
              <span>Onboard New Participant</span>
            </h3>

            <form onSubmit={handleOnboardSubmit} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-1.5">Registration Number (ID)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 240904066"
                  value={onboardForm.id}
                  onChange={(e) => setOnboardForm({ ...onboardForm, id: e.target.value })}
                  className="block w-full px-3 py-2 brand-input text-beach-teal-dark bg-white/70"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Krithic C K"
                  value={onboardForm.name}
                  onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                  className="block w-full px-3 py-2 brand-input text-beach-teal-dark bg-white/70"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. krithic.mitmpl2024@learner.manipal.edu"
                  value={onboardForm.email}
                  onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                  className="block w-full px-3 py-2 brand-input text-beach-teal-dark bg-white/70"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-1.5">Role</label>
                <select
                  value={onboardForm.role}
                  onChange={(e) => setOnboardForm({ ...onboardForm, role: e.target.value })}
                  className="block w-full px-3 py-2 brand-input text-beach-teal-dark bg-white/70 cursor-pointer"
                >
                  <option value="user">Participant</option>
                  <option value="admin">Domain Head</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {onboardForm.role === 'admin' && (
                <div className="bg-white/60 p-3 rounded-lg border border-beach-teal/10 space-y-1.5">
                  <span className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70">Assigned Admin Tracks</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {VALID_DOMAINS.map(d => (
                      <label key={d} className="flex items-center gap-1.5 text-xxs font-bold text-beach-teal-dark cursor-pointer">
                        <input
                          type="checkbox"
                          checked={onboardForm.adminDomains.includes(d)}
                          onChange={() => {
                            const isChecked = onboardForm.adminDomains.includes(d);
                            setOnboardForm({
                              ...onboardForm,
                              adminDomains: isChecked
                                ? onboardForm.adminDomains.filter(item => item !== d)
                                : [...onboardForm.adminDomains, d]
                            });
                          }}
                          className="accent-[#7c3aed]"
                        />
                        <span>{d}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-1.5">Default Password</label>
                <input
                  type="text"
                  placeholder="Defaults to manipal123"
                  value={onboardForm.password}
                  onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                  className="block w-full px-3 py-2 brand-input text-beach-teal-dark bg-white/70"
                />
              </div>

              <div className="bg-white/60 p-3 rounded-lg border border-beach-teal/10 space-y-1.5">
                <span className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70">Enrolled Tracks (Domains)</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {VALID_DOMAINS.map(d => (
                    <label key={d} className="flex items-center gap-1.5 text-xxs font-bold text-beach-teal-dark cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onboardForm.domains.includes(d)}
                        onChange={() => {
                          const isChecked = onboardForm.domains.includes(d);
                          setOnboardForm({
                            ...onboardForm,
                            domains: isChecked
                              ? onboardForm.domains.filter(item => item !== d)
                              : [...onboardForm.domains, d]
                          });
                        }}
                        className="accent-[#7c3aed]"
                      />
                      <span>{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-beach-teal/10">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 border border-beach-teal/10 text-beach-teal hover:bg-beach-teal/5 font-bold text-xs rounded-xl cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#fcfbf7] border border-white/60 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 relative">
            <button 
              onClick={() => {
                setShowEditModal(false);
                setEditingUser(null);
              }}
              className="absolute top-4 right-4 text-beach-teal/60 hover:text-beach-coral transition p-1 hover:bg-beach-teal/10 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-extrabold text-lg text-beach-teal-dark flex items-center gap-2 border-b border-beach-teal/10 pb-2.5">
              <Edit size={18} className="text-[#7c3aed]" />
              <span>Edit Participant Details</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-1.5">Registration Number (ID)</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.id}
                  className="block w-full px-3 py-2 brand-input text-beach-teal/40 bg-beach-teal/5 cursor-not-allowed border-beach-teal/10"
                />
                <span className="text-[10px] text-beach-teal/40 mt-1 block">Registration number cannot be changed once created.</span>
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="block w-full px-3 py-2 brand-input text-beach-teal-dark bg-white/70"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@learner.manipal.edu"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="block w-full px-3 py-2 brand-input text-beach-teal-dark bg-white/70"
                />
              </div>

              <div className="bg-white/60 p-3 rounded-lg border border-beach-teal/10 space-y-1.5">
                <span className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70">Enrolled Tracks (Domains)</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {VALID_DOMAINS.map(d => (
                    <label key={d} className="flex items-center gap-1.5 text-xxs font-bold text-beach-teal-dark cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.domains.includes(d)}
                        onChange={() => {
                          const isChecked = editForm.domains.includes(d);
                          setEditForm({
                            ...editForm,
                            domains: isChecked
                              ? editForm.domains.filter(item => item !== d)
                              : [...editForm.domains, d]
                          });
                        }}
                        className="accent-[#7c3aed]"
                      />
                      <span>{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-beach-teal/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 border border-beach-teal/10 text-beach-teal hover:bg-beach-teal/5 font-bold text-xs rounded-xl cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPwdModal && resetPwdUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#fcfbf7] border border-white/60 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 relative">
            <button 
              onClick={() => {
                setShowResetPwdModal(false);
                setResetPwdUserId(null);
              }}
              className="absolute top-4 right-4 text-beach-teal/60 hover:text-beach-coral transition p-1 hover:bg-beach-teal/10 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-extrabold text-lg text-beach-teal-dark flex items-center gap-2 border-b border-beach-teal/10 pb-2.5">
              <Key size={18} className="text-[#7c3aed]" />
              <span>Reset Password</span>
            </h3>

            <form onSubmit={handleResetPwdSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-beach-teal/70 mb-1.5">New Password</label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password (e.g. manipal123)"
                  value={resetPwdForm.password}
                  onChange={(e) => setResetPwdForm({ ...resetPwdForm, password: e.target.value })}
                  className="block w-full px-3 py-2 brand-input text-beach-teal-dark bg-white/70"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="forceFirstLoginCheck"
                  checked={resetPwdForm.forceFirstLogin}
                  onChange={(e) => setResetPwdForm({ ...resetPwdForm, forceFirstLogin: e.target.checked })}
                  className="accent-[#7c3aed] cursor-pointer"
                />
                <label htmlFor="forceFirstLoginCheck" className="text-xxs font-bold text-beach-teal-dark/80 cursor-pointer">
                  Require user to change password on next login
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-beach-teal/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPwdModal(false);
                    setResetPwdUserId(null);
                  }}
                  className="px-4 py-2 border border-beach-teal/10 text-beach-teal hover:bg-beach-teal/5 font-bold text-xs rounded-xl cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
