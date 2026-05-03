'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Bell, Check, MessageCircle, Sparkles, MapPin, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

const TYPE_ICON: Record<string, any> = {
  match: Sparkles, message: MessageCircle, nearby: MapPin, 'chat-request': MessageCircle,
  'chat-accepted': Check, system: Bell,
};
const TYPE_COLOR: Record<string, string> = {
  match: 'text-purple-400 bg-purple-500/10', message: 'text-cyan-400 bg-cyan-500/10',
  nearby: 'text-green-400 bg-green-500/10', 'chat-request': 'text-amber-400 bg-amber-500/10',
  'chat-accepted': 'text-green-400 bg-green-500/10', system: 'text-slate-400 bg-slate-500/10',
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifs(); }, []);

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifs((n) => n.map((x) => ({ ...x, isRead: true })));
  };

  const unread = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black gradient-text">Notifications</h1>
          {unread > 0 && <p className="text-slate-400 text-sm">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-purple-400 text-sm hover:text-purple-300 flex items-center gap-1">
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        [...Array(5)].map((_, i) => <div key={i} className="glass rounded-2xl h-16 shimmer" />)
      ) : notifs.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={40} className="text-purple-400 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">No notifications yet.</p>
        </div>
      ) : (
        notifs.map((n) => {
          const Icon = TYPE_ICON[n.type] || Bell;
          const colorClass = TYPE_COLOR[n.type] || TYPE_COLOR.system;
          return (
            <div key={n._id}
              className={clsx('glass rounded-2xl p-4 flex items-start gap-4 transition-all',
                !n.isRead && 'border border-purple-500/20 bg-purple-500/5')}>
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colorClass)}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={clsx('font-semibold text-sm', !n.isRead && 'text-white')}>{n.title}</p>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0 mt-1" />}
                </div>
                {n.body && <p className="text-slate-400 text-xs mt-0.5">{n.body}</p>}
                <p className="text-slate-600 text-xs mt-1">{format(new Date(n.createdAt), 'MMM d · h:mm a')}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

