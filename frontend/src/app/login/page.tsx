'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/cancelled-popup-request': '',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
};
const getMsg = (code: string) => FIREBASE_ERRORS[code] ?? 'Authentication failed. Please try again.';

// Full-screen loading overlay
function FullLoader() {
  return (
    <div className="min-h-screen hero-gradient flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-[3px] border-purple-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm animate-pulse">Signing you in…</p>
    </div>
  );
}

export default function LoginPage() {
  const { user, loading, syncing, signInWithGoogle, signInWithEmail } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  // Redirect once user is known — keep showing loader (no blink)
  useEffect(() => {
    if (!loading && !syncing && user) {
      // Check localStorage first (survives server restarts & in-memory DB resets)
      const setupDone = typeof window !== 'undefined' &&
        localStorage.getItem(`roomora_setup_${user.id}`) === '1';
      const profileFilled = !!(user.profile?.occupation || user.profile?.gender);
      const isNew = !setupDone && !profileFilled;
      router.replace(isNew ? '/setup' : '/dashboard');
    }
  }, [user, loading, syncing, router]);

  // Show full-screen loader during Firebase init, backend sync, OR post-auth redirect
  // This prevents ANY flash of the login form during auth transitions
  if (loading || syncing || (!loading && !syncing && user)) return <FullLoader />;

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
      // syncing=true immediately → FullLoader renders → no blink
    } catch (e: any) {
      if (e.code !== 'auth/cancelled-popup-request' && e.code !== 'auth/popup-closed-by-user') {
        setError(getMsg(e.code));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    try {
      await signInWithEmail(email, password);
      // syncing=true immediately → FullLoader renders → no blink
    } catch (e: any) {
      setError(getMsg(e.code));
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Home size={26} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black gradient-text">Roomora</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to find your perfect roommate</p>
        </div>

        {/* Google Sign-In */}
        <button
          id="google-signin-btn"
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold px-5 py-3.5 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all mb-5 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-slate-500 text-xs">or sign in with email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="email-input" type="email" placeholder="Email address"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-field pl-10 py-3 text-sm" autoComplete="email"
            />
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="password-input" type={showPass ? 'text' : 'password'} placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10 pr-11 py-3 text-sm" autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm"
              >
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button id="signin-btn" type="submit"
            className="btn-primary w-full justify-center py-3 text-sm">
            Sign In <ArrowRight size={15} />
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-5">
          New to Roomora? Sign in with Google to create your account automatically.
        </p>
      </motion.div>
    </div>
  );
}
