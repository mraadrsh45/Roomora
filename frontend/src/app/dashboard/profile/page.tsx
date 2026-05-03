'use client';
export const dynamic = 'force-dynamic';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Camera, Save, User, Sparkles, MapPin, Briefcase, DollarSign,
  Moon, Cigarette, Dog, Users, Volume2, CheckCircle, ArrowRight
} from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const INTERESTS = ['Music', 'Sports', 'Cooking', 'Gaming', 'Reading', 'Yoga', 'Travel', 'Art', 'Movies', 'Fitness', 'Photography', 'Dancing'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const OCCUPATIONS = ['Student', 'Working Professional', 'Freelancer', 'Business Owner', 'Other'];
const SLEEP_TIMES = [
  { value: 'early-bird', label: '🌅 Early Bird (before 10pm)' },
  { value: 'night-owl', label: '🦉 Night Owl (after midnight)' },
  { value: 'flexible', label: '⚡ Flexible' },
];
const NOISE_LEVELS = [
  { value: 'quiet', label: '🤫 Quiet' },
  { value: 'moderate', label: '🔉 Moderate' },
  { value: 'lively', label: '🎉 Lively' },
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewUser = searchParams?.get('new') === '1';
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarBase64, setAvatarBase64] = useState('');

  const [form, setForm] = useState({
    name: '',
    avatar: '',
    profile: { age: '' as any, gender: '', occupation: '', bio: '', interests: [] as string[] },
    lifestyle: {
      sleepTime: '', cleanliness: 3, smokingAllowed: false,
      petsAllowed: false, guestsAllowed: true, noiseLevel: '', workSchedule: '',
    },
    budget: { min: 0, max: 20000 },
    isLookingForRoom: true,
    location: { country: '', state: '', city: '', area: '' },
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        avatar: user.avatar || '',
        profile: {
          age: user.profile?.age || '',
          gender: user.profile?.gender || '',
          occupation: user.profile?.occupation || '',
          bio: user.profile?.bio || '',
          interests: user.profile?.interests || [],
        },
        lifestyle: {
          sleepTime: user.lifestyle?.sleepTime || '',
          cleanliness: user.lifestyle?.cleanliness || 3,
          smokingAllowed: user.lifestyle?.smokingAllowed || false,
          petsAllowed: user.lifestyle?.petsAllowed || false,
          guestsAllowed: user.lifestyle?.guestsAllowed ?? true,
          noiseLevel: user.lifestyle?.noiseLevel || '',
          workSchedule: user.lifestyle?.workSchedule || '',
        },
        budget: { min: user.budget?.min || 0, max: user.budget?.max || 20000 },
        isLookingForRoom: user.isLookingForRoom ?? true,
        location: {
          country: user.location?.country || '',
          state: user.location?.state || '',
          city: user.location?.city || '',
          area: user.location?.area || '',
        },
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setAvatarPreview(base64);
      setAvatarBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const toggleInterest = (i: string) => {
    setForm((f) => ({
      ...f,
      profile: {
        ...f.profile,
        interests: f.profile.interests.includes(i)
          ? f.profile.interests.filter((x) => x !== i)
          : [...f.profile.interests, i],
      },
    }));
  };

  const save = async () => {
    // Validation
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.profile.age) { toast.error('Age is required'); return; }
    if (!form.profile.gender) { toast.error('Gender is required'); return; }
    if (!form.location.city) { toast.error('City is required'); return; }
    if (!avatarPreview && !user?.avatar) { toast.error('Profile photo is required'); return; }

    setSaving(true);
    try {
      const payload: any = {
        ...form,
        profile: { ...form.profile, age: Number(form.profile.age) },
        profileSetupComplete: true,
      };
      if (avatarBase64) payload.avatar = avatarBase64;

      await api.put('/users/profile', payload);
      await refreshUser();
      toast.success('Profile saved!');
      if (isNewUser) {
        setTimeout(() => router.replace('/dashboard'), 800);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const completionItems = [
    { label: 'Photo', done: !!(avatarPreview || user.avatar) },
    { label: 'Age & Gender', done: !!(form.profile.age && form.profile.gender) },
    { label: 'Location', done: !!(form.location.city) },
    { label: 'Budget', done: !!(form.budget.max > 0) },
    { label: 'Lifestyle', done: !!(form.lifestyle.sleepTime) },
  ];
  const completion = Math.round((completionItems.filter((x) => x.done).length / completionItems.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">

      {/* Welcome banner */}
      {isNewUser && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass border border-purple-500/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-purple-300">Welcome to Roomora, {user?.name?.split(' ')[0]}! 🎉</p>
            <p className="text-slate-400 text-sm mt-0.5">
              Complete your profile to get the best roommate matches. Profile photo is required.
            </p>
          </div>
        </motion.div>
      )}

      {/* Completion progress */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Profile Completion</span>
          <span className={clsx('text-sm font-bold', completion === 100 ? 'text-green-400' : 'text-purple-400')}>{completion}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 mb-3">
          <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${completion}%` }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {completionItems.map((item) => (
            <span key={item.label} className={clsx('flex items-center gap-1 text-xs px-2 py-1 rounded-lg',
              item.done ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-slate-500')}>
              <CheckCircle size={11} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Photo Upload */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Camera size={18} className="text-purple-400" /> Profile Photo <span className="text-red-400 text-sm">*</span></h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border-2 border-white/10">
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <User size={32} className="text-slate-600" />
                  </div>
              }
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors">
              <Camera size={14} className="text-white" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Upload your photo</p>
            <p className="text-slate-500 text-xs mb-3">JPG, PNG up to 2MB. Required for matching.</p>
            <button onClick={() => fileRef.current?.click()} className="btn-primary text-sm py-2">
              Choose Photo
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        </div>
      </div>

      {/* Basic Info */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2"><User size={18} className="text-purple-400" /> Basic Info</h2>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Full Name <span className="text-red-400">*</span></label>
          <input className="input-field" placeholder="Your full name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Age <span className="text-red-400">*</span></label>
            <input type="number" min={18} max={80} className="input-field" placeholder="e.g. 24"
              value={form.profile.age}
              onChange={(e) => setForm({ ...form, profile: { ...form.profile, age: e.target.value } })} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Gender <span className="text-red-400">*</span></label>
            <select className="input-field" value={form.profile.gender}
              onChange={(e) => setForm({ ...form, profile: { ...form.profile, gender: e.target.value } })}>
              <option value="">Select gender</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Occupation <span className="text-red-400">*</span></label>
          <select className="input-field" value={form.profile.occupation}
            onChange={(e) => setForm({ ...form, profile: { ...form.profile, occupation: e.target.value } })}>
            <option value="">Select occupation</option>
            {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Short Bio</label>
          <textarea rows={3} className="input-field resize-none" placeholder="Tell potential roommates about yourself…"
            value={form.profile.bio}
            onChange={(e) => setForm({ ...form, profile: { ...form.profile, bio: e.target.value } })} />
        </div>
      </div>

      {/* Location */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2"><MapPin size={18} className="text-purple-400" /> Location</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">State <span className="text-red-400">*</span></label>
            <input className="input-field" placeholder="e.g. Maharashtra"
              value={form.location.state}
              onChange={(e) => setForm({ ...form, location: { ...form.location, state: e.target.value } })} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">City <span className="text-red-400">*</span></label>
            <input className="input-field" placeholder="e.g. Mumbai"
              value={form.location.city}
              onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Area / Locality</label>
            <input className="input-field" placeholder="e.g. Bandra West"
              value={form.location.area}
              onChange={(e) => setForm({ ...form, location: { ...form.location, area: e.target.value } })} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Country</label>
            <input className="input-field" placeholder="e.g. India"
              value={form.location.country}
              onChange={(e) => setForm({ ...form, location: { ...form.location, country: e.target.value } })} />
          </div>
        </div>
      </div>

      {/* Budget */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2"><DollarSign size={18} className="text-purple-400" /> Budget Range (₹/month)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Minimum</label>
            <input type="number" className="input-field" placeholder="e.g. 5000"
              value={form.budget.min}
              onChange={(e) => setForm({ ...form, budget: { ...form.budget, min: +e.target.value } })} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Maximum</label>
            <input type="number" className="input-field" placeholder="e.g. 20000"
              value={form.budget.max}
              onChange={(e) => setForm({ ...form, budget: { ...form.budget, max: +e.target.value } })} />
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white/3 rounded-xl">
          <input type="checkbox" id="lookingForRoom" checked={form.isLookingForRoom}
            onChange={(e) => setForm({ ...form, isLookingForRoom: e.target.checked })}
            className="w-4 h-4 accent-purple-500" />
          <label htmlFor="lookingForRoom" className="text-sm text-slate-300 cursor-pointer">
            I am actively looking for a room / roommate
          </label>
        </div>
      </div>

      {/* Lifestyle Preferences */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <h2 className="font-bold text-lg flex items-center gap-2"><Moon size={18} className="text-purple-400" /> Lifestyle Preferences</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Sleep Schedule</label>
            <select className="input-field" value={form.lifestyle.sleepTime}
              onChange={(e) => setForm({ ...form, lifestyle: { ...form.lifestyle, sleepTime: e.target.value } })}>
              <option value="">Select</option>
              {SLEEP_TIMES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Noise Level</label>
            <select className="input-field" value={form.lifestyle.noiseLevel}
              onChange={(e) => setForm({ ...form, lifestyle: { ...form.lifestyle, noiseLevel: e.target.value } })}>
              <option value="">Select</option>
              {NOISE_LEVELS.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-2 block">
            Cleanliness Standard: <span className="text-white font-medium">{['', '🧹 Messy', '🙂 Relaxed', '😊 Average', '✨ Tidy', '🌟 Spotless'][form.lifestyle.cleanliness]}</span>
          </label>
          <input type="range" min={1} max={5} value={form.lifestyle.cleanliness}
            onChange={(e) => setForm({ ...form, lifestyle: { ...form.lifestyle, cleanliness: +e.target.value } })}
            className="w-full accent-purple-500" />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>Messy</span><span>Spotless</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { key: 'smokingAllowed', label: '🚬 Smoking OK', icon: Cigarette },
            { key: 'petsAllowed', label: '🐾 Pets OK', icon: Dog },
            { key: 'guestsAllowed', label: '👥 Guests OK', icon: Users },
          ].map(({ key, label }) => (
            <button key={key} type="button"
              onClick={() => setForm((f) => ({ ...f, lifestyle: { ...f.lifestyle, [key]: !(f.lifestyle as any)[key] } }))}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer',
                (form.lifestyle as any)[key]
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-3">🎯 Interests</h2>
        <p className="text-slate-400 text-sm mb-4">Select interests to improve your matches</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button key={i} type="button" onClick={() => toggleInterest(i)}
              className={clsx('badge text-sm px-3 py-1.5 transition-all cursor-pointer',
                form.profile.interests.includes(i)
                  ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20')}>
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button onClick={save} disabled={saving}
        className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60">
        {saving ? (
          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
        ) : (
          <><Save size={18} /> {isNewUser ? 'Complete Setup & Continue' : 'Save Profile'} {isNewUser && <ArrowRight size={16} />}</>
        )}
      </button>
    </div>
  );
}
