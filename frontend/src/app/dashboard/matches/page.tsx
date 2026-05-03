'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, CheckCircle, MessageCircle, Filter } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const GRADE_COLORS: Record<string, string> = {
  Excellent: 'text-green-400', Good: 'text-cyan-400',
  Fair: 'text-amber-400', Low: 'text-red-400',
};
const GRADE_BG: Record<string, string> = {
  Excellent: 'bg-green-500/10 border-green-500/20', Good: 'bg-cyan-500/10 border-cyan-500/20',
  Fair: 'bg-amber-500/10 border-amber-500/20', Low: 'bg-red-500/10 border-red-500/20',
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(30);

  useEffect(() => { fetchMatches(); }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users/matches');
      setMatches(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = matches.filter((m) => m.compatibility.score >= minScore);

  const sendRequest = async (userId: string) => {
    try {
      await api.post('/chat/request', { targetUserId: userId });
      toast.success('Chat request sent!');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black gradient-text">Smart Matches</h1>
          <p className="text-slate-400 text-sm">{filtered.length} compatible roommates found</p>
        </div>
        <div className="flex items-center gap-3 glass rounded-xl px-4 py-2">
          <Filter size={16} className="text-slate-400" />
          <span className="text-sm text-slate-400">Min:</span>
          <select value={minScore} onChange={(e) => setMinScore(+e.target.value)}
            className="bg-transparent text-white text-sm outline-none">
            <option value={20}>20%+</option>
            <option value={30}>30%+</option>
            <option value={50}>50%+</option>
            <option value={70}>70%+</option>
            <option value={80}>80%+</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl p-5 h-40 shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles size={48} className="text-purple-400 mx-auto mb-4 opacity-50" />
          <p className="text-slate-400">No matches found. Complete your profile to improve matching.</p>
          <Link href="/dashboard/profile" className="btn-primary mt-4 justify-center inline-flex">Complete Profile</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((match, i) => (
            <motion.div key={match._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={clsx('glass rounded-2xl p-5 card-hover border', GRADE_BG[match.compatibility.grade])}>
              <div className="flex gap-4">
                <div className="relative flex-shrink-0">
                  <img src={match.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.name}`}
                    alt={match.name} className="w-16 h-16 rounded-xl object-cover" />
                  {match.isOnline && <div className="online-dot absolute -bottom-1 -right-1 border-2 border-[#12121e]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{match.name}</p>
                        {match.verificationBadge && <CheckCircle size={14} className="text-purple-400" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-slate-400 text-xs mt-0.5">
                        {match.location?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} /> {[match.location.area, match.location.city].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {match.profile?.occupation && <span>· {match.profile.occupation}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={clsx('text-2xl font-black', GRADE_COLORS[match.compatibility.grade])}>
                        {match.compatibility.score}%
                      </div>
                      <div className={clsx('text-xs font-semibold', GRADE_COLORS[match.compatibility.grade])}>
                        {match.compatibility.grade}
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-3">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all"
                      style={{ width: `${match.compatibility.score}%` }} />
                  </div>

                  {match.compatibility.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {match.compatibility.reasons.slice(0, 2).map((r: string) => (
                        <span key={r} className="text-xs bg-white/5 rounded-full px-2 py-0.5 text-slate-300">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {match.budget && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    ₹{match.budget.min?.toLocaleString()} – ₹{match.budget.max?.toLocaleString()}/mo
                  </span>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/browse/${match._id}`}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors">View Profile</Link>
                    <button onClick={() => sendRequest(match._id)}
                      className="flex items-center gap-1 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-1 rounded-lg transition-colors">
                      <MessageCircle size={11} /> Chat
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
