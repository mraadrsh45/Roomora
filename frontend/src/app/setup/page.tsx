'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Home, Search, CheckCircle } from 'lucide-react';

type Role = 'landlord' | 'seeker' | null;

const LANDLORD_POINTS = [
  'List unlimited properties',
  'Connect with verified tenants',
  '100% free forever',
];
const SEEKER_POINTS = [
  'Browse thousands of listings',
  'Save your favourite rooms',
  'Chat directly with landlords',
];

function FullLoader({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="min-h-screen hero-gradient flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-[3px] border-purple-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm animate-pulse">{text}</p>
    </div>
  );
}

export default function SetupPage() {
  const { user, loading, syncing, refreshUser } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<Role>(null);
  const [saving, setSaving] = useState(false);

  const setupKey = user ? `roomora_setup_${user.id}` : null;
  const isSetupDone = () => setupKey && typeof window !== 'undefined' && localStorage.getItem(setupKey) === '1';

  useEffect(() => {
    if (loading || syncing) return;
    if (!user) { router.replace('/login'); return; }
    // Already completed setup (from localStorage OR profile data)
    if (isSetupDone() || user.profile?.occupation || user.profile?.gender) {
      router.replace('/dashboard');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, syncing, router]);

  // Prevent rendering setup content during any transition
  if (loading || syncing || !user) return <FullLoader text="Setting up your account…" />;
  if (isSetupDone() || user.profile?.occupation || user.profile?.gender) return <FullLoader text="Redirecting…" />;

  const handleContinue = async () => {
    if (!selected || !setupKey) return;
    setSaving(true);
    try {
      await api.put('/users/profile', {
        profile: { occupation: selected === 'landlord' ? 'Landlord' : 'Room Seeker' },
        isLookingForRoom: selected === 'seeker',
      });
      await refreshUser();
    } catch { /* ignore backend errors, still proceed */ }
    finally {
      // Persist setup completion so reloads don't loop back here
      localStorage.setItem(setupKey, '1');
      router.replace('/dashboard/profile?new=1');
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <Home size={22} className="text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-black text-white mb-2">Create Your Account</h1>
        <p className="text-slate-400">Join Roomora and find your perfect room today</p>
      </motion.div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-8">

        {/* Landlord Card */}
        <motion.button
          id="landlord-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => setSelected('landlord')}
          className={`relative text-left rounded-2xl p-8 transition-all duration-300 border-2 cursor-pointer ${
            selected === 'landlord'
              ? 'border-green-400 bg-green-500/10 shadow-lg shadow-green-500/10'
              : 'border-white/10 bg-white/5 hover:border-green-400/50 hover:bg-green-500/5'
          }`}
        >
          {selected === 'landlord' && (
            <div className="absolute top-4 right-4">
              <CheckCircle size={22} className="text-green-400" />
            </div>
          )}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
            selected === 'landlord' ? 'bg-green-500/20' : 'bg-green-500/10'
          }`}>
            <Home size={30} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">I am a Landlord</h2>
          <p className="text-slate-400 text-sm mb-5">Post your room or property listing for free</p>
          <ul className="space-y-2.5">
            {LANDLORD_POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </motion.button>

        {/* Seeker Card */}
        <motion.button
          id="seeker-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          onClick={() => setSelected('seeker')}
          className={`relative text-left rounded-2xl p-8 transition-all duration-300 border-2 cursor-pointer ${
            selected === 'seeker'
              ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10'
              : 'border-white/10 bg-white/5 hover:border-amber-400/50 hover:bg-amber-500/5'
          }`}
        >
          {selected === 'seeker' && (
            <div className="absolute top-4 right-4">
              <CheckCircle size={22} className="text-amber-400" />
            </div>
          )}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
            selected === 'seeker' ? 'bg-amber-500/20' : 'bg-amber-500/10'
          }`}>
            <Search size={30} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">I'm Looking for a Room</h2>
          <p className="text-slate-400 text-sm mb-5">Search and connect with room owners</p>
          <ul className="space-y-2.5">
            {SEEKER_POINTS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </motion.button>
      </div>

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28 }}
        className="w-full max-w-3xl"
      >
        <button
          id="continue-btn"
          onClick={handleContinue}
          disabled={!selected || saving}
          className="btn-primary w-full justify-center py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl transition-all"
        >
          {saving
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : selected
              ? `Continue as ${selected === 'landlord' ? 'Landlord' : 'Room Seeker'} →`
              : 'Select a role to continue'
          }
        </button>
      </motion.div>

      <p className="text-slate-600 text-xs mt-4">
        Welcome, <span className="text-slate-400 font-medium">{user.name}</span> · You can change this later from your profile.
      </p>
    </div>
  );
}
