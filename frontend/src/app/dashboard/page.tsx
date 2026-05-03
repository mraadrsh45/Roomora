'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Users, Home, MapPin, MessageCircle, Sparkles, TrendingUp, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [nearbyCount, setNearbyCount] = useState(0);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: matches } = await api.get('/users/matches').catch(() => ({ data: [] }));
      const arr = Array.isArray(matches) ? matches : [];
      setRecentMatches(arr.slice(0, 3));
      // "Nearby" = same city
      const myCity = user?.location?.city?.toLowerCase();
      const nearCount = myCity
        ? arr.filter((m: any) => m.location?.city?.toLowerCase() === myCity).length
        : 0;
      setNearbyCount(nearCount);
    } catch { /* no-op */ }
  };

  const profileScore = (() => {
    if (!user) return 0;
    let s = 20;
    if (user.profile?.age) s += 15;
    if (user.profile?.bio) s += 15;
    if (user.lifestyle?.sleepTime) s += 15;
    if (user.budget?.max) s += 15;
    if ((user.profile?.interests?.length || 0) > 0) s += 10;
    if (user.location?.city) s += 10;
    return Math.min(s, 100);
  })();

  const quickActions = [
    { href: '/dashboard/matches', icon: Sparkles, label: 'Matches', color: 'from-purple-500 to-violet-700' },
    { href: '/dashboard/find-roommate', icon: Users, label: 'Find Roommate', color: 'from-cyan-500 to-cyan-700' },
    { href: '/dashboard/browse', icon: Search, label: 'Browse', color: 'from-indigo-500 to-indigo-700' },
    { href: '/dashboard/rooms', icon: Home, label: 'Rooms', color: 'from-amber-500 to-orange-600' },
    { href: '/dashboard/chat', icon: MessageCircle, label: 'Chat', color: 'from-rose-500 to-pink-700' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black">
          {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's your roommate search overview.</p>
      </motion.div>

      {/* Location info card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <MapPin size={18} className="text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Your Location</p>
            {user?.location?.city ? (
              <p className="text-slate-400 text-xs">
                {[user.location.area, user.location.city, user.location.state].filter(Boolean).join(', ')}
                {nearbyCount > 0 && <span className="ml-2 text-purple-400">· {nearbyCount} roommates nearby</span>}
              </p>
            ) : (
              <p className="text-slate-500 text-xs">Not set — add location for better matches</p>
            )}
          </div>
        </div>
        <Link href="/dashboard/profile" className="text-purple-400 text-xs hover:text-purple-300 flex items-center gap-1">
          {user?.location?.city ? 'Edit' : 'Set Location'} <ArrowRight size={12} />
        </Link>
      </motion.div>

      {/* Profile completeness */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-purple-400" />
            <span className="font-semibold text-sm">Profile Completeness</span>
          </div>
          <span className="text-purple-400 font-bold text-sm">{profileScore}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2">
          <div className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all duration-700"
            style={{ width: `${profileScore}%` }} />
        </div>
        {profileScore < 100 && (
          <Link href="/dashboard/profile" className="text-purple-400 text-xs mt-1.5 inline-flex items-center gap-1 hover:text-purple-300">
            Complete your profile <ArrowRight size={11} />
          </Link>
        )}
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-bold text-lg mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {quickActions.map((a, i) => (
            <motion.div key={a.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}>
              <Link href={a.href} className="block glass rounded-2xl p-4 text-center card-hover group">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                  <a.icon size={20} className="text-white" />
                </div>
                <p className="font-semibold text-xs">{a.label}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Top Matches</h2>
            <Link href="/dashboard/matches" className="text-purple-400 text-sm hover:text-purple-300 flex items-center gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentMatches.map((m) => (
              <Link key={m._id} href={`/dashboard/browse/${m._id}`}
                className="glass rounded-2xl p-4 card-hover flex items-center gap-3">
                <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                  alt={m.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="font-semibold text-sm truncate">{m.name}</p>
                  {m.location?.city && (
                    <p className="text-slate-400 text-xs flex items-center gap-1">
                      <MapPin size={9} /> {[m.location.area, m.location.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <span className="text-xs font-bold" style={{
                    color: m.compatibility?.score >= 70 ? '#22c55e' : m.compatibility?.score >= 50 ? '#06b6d4' : '#f59e0b'
                  }}>
                    {m.compatibility?.score}% match
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats row */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Profile Score', value: `${profileScore}%`, color: 'text-purple-400' },
          { label: 'Nearby Matches', value: nearbyCount, color: 'text-cyan-400' },
          { label: 'Top Matches', value: recentMatches.length, color: 'text-green-400' },
          { label: 'City', value: user?.location?.city || '—', color: 'text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
