'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup, signOut, onAuthStateChanged,
  signInWithEmailAndPassword, User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import api from '@/lib/api';

interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  isVerified: boolean;
  verificationBadge: boolean;
  isPremium?: boolean;
  profileSetupComplete?: boolean;
  isOnline?: boolean;
  isLookingForRoom?: boolean;
  profile?: any;
  lifestyle?: any;
  budget?: any;
  location?: any;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  syncing: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const toAppUser = (fu: FirebaseUser): AppUser => ({
  id: fu.uid,
  name: fu.displayName || fu.email?.split('@')[0] || 'User',
  email: fu.email || '',
  avatar: fu.photoURL || '',
  role: 'user',
  isVerified: fu.emailVerified,
  verificationBadge: false,
  profileSetupComplete: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser]       = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const syncWithBackend = async (firebaseUser: FirebaseUser) => {
    setSyncing(true);
    try {
      const idToken = await firebaseUser.getIdToken(true);
      const { data } = await api.post('/auth/firebase', { idToken });
      localStorage.setItem('roomora_token', data.token);
      setUser(data.user);
    } catch {
      localStorage.setItem('roomora_token', await firebaseUser.getIdToken());
      setUser(toAppUser(firebaseUser));
    } finally {
      setSyncing(false);
    }
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser((prev) => ({ ...prev, ...data }));
    } catch { /* keep current */ }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncWithBackend(firebaseUser);
      } else {
        localStorage.removeItem('roomora_token');
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    setSyncing(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setSyncing(false);
      throw e;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setSyncing(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setSyncing(false);
      throw e;
    }
  };

  const logout = async () => {
    await signOut(auth);
    Object.keys(localStorage).filter((k) => k.startsWith('roomora_')).forEach((k) => localStorage.removeItem(k));
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, syncing, signInWithGoogle, signInWithEmail, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
