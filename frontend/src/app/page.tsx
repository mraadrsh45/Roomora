'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Users, MapPin, Shield, MessageCircle, Star, ArrowRight, Sparkles, Search } from 'lucide-react';
import Link from 'next/link';

const features = [
  { icon: Sparkles, title: 'Smart Matching', desc: 'AI-powered compatibility scoring based on lifestyle, budget, and interests', color: 'text-purple-400' },
  { icon: MapPin, title: 'Location-Based', desc: 'Find roommates within 1km, 5km, or 10km of your location', color: 'text-cyan-400' },
  { icon: Shield, title: 'Verified Profiles', desc: 'Badge-verified users and safety reporting for peace of mind', color: 'text-green-400' },
  { icon: MessageCircle, title: 'Real-time Chat', desc: 'Secure messaging unlocked only after mutual acceptance', color: 'text-amber-400' },
  { icon: Home, title: 'Room Listings', desc: 'Browse rooms with filters, photos, and map view', color: 'text-rose-400' },
  { icon: Users, title: 'Community', desc: 'Connect with verified students, professionals, and more', color: 'text-indigo-400' },
];

const stats = [
  { label: 'Active Users', value: '50K+' },
  { label: 'Rooms Listed', value: '12K+' },
  { label: 'Matches Made', value: '98K+' },
  { label: 'Cities', value: '120+' },
];

export default function HomePage() {
  const { user, loading, signInWithGoogle, signInWithFacebook, signInWithApple } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen hero-gradient overflow-hidden">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <Home size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">Roomora</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-slate-300 hover:text-white transition-colors text-sm">Sign In</Link>
          <Link href="/login" className="btn-primary text-sm py-2">Get Started <ArrowRight size={16} /></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-24 pb-16 text-center max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={14} className="text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">Smart Roommate Matching</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Find Your{' '}
            <span className="gradient-text">Perfect</span>
            <br />Roommate
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Stop scrolling. Start matching. Roomora uses AI-powered compatibility scoring
            and location-based search to connect you with your ideal roommate.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button onClick={signInWithGoogle}
              className="flex items-center gap-3 bg-white text-gray-800 font-semibold px-6 py-3.5 rounded-xl hover:bg-gray-100 transition-all hover:-translate-y-1 shadow-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button onClick={signInWithFacebook}
              className="flex items-center gap-3 bg-[#1877F2] text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-[#166FE5] transition-all hover:-translate-y-1 shadow-lg">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Continue with Facebook
            </button>
            <button onClick={signInWithApple}
              className="flex items-center gap-3 bg-black border border-white/20 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-white/10 transition-all hover:-translate-y-1 shadow-lg">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              Continue with Apple
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 text-center card-hover">
              <div className="text-3xl font-black gradient-text">{s.value}</div>
              <div className="text-slate-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Everything you need to find <span className="gradient-text">the one</span></h2>
          <p className="text-slate-400 max-w-xl mx-auto">Roomora combines smart technology with real-world safety to make roommate hunting stress-free.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 card-hover cursor-default">
              <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-slate-500 text-sm">
        © 2024 Roomora. Built for smart roommate discovery.
      </footer>
    </div>
  );
}
