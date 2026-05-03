'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Users, Flag, BarChart3, Trash2, CheckCircle, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'analytics' | 'users' | 'reports'>('analytics');
  const [analytics, setAnalytics] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchAnalytics();
  }, [user]);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'reports') fetchReports();
  }, [tab, search]);

  const fetchAnalytics = async () => {
    const { data } = await api.get('/admin/analytics').catch(() => ({ data: {} }));
    setAnalytics(data);
  };
  const fetchUsers = async () => {
    const { data } = await api.get('/admin/users', { params: { search } }).catch(() => ({ data: { users: [] } }));
    setUsers(data.users);
  };
  const fetchReports = async () => {
    const { data } = await api.get('/admin/reports').catch(() => ({ data: [] }));
    setReports(data);
  };
  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user permanently?')) return;
    await api.delete(`/admin/users/${id}`).catch(() => {});
    fetchUsers();
    toast.success('User removed');
  };
  const resolveReport = async (id: string, status: string) => {
    await api.put(`/admin/reports/${id}`, { status }).catch(() => {});
    fetchReports();
    toast.success(`Report ${status}`);
  };

  if (user?.role !== 'admin') return (
    <div className="text-center py-20">
      <ShieldCheck size={48} className="text-red-400 mx-auto mb-4" />
      <p className="text-slate-400">Admin access required.</p>
    </div>
  );

  const statCards = [
    { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'text-purple-400 bg-purple-500/10' },
    { label: 'Total Rooms', value: analytics.totalRooms, icon: BarChart3, color: 'text-cyan-400 bg-cyan-500/10' },
    { label: 'Pending Reports', value: analytics.pendingReports, icon: Flag, color: 'text-red-400 bg-red-500/10' },
    { label: 'New Today', value: analytics.newUsersToday, icon: TrendingUp, color: 'text-green-400 bg-green-500/10' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black gradient-text">Admin Panel</h1>
        <p className="text-slate-400 text-sm">Roomora platform management</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 glass rounded-xl p-1.5 w-fit">
        {(['analytics', 'users', 'reports'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all',
              tab === t ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white')}>
            {t}
          </button>
        ))}
      </div>

      {/* Analytics */}
      {tab === 'analytics' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', s.color)}>
                <s.icon size={20} />
              </div>
              <div className="text-3xl font-black">{s.value ?? '–'}</div>
              <div className="text-slate-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-4">
          <input className="input-field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" />
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u._id} className="glass rounded-xl p-4 flex items-center gap-4">
                <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt={u.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{u.name}</p>
                    {u.role === 'admin' && <span className="badge bg-amber-500/15 text-amber-400 text-xs">Admin</span>}
                    {u.isBlocked && <span className="badge bg-red-500/15 text-red-400 text-xs">Blocked</span>}
                  </div>
                  <p className="text-slate-400 text-xs truncate">{u.email}</p>
                </div>
                <p className="text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</p>
                {u.role !== 'admin' && (
                  <button onClick={() => deleteUser(u._id)} className="text-red-400 hover:text-red-300 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            {users.length === 0 && <p className="text-center text-slate-400 py-8">No users found.</p>}
          </div>
        </div>
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 && <p className="text-center text-slate-400 py-8">No reports.</p>}
          {reports.map((r) => (
            <div key={r._id} className={clsx('glass rounded-xl p-4 border',
              r.status === 'pending' ? 'border-red-500/20' : 'border-white/5')}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} className="text-red-400" />
                    <span className="font-semibold text-sm capitalize">{r.reason.replace('-', ' ')}</span>
                    <span className={clsx('badge text-xs',
                      r.status === 'pending' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400')}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Reporter: <strong>{r.reporter?.name}</strong> → Reported: <strong>{r.reported?.name}</strong>
                  </p>
                  {r.description && <p className="text-slate-500 text-xs mt-1">"{r.description}"</p>}
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => resolveReport(r._id, 'resolved')}
                      className="flex items-center gap-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg transition-colors">
                      <Trash2 size={12} /> Ban User
                    </button>
                    <button onClick={() => resolveReport(r._id, 'dismissed')}
                      className="flex items-center gap-1 text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg transition-colors">
                      <CheckCircle size={12} /> Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

