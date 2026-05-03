'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MapPin, Search, Filter, Home, BedDouble, Sofa, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const ROOM_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'private', label: 'Private Room' },
  { value: 'shared', label: 'Shared Room' },
  { value: 'entire-place', label: 'Entire Place' },
];

export default function FindRoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    country: '', state: '', city: '', area: '', maxRent: '', roomType: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Add room form
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', rent: '', deposit: '',
    roomType: 'private', furnishing: 'furnished', amenities: [] as string[],
    preferredGender: 'any',
    location: { address: '', area: '', city: '', state: '', country: '' },
  });

  const AMENITIES = ['WiFi', 'AC', 'Parking', 'Gym', 'Laundry', 'Kitchen', 'Power Backup', 'Security'];

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/rooms', { params: filters });
      setRooms(data.rooms || []);
    } catch { setRooms([]); }
    finally { setLoading(false); }
  };

  const submitRoom = async () => {
    try {
      await api.post('/rooms', {
        ...form, rent: +form.rent, deposit: +form.deposit,
      });
      toast.success('Room listed successfully!');
      setShowAdd(false);
      fetchRooms();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to list room'); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black gradient-text flex items-center gap-2">
            <Home size={24} /> Find Rooms
          </h1>
          <p className="text-slate-400 text-sm">Browse rooms by location</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 glass px-4 py-2 rounded-xl text-sm hover:bg-white/10 transition-all">
            <Filter size={14} /> Filters
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
            <Plus size={14} /> List Room
          </button>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="glass rounded-xl p-2 flex items-center gap-2">
        <MapPin size={18} className="text-slate-400 ml-3" />
        <input type="text" placeholder="City" value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          className="bg-transparent border-none outline-none text-sm w-32 md:w-48 placeholder-slate-500" />
        <div className="w-px h-6 bg-white/10" />
        <input type="text" placeholder="Area" value={filters.area}
          onChange={(e) => setFilters({ ...filters, area: e.target.value })}
          className="bg-transparent border-none outline-none text-sm w-32 md:w-48 placeholder-slate-500" />
        <button onClick={fetchRooms} className="btn-primary px-4 py-2 text-sm ml-auto">
          Search
        </button>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-5 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Country</label>
                <input type="text" value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                  placeholder="e.g. India" className="input-field py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">State</label>
                <input type="text" value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                  placeholder="e.g. Maharashtra" className="input-field py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Max Rent (₹)</label>
                <input type="number" value={filters.maxRent} onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                  placeholder="e.g. 15000" className="input-field py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Room Type</label>
                <select value={filters.roomType} onChange={(e) => setFilters({ ...filters, roomType: e.target.value })} className="input-field py-2 text-sm">
                  {ROOM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <button onClick={fetchRooms} className="btn-primary w-full justify-center py-2 text-sm mt-4">Apply Filters</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Room Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">📋 Add Room Listing</h2>
              <button onClick={() => setShowAdd(false)}><X size={18} className="text-slate-400 hover:text-white" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Room Title *</label>
                <input className="input-field" placeholder="Cozy private room in Bandra West" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Rent/month (₹) *</label>
                <input type="number" className="input-field" value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Deposit (₹)</label>
                <input type="number" className="input-field" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Room Type</label>
                <select className="input-field" value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })}>
                  <option value="private">Private</option>
                  <option value="shared">Shared</option>
                  <option value="entire-place">Entire Place</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Furnishing</label>
                <select className="input-field" value={form.furnishing} onChange={(e) => setForm({ ...form, furnishing: e.target.value })}>
                  <option value="furnished">Furnished</option>
                  <option value="semi-furnished">Semi-Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>
              
              {/* Location Fields */}
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Address</label>
                <input className="input-field" placeholder="Street address" value={form.location.address}
                  onChange={(e) => setForm({ ...form, location: { ...form.location, address: e.target.value } })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Area/Locality</label>
                <input className="input-field" placeholder="e.g. Bandra" value={form.location.area}
                  onChange={(e) => setForm({ ...form, location: { ...form.location, area: e.target.value } })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">City</label>
                <input className="input-field" placeholder="e.g. Mumbai" value={form.location.city}
                  onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">State</label>
                <input className="input-field" placeholder="e.g. Maharashtra" value={form.location.state}
                  onChange={(e) => setForm({ ...form, location: { ...form.location, state: e.target.value } })} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Country</label>
                <input className="input-field" placeholder="e.g. India" value={form.location.country}
                  onChange={(e) => setForm({ ...form, location: { ...form.location, country: e.target.value } })} />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-2 block">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((a) => (
                    <button key={a} type="button"
                      onClick={() => setForm((f) => ({
                        ...f, amenities: f.amenities.includes(a)
                          ? f.amenities.filter((x) => x !== a)
                          : [...f.amenities, a]
                      }))}
                      className={clsx('badge text-xs px-3 py-1.5 transition-all cursor-pointer',
                        form.amenities.includes(a)
                          ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40'
                          : 'bg-white/5 text-slate-400 border border-white/10')}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <textarea rows={3} className="input-field resize-none" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the room, neighbourhood, and house rules…" />
              </div>
            </div>
            <button onClick={submitRoom} className="btn-primary w-full justify-center mt-4">
              Submit Listing
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl h-52 shimmer" />)}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16">
          <Home size={40} className="text-purple-400 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400 font-semibold">No rooms found</p>
          <p className="text-slate-600 text-sm mt-1">Try adjusting location filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room, i) => (
            <motion.div key={room._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl overflow-hidden card-hover">
              <div className="h-36 bg-gradient-to-br from-purple-900/50 to-slate-800/50 flex items-center justify-center relative">
                {room.images?.[0]
                  ? <img src={room.images[0]} alt={room.title} className="w-full h-full object-cover" />
                  : <Home size={32} className="text-purple-400 opacity-40" />
                }
                <div className="absolute top-2 left-2">
                  <span className={clsx('badge text-xs',
                    room.roomType === 'private' ? 'bg-purple-500/20 text-purple-300' :
                    room.roomType === 'shared' ? 'bg-cyan-500/20 text-cyan-300' :
                    'bg-amber-500/20 text-amber-300')}>
                    {room.roomType}
                  </span>
                </div>
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                  <span className="text-white font-bold text-sm">₹{room.rent?.toLocaleString()}</span>
                  <span className="text-slate-400 text-xs">/mo</span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold truncate">{room.title}</h3>
                <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                  <MapPin size={11} />
                  {[room.location?.area, room.location?.city, room.location?.state].filter(Boolean).join(', ') || room.location?.address}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="badge bg-white/5 text-slate-400 border border-white/10 text-xs">
                    <Sofa size={10} /> {room.furnishing}
                  </span>
                  {room.amenities?.slice(0, 2).map((a: string) => (
                    <span key={a} className="badge bg-white/5 text-slate-400 border border-white/10 text-xs">{a}</span>
                  ))}
                  {(room.amenities?.length || 0) > 2 && (
                    <span className="badge bg-white/5 text-slate-400 border border-white/10 text-xs">+{room.amenities.length - 2}</span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <img src={room.owner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.owner?.name}`}
                      className="w-6 h-6 rounded-full" alt="" />
                    <span className="text-xs text-slate-400">{room.owner?.name}</span>
                  </div>
                  <Link href={`/dashboard/rooms/${room._id}`}
                    className="text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors">
                    View Details →
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
