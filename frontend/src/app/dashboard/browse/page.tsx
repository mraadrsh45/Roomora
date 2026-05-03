'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Search, MapPin, Users, CheckCircle, MessageCircle, Flag, Shield, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function BrowsePage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reportModal, setReportModal] = useState<{ userId: string; name: string } | null>(null);
  const [reportReason, setReportReason] = useState('harassment');
  const [reportDesc, setReportDesc] = useState('');

  useEffect(() => { fetchNearby(); }, []);

  const fetchNearby = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/roommate/nearby');
      setUsers(data.users || []);
    } catch (e) {
      // Fallback: load matches
      try {
        const { data } = await api.get('/users/matches');
        setUsers(data || []);
      } catch { setUsers([]); }
    } finally { setLoading(false); }
  };

  const sendMessage = async (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await api.post('/chat/direct', { targetUserId: userId });
      window.location.href = '/dashboard/chat';
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const blockUser = async (userId: string) => {
    try {
      await api.post(`/users/${userId}/block`);
      toast.success('User blocked');
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const submitReport = async () => {
    if (!reportModal) return;
    try {
      await api.post('/report', { reportedUserId: reportModal.userId, reason: reportReason, description: reportDesc });
      toast.success('Report submitted');
      setReportModal(null); setReportDesc('');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const filtered = users.filter((u) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.profile?.occupation?.toLowerCase().includes(search.toLowerCase()) ||
    u.location?.city?.toLowerCase().includes(search.toLowerCase())
  );

  const myCity = user?.location?.city;
  const myState = user?.location?.state;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black gradient-text">Browse Roommates</h1>
          <p className="text-slate-400 text-sm">
            {myCity ? `Showing users near ${myCity}` : 'Showing all users'}
            {' · '}{filtered.length} found
          </p>
        </div>
      </div>

      {!myCity && !myState && (
        <div className="glass border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
          <MapPin size={18} className="text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm">
            Add your city in your{' '}
            <Link href="/dashboard/profile" className="underline hover:text-amber-200">profile</Link>{' '}
            to see nearby roommates.
          </p>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="input-field pl-9 text-sm" value={search}
          onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, occupation or city…" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <div key={i} className="glass rounded-2xl h-52 shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="text-purple-400 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">No users found.</p>
          <p className="text-slate-600 text-sm mt-1">Try a different search or update your location in profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u, i) => (
            <motion.div key={u._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }} className="relative group">
              <Link href={`/dashboard/browse/${u._id}`} className="block glass rounded-2xl p-5 card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                      alt={u.name} className="w-14 h-14 rounded-xl object-cover" />
                    {u.isOnline && <div className="online-dot absolute -bottom-1 -right-1 border-2 border-[#12121e]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-bold truncate">{u.name}</p>
                      {u.verificationBadge && <CheckCircle size={13} className="text-purple-400 flex-shrink-0" />}
                    </div>
                    {u.profile?.occupation && <p className="text-slate-400 text-xs">{u.profile.occupation}</p>}
                    {u.location?.city && (
                      <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                        <MapPin size={10} />
                        {[u.location.area, u.location.city].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Compatibility */}
                {u.compatibility && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Compatibility</span>
                      <span className={clsx('font-bold',
                        u.compatibility.score >= 70 ? 'text-green-400' :
                        u.compatibility.score >= 50 ? 'text-cyan-400' :
                        u.compatibility.score >= 30 ? 'text-amber-400' : 'text-red-400')}>
                        {u.compatibility.score}%
                      </span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                        style={{ width: `${u.compatibility.score}%` }} />
                    </div>
                  </div>
                )}

                {/* Lifestyle tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {u.lifestyle?.sleepTime && (
                    <span className="badge bg-white/5 text-slate-300 text-xs border border-white/10">
                      {u.lifestyle.sleepTime === 'early-bird' ? '🌅' : u.lifestyle.sleepTime === 'night-owl' ? '🦉' : '⚡'} {u.lifestyle.sleepTime.replace('-', ' ')}
                    </span>
                  )}
                  {u.lifestyle?.petsAllowed && <span className="badge bg-white/5 text-slate-300 text-xs border border-white/10">🐾 Pets OK</span>}
                </div>

                {/* Budget + message */}
                {u.budget?.max && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">₹{u.budget.min?.toLocaleString()} – ₹{u.budget.max?.toLocaleString()}/mo</span>
                    <button onClick={(e) => sendMessage(u._id, e)}
                      className="flex items-center gap-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-1 rounded-lg transition-colors">
                      <MessageCircle size={11} /> Chat
                    </button>
                  </div>
                )}
              </Link>

              {/* Report / Block */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={() => setReportModal({ userId: u._id, name: u.name })}
                  className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center"
                  title="Report">
                  <Flag size={12} className="text-red-400" />
                </button>
                <button onClick={() => blockUser(u._id)}
                  className="w-7 h-7 rounded-lg bg-slate-500/20 hover:bg-slate-500/30 flex items-center justify-center"
                  title="Block">
                  <Shield size={12} className="text-slate-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      <AnimatePresence>
        {reportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setReportModal(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass rounded-2xl p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Flag size={18} className="text-red-400" /> Report {reportModal.name}
                </h3>
                <button onClick={() => setReportModal(null)}><X size={20} className="text-slate-400 hover:text-white" /></button>
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
                  className="flex-1 glass py-2.5 rounded-xl text-slate-400 hover:text-white text-sm">Cancel</button>
                <button onClick={submitReport}
                  className="flex-1 bg-red-500/80 hover:bg-red-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors">
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
