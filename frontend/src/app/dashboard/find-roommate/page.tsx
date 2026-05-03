'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  Users, MapPin, Filter, MessageCircle, ArrowRight,
  DollarSign, CheckCircle, AlertCircle, Crown, X,
  Flag, Shield, SlidersHorizontal, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Link from 'next/link';

const INTERESTS = ['Music', 'Sports', 'Cooking', 'Gaming', 'Reading', 'Yoga', 'Travel', 'Art', 'Movies', 'Fitness'];
const GRADE_COLOR: Record<string, string> = {
  Excellent: 'text-green-400', Good: 'text-cyan-400',
  Fair: 'text-amber-400', Low: 'text-red-400',
};

export default function FindRoommatePage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'matches' | 'create'>('matches');
  const [sending, setSending] = useState<string | null>(null);
  const [reportModal, setReportModal] = useState<{ userId: string; name: string } | null>(null);
  const [reportReason, setReportReason] = useState('harassment');
  const [reportDesc, setReportDesc] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [matchLimit, setMatchLimit] = useState(15);

  // Filters
  const [filters, setFilters] = useState({ state: '', city: '', area: '', budgetMax: '', gender: 'any' });
  const [showFilters, setShowFilters] = useState(false);
  const [budgetSlider, setBudgetSlider] = useState(50000);

  // Profile form
  const [form, setForm] = useState({
    budgetMin: 5000, budgetMax: 20000, gender: 'any',
    smokingOk: false, petsOk: false, guestsOk: true,
    sleepTime: '', noiseLevel: '', bio: '',
    interests: [] as string[],
    location: { country: '', state: '', city: '', area: '' },
  });

  useEffect(() => { fetchMyProfile(); fetchMatches(); }, []);

  const fetchMyProfile = async () => {
    const { data } = await api.get('/roommate/my-profile').catch(() => ({ data: null }));
    setMyProfile(data);
    if (data) {
      setForm((f) => ({ ...f, ...data.preferences, location: data.location || f.location }));
    }
  };

  const fetchMatches = useCallback(async (customFilters?: typeof filters, customBudget?: number) => {
    try {
      setLoading(true);
      const f = customFilters || filters;
      const params: any = {};
      if (f.state) params.state = f.state;
      if (f.city) params.city = f.city;
      if (f.area) params.area = f.area;
      if (f.gender && f.gender !== 'any') params.gender = f.gender;
      params.budgetMax = customBudget || budgetSlider;

      const { data } = await api.get('/roommate/match', { params });
      setMatches(data.matches || []);
      setIsPremium(data.isPremium || false);
      setMatchLimit(data.limit || 15);
    } catch (e: any) {
      if (e.response?.status === 404) {
        // No profile yet — fall back to users/matches
        try {
          const { data } = await api.get('/users/matches');
          setMatches((data || []).slice(0, 10));
        } catch { setMatches([]); }
      } else { setMatches([]); }
    } finally { setLoading(false); }
  }, [filters, budgetSlider]);

  const saveProfile = async () => {
    try {
      await api.post('/roommate/create', { preferences: form, location: form.location });
      toast.success('Roommate profile saved!');
      fetchMyProfile(); fetchMatches(); setView('matches');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const sendMessage = async (targetUserId: string) => {
    setSending(targetUserId);
    try {
      await api.post('/chat/direct', { targetUserId });
      toast.success('Chat opened!');
      window.location.href = '/dashboard/chat';
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not start chat');
    } finally { setSending(null); }
  };

  const submitReport = async () => {
    if (!reportModal) return;
    try {
      await api.post('/report', { reportedUserId: reportModal.userId, reason: reportReason, description: reportDesc });
      toast.success('Report submitted');
      setReportModal(null); setReportDesc('');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const blockUser = async (userId: string) => {
    try {
      await api.post(`/users/${userId}/block`);
      toast.success('User blocked');
      setMatches((m) => m.filter((x) => x.user?._id !== userId));
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const applyFilters = () => { fetchMatches(filters, budgetSlider); setShowFilters(false); };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black gradient-text flex items-center gap-2">
            <Users size={24} /> Find Roommate
          </h1>
          <p className="text-slate-400 text-sm">Find compatible roommates based on location, budget & lifestyle</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 glass px-4 py-2 rounded-xl text-sm hover:bg-white/10 transition-all">
            <SlidersHorizontal size={14} /> Filters
          </button>
          <button onClick={() => fetchMatches()} className="glass p-2 rounded-xl hover:bg-white/10 transition-all" title="Refresh">
            <RefreshCw size={16} className="text-slate-400" />
          </button>
          <div className="flex glass rounded-xl p-1">
            {(['matches', 'create'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={clsx('px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all',
                  view === v ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white')}>
                {v === 'matches' ? `Matches (${matches.length})` : 'My Preferences'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile warning */}
      {!user?.profileSetupComplete && (
        <div className="glass border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm flex-1">Complete your profile for better matches.</p>
          <Link href="/dashboard/profile?new=1" className="btn-primary text-sm py-1.5 whitespace-nowrap">
            Setup Profile <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Premium Banner */}
      {!isPremium && matches.length >= matchLimit && (
        <div className="glass border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
          <Crown size={18} className="text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-300 text-sm font-semibold">Free plan: {matchLimit} matches shown</p>
            <p className="text-slate-500 text-xs">Upgrade to Premium for unlimited matches & advanced filters</p>
          </div>
          <button className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity">
            <Crown size={14} /> Upgrade
          </button>
        </div>
      )}

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-5 overflow-hidden">
            <h3 className="font-semibold mb-4 text-sm text-slate-300 flex items-center gap-2">
              <Filter size={14} /> Filter Matches
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">State</label>
                <input type="text" value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                  placeholder="e.g. Maharashtra" className="input-field py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">City</label>
                <input type="text" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  placeholder="e.g. Mumbai" className="input-field py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Area</label>
                <input type="text" value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                  placeholder="e.g. Bandra" className="input-field py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Preferred Gender</label>
                <select value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  className="input-field py-2 text-sm">
                  <option value="any">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs text-slate-400 block mb-2">
                Max Budget: <span className="text-white font-semibold">₹{budgetSlider.toLocaleString()}</span>
              </label>
              <input type="range" min={3000} max={100000} step={1000} value={budgetSlider}
                onChange={(e) => setBudgetSlider(+e.target.value)}
                className="w-full accent-purple-500" />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>₹3,000</span><span>₹1,00,000</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={applyFilters} className="btn-primary flex-1 justify-center py-2 text-sm">Apply Filters</button>
              <button onClick={() => { setFilters({ state: '', city: '', area: '', budgetMax: '', gender: 'any' }); setBudgetSlider(50000); fetchMatches({ state: '', city: '', area: '', budgetMax: '', gender: 'any' }, 50000); setShowFilters(false); }}
                className="glass px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-all">Reset</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences Form */}
      {view === 'create' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 space-y-5">
          <h2 className="font-bold text-lg">Your Roommate Preference Profile</h2>
          <p className="text-slate-400 text-sm -mt-2">This helps us match you with compatible roommates</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Min Budget (₹/mo)</label>
              <input type="number" className="input-field" value={form.budgetMin}
                onChange={(e) => setForm({ ...form, budgetMin: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max Budget (₹/mo)</label>
              <input type="number" className="input-field" value={form.budgetMax}
                onChange={(e) => setForm({ ...form, budgetMax: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Preferred Gender</label>
              <select className="input-field" value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="any">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Sleep Schedule</label>
              <select className="input-field" value={form.sleepTime}
                onChange={(e) => setForm({ ...form, sleepTime: e.target.value })}>
                <option value="">Select</option>
                <option value="early-bird">🌅 Early Bird</option>
                <option value="night-owl">🦉 Night Owl</option>
                <option value="flexible">⚡ Flexible</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Noise Level</label>
              <select className="input-field" value={form.noiseLevel}
                onChange={(e) => setForm({ ...form, noiseLevel: e.target.value })}>
                <option value="">Select</option>
                <option value="quiet">🤫 Quiet</option>
                <option value="moderate">🔉 Moderate</option>
                <option value="lively">🎉 Lively</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Preferred Location</label>
            <div className="grid grid-cols-2 gap-3">
              {(['state', 'city', 'area', 'country'] as const).map((f) => (
                <input key={f} className="input-field text-sm" placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                  value={form.location[f]}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: { ...prev.location, [f]: e.target.value } }))} />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[{ key: 'smokingOk', label: '🚬 Smoking OK' }, { key: 'petsOk', label: '🐾 Pets OK' }, { key: 'guestsOk', label: '👥 Guests OK' }]
              .map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setForm((f) => ({ ...f, [key]: !(f as any)[key] }))}
                  className={clsx('badge px-4 py-2 text-sm font-medium border transition-all cursor-pointer',
                    (form as any)[key] ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20')}>
                  {label}
                </button>
              ))}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Interests (for better matching)</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <button key={i} type="button"
                  onClick={() => setForm((f) => ({ ...f, interests: f.interests.includes(i) ? f.interests.filter((x) => x !== i) : [...f.interests, i] }))}
                  className={clsx('badge text-xs px-3 py-1.5 cursor-pointer transition-all',
                    form.interests.includes(i) ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40' : 'bg-white/5 text-slate-400 border border-white/10')}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <button onClick={saveProfile} className="btn-primary w-full justify-center py-3">
            {myProfile ? 'Update Preferences' : 'Save & Find Matches'} <ArrowRight size={15} />
          </button>
        </motion.div>
      )}

      {/* Matches Grid */}
      {view === 'matches' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl h-64 shimmer" />)}
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-16">
              <Users size={48} className="text-purple-400 mx-auto mb-4 opacity-30" />
              <p className="text-slate-400 font-semibold text-lg">No matches found</p>
              <p className="text-slate-600 text-sm mt-2 mb-5">
                {myProfile ? 'Try adjusting your filters' : 'Set your preferences to find roommates'}
              </p>
              <button onClick={() => setView('create')} className="btn-primary justify-center">
                {myProfile ? 'Edit Preferences' : 'Set Preferences'} <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match, i) => {
                const u = match.user || match;
                const score = match.compatibilityScore || match.compatibility?.score || 0;
                const grade = match.compatibilityGrade || match.compatibility?.grade || 'Low';
                return (
                  <motion.div key={match._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-2xl overflow-hidden card-hover flex flex-col relative group">

                    {/* Card Header */}
                    <div className="p-5 flex items-start gap-4 border-b border-white/5">
                      <div className="relative flex-shrink-0">
                        <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                          alt={u.name} className="w-16 h-16 rounded-xl object-cover" />
                        {u.isOnline && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#12121e]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold truncate">{u.name}</p>
                              {u.verificationBadge && <CheckCircle size={13} className="text-purple-400 flex-shrink-0" />}
                            </div>
                            <p className="text-slate-400 text-xs mt-0.5">
                              {u.profile?.age && `${u.profile.age} yrs`}
                              {u.profile?.gender && ` · ${u.profile.gender}`}
                              {u.profile?.occupation && ` · ${u.profile.occupation}`}
                            </p>
                          </div>
                          <div className={clsx('flex-shrink-0 text-center', GRADE_COLOR[grade])}>
                            <p className="text-xl font-black leading-none">{score}%</p>
                            <p className="text-[10px] opacity-70">{grade}</p>
                          </div>
                        </div>
                        <div className="mt-2 w-full bg-white/5 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all"
                            style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-2 flex-1">
                      {u.location && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <MapPin size={12} />
                          {[u.location.area, u.location.city, u.location.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {u.budget && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <DollarSign size={12} />
                          ₹{u.budget.min?.toLocaleString()} – ₹{u.budget.max?.toLocaleString()}/mo
                        </div>
                      )}
                      {u.profile?.bio && (
                        <p className="text-slate-400 text-xs line-clamp-2">{u.profile.bio}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {u.lifestyle?.sleepTime && (
                          <span className="badge bg-white/5 text-slate-400 border border-white/10 text-[10px]">
                            {u.lifestyle.sleepTime === 'early-bird' ? '🌅' : u.lifestyle.sleepTime === 'night-owl' ? '🦉' : '⚡'} {u.lifestyle.sleepTime}
                          </span>
                        )}
                        {u.lifestyle?.smokingAllowed && <span className="badge bg-white/5 text-slate-400 border border-white/10 text-[10px]">🚬</span>}
                        {u.lifestyle?.petsAllowed && <span className="badge bg-white/5 text-slate-400 border border-white/10 text-[10px]">🐾</span>}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 pt-0 flex gap-2">
                      <Link href={`/dashboard/browse/${u._id}`}
                        className="flex-1 text-center text-sm glass px-3 py-2 rounded-xl hover:bg-white/10 transition-all">
                        View Profile
                      </Link>
                      <button onClick={() => sendMessage(u._id)} disabled={sending === u._id}
                        className="flex-1 btn-primary justify-center py-2 text-sm disabled:opacity-60">
                        {sending === u._id
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <><MessageCircle size={14} /> Message</>}
                      </button>
                    </div>

                    {/* Report / Block dropdown */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => setReportModal({ userId: u._id, name: u.name })}
                        className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                        title="Report user">
                        <Flag size={12} className="text-red-400" />
                      </button>
                      <button onClick={() => blockUser(u._id)}
                        className="w-7 h-7 rounded-lg bg-slate-500/20 hover:bg-slate-500/30 flex items-center justify-center transition-colors"
                        title="Block user">
                        <Shield size={12} className="text-slate-400" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Report Modal */}
      <AnimatePresence>
        {reportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setReportModal(null); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Flag size={18} className="text-red-400" /> Report {reportModal.name}
                </h3>
                <button onClick={() => setReportModal(null)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Reason</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="input-field">
                  <option value="harassment">Harassment</option>
                  <option value="fake-profile">Fake Profile</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate-content">Inappropriate Content</option>
                  <option value="scam">Scam</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description (optional)</label>
                <textarea rows={3} value={reportDesc} onChange={(e) => setReportDesc(e.target.value)}
                  className="input-field resize-none text-sm" placeholder="Describe the issue…" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setReportModal(null)}
                  className="flex-1 glass py-2.5 rounded-xl text-slate-400 hover:text-white transition-all text-sm">Cancel</button>
                <button onClick={submitReport} className="flex-1 bg-red-500/80 hover:bg-red-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
                  Submit Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
