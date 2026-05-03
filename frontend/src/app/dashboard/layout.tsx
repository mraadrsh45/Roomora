'use client';
export const dynamic = 'force-dynamic';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Map, Home, MessageCircle, Bell,
  User, LogOut, ShieldCheck, Menu, X, Crown, Lock, Search
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/find-rooms', icon: Home, label: 'Find Rooms' },
  { href: '/dashboard/find-roommate', icon: Users, label: 'Find Roommate' },
  { href: '/dashboard/matches', icon: Search, label: 'My Matches' },
  { href: '/dashboard/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, syncing, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !syncing && !user) router.push('/login');
    // Redirect new users to profile setup (skip if already on profile page)
    if (!loading && !syncing && user && !user.profileSetupComplete &&
        !pathname?.startsWith('/dashboard/profile') && !pathname?.startsWith('/dashboard/chat')) {
      router.push('/dashboard/profile?new=1');
    }
  }, [user, loading, syncing, router, pathname]);

  // Keep spinner until auth is fully resolved — prevents sidebar flash
  if (loading || syncing || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <Home size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">Roomora</span>
        </div>
      </div>

      {/* User */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
              alt={user.name} className="w-9 h-9 rounded-full object-cover" />
            {user.isOnline && <div className="online-dot absolute -bottom-0.5 -right-0.5 border-2 border-[#12121e]" />}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              {user.verificationBadge && <ShieldCheck size={13} className="text-purple-400 flex-shrink-0" />}
            </div>
            <p className="text-slate-500 text-xs truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )}>
              <item.icon size={17} />
              {item.label}
              {/* Badges */}
              {item.badge && <span className="ml-auto bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5 rounded-md">{item.badge}</span>}
              {item.label === 'Chat' && <span className="ml-auto bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>}
            </Link>
          );
        })}
        {user.role === 'admin' && (
          <Link href="/dashboard/admin"
            className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              pathname.startsWith('/dashboard/admin')
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            )}>
            <ShieldCheck size={17} />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all w-full">
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#12121e] border-r border-white/5 flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#12121e] border-r border-white/5">
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#12121e] border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/5">
            <Menu size={20} />
          </button>
          <span className="font-bold gradient-text">Roomora</span>
          <div className="w-9 h-9" />
        </div>

        <main className="flex-1 overflow-y-auto bg-[#0a0a0f] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

