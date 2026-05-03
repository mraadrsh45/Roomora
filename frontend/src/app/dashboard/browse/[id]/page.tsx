'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { MapPin, CheckCircle, MessageCircle, ShieldAlert, Moon, Wind, Dog, Users, Cigarette } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function UserProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    api.get(`/users/${id}`).then(({ data }) => setProfile(data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const sendChatRequest = async () => {
    try {
      await api.post('/chat/request', { targetUserId: id });
      toast.success('Chat request sent!');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const blockUser = async () => {
    await api.post(`/users/${id}/block`).catch(() => {});
    toast.success('User blocked');
  };

  const submitReport = async () => {
    if (!reportReason) return;
    await api.post('/reports', { reportedUserId: id, reason: reportReason }).catch(() => {});
    toast.success('Report submitted');
    setShowReport(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="text-center py-20 text-slate-400">User not found.</div>;

  const c = profile.compatibility;
  const scoreColor = c?.score >= 70 ? 'text-green-400' : c?.score >= 50 ? 'text-cyan-400' : c?.score >= 30 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <img src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
              alt={profile.name} className="w-24 h-24 rounded-2xl object-cover" />
            {profile.isOnline && <div className="online-dot absolute -bottom-1 -right-1 border-2 border-[#12121e] scale-125" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black">{profile.name}</h1>
              {profile.verificationBadge && <CheckCircle size={18} className="text-purple-400" />}
            </div>
            {profile.profile?.occupation && <p className="text-slate-400 text-sm">{profile.profile.occupation}</p>}
            {profile.location?.city && (
              <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                <MapPin size={11} /> {profile.location.city}
              </div>
            )}
            {profile.profile?.bio && <p className="text-slate-300 text-sm mt-2 leading-relaxed">{profile.profile.bio}</p>}
          </div>

          {/* Compatibility badge */}
          {c && (
            <div className="text-center flex-shrink-0">
              <div className={clsx('text-4xl font-black', scoreColor)}>{c.score}%</div>
              <div className={clsx('text-xs font-semibold', scoreColor)}>{c.grade}</div>
              <div className="text-slate-500 text-xs">Match</div>
            </div>
          )}
        </div>

        {/* Score bar */}
        {c && (
          <div className="mt-4">
            <div className="w-full bg-white/5 rounded-full h-2">
              <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all"
                style={{ width: `${c.score}%` }} />
            </div>
            {c.reasons?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {c.reasons.map((r: string) => (
                  <span key={r} className="badge bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs">{r}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-5 pt-4 border-t border-white/5">
          <button onClick={sendChatRequest} className="btn-primary flex-1 justify-center">
            <MessageCircle size={15} /> Send Chat Request
          </button>
          <button onClick={blockUser} className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm">Block</button>
          <button onClick={() => setShowReport(!showReport)} className="px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all text-sm">
            <ShieldAlert size={15} />
          </button>
        </div>

        {/* Report form */}
        {showReport && (
          <div className="mt-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-2">
            <p className="text-sm font-semibold text-red-400">Report User</p>
            <select className="input-field text-sm py-2" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
              <option value="">Select reason…</option>
              <option value="fake-profile">Fake Profile</option>
              <option value="harassment">Harassment</option>
              <option value="spam">Spam</option>
              <option value="inappropriate-content">Inappropriate Content</option>
              <option value="scam">Scam</option>
              <option value="other">Other</option>
            </select>
            <button onClick={submitReport} className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm transition-all">Submit Report</button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-bold">Lifestyle & Preferences</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Age', value: profile.profile?.age ? `${profile.profile.age} years` : null },
            { label: 'Gender', value: profile.profile?.gender },
            { label: 'Sleep', value: profile.lifestyle?.sleepTime?.replace('-', ' ') },
            { label: 'Noise', value: profile.lifestyle?.noiseLevel },
            { label: 'Cleanliness', value: profile.lifestyle?.cleanliness ? `${profile.lifestyle.cleanliness}/5` : null },
            { label: 'Budget', value: profile.budget?.max ? `₹${profile.budget.min?.toLocaleString()} – ₹${profile.budget.max?.toLocaleString()}` : null },
          ].filter((x) => x.value).map((x) => (
            <div key={x.label} className="bg-white/3 rounded-xl p-3">
              <div className="text-slate-500 text-xs mb-0.5">{x.label}</div>
              <div className="font-semibold capitalize">{x.value}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.lifestyle?.smokingAllowed && <span className="badge bg-white/5 text-slate-300 border border-white/10"><Cigarette size={11} /> Smoking OK</span>}
          {profile.lifestyle?.petsAllowed && <span className="badge bg-white/5 text-slate-300 border border-white/10"><Dog size={11} /> Pets OK</span>}
          {profile.lifestyle?.guestsAllowed && <span className="badge bg-white/5 text-slate-300 border border-white/10"><Users size={11} /> Guests OK</span>}
        </div>
      </div>

      {/* Interests */}
      {profile.profile?.interests?.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold mb-3">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {profile.profile.interests.map((i: string) => (
              <span key={i} className="badge bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1.5">{i}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
