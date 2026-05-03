'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Home, Plus, MapPin, Trash2, Edit, BedDouble, Sofa } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ maxRent: '', roomType: '' });
  const [form, setForm] = useState({
    title: '', description: '', rent: '', deposit: '', roomType: 'private', furnishing: 'furnished',
    location: { address: '', lat: '', lng: '', city: '' },
    amenities: [] as string[], preferredGender: 'any', maxOccupants: 1,
  });

  const AMENITIES = ['WiFi', 'AC', 'Parking', 'Gym', 'Laundry', 'Kitchen', 'Power Backup', 'Security', 'Lift'];

  useEffect(() => { fetchRooms(); }, [filters]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const coords = user?.location?.coordinates;
      const params: any = { ...filters };
      if (coords && coords[0] !== 0) { params.lat = coords[1]; params.lng = coords[0]; params.radius = 20; }
      const { data } = await api.get('/rooms', { params });
      setRooms(data.rooms);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm((f) => ({ ...f, location: { ...f.location, lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) } }));
      toast.success('Location captured!');
    });
  };

  const submitRoom = async () => {
    try {
      await api.post('/rooms', { ...form, rent: +form.rent, deposit: +form.deposit, location: { ...form.location, lat: +form.location.lat, lng: +form.location.lng } });
      toast.success('Room listed!');
      setShowForm(false);
      fetchRooms();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const deleteRoom = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await api.delete(`/rooms/${id}`).catch(() => {});
    fetchRooms();
    toast.success('Deleted');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black gradient-text">Room Listings</h1>
          <p className="text-slate-400 text-sm">{rooms.length} rooms available near you</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={16} /> {showForm ? 'Cancel' : 'List Room'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 glass rounded-xl p-3">
        <select value={filters.roomType} onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
          className="input-field flex-1 min-w-32 py-2 text-sm">
          <option value="">All Types</option>
          <option value="private">Private Room</option>
          <option value="shared">Shared Room</option>
          <option value="entire-place">Entire Place</option>
        </select>
        <input type="number" placeholder="Max Rent (₹)" value={filters.maxRent}
          onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
          className="input-field flex-1 min-w-32 py-2 text-sm" />
      </div>

      {/* Add Room Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg">Add New Listing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Title</label>
              <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Cozy private room in Bandra West" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Rent/month (₹)</label>
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
                <option value="semi-furnished">Semi-furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Address</label>
              <div className="flex gap-2">
                <input className="input-field flex-1" value={form.location.address} onChange={(e) => setForm({ ...form, location: { ...form.location, address: e.target.value } })} placeholder="Street address…" />
                <button onClick={getLocation} className="btn-primary py-2 px-3 whitespace-nowrap"><MapPin size={15} /></button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">City</label>
              <input className="input-field" value={form.location.city} onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Preferred Gender</label>
              <select className="input-field" value={form.preferredGender} onChange={(e) => setForm({ ...form, preferredGender: e.target.value })}>
                <option value="any">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <button key={a} onClick={() => setForm((f) => ({
                  ...f,
                  amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a]
                }))}
                  className={clsx('badge text-xs px-3 py-1.5 cursor-pointer transition-all',
                    form.amenities.includes(a) ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40' : 'bg-white/5 text-slate-400 border border-white/10')}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description</label>
            <textarea rows={3} className="input-field resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <button onClick={submitRoom} className="btn-primary w-full justify-center">Submit Listing</button>
        </motion.div>
      )}

      {/* Rooms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl h-48 shimmer" />)}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16">
          <Home size={40} className="text-purple-400 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">No rooms found. Try adjusting filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map((room, i) => (
            <motion.div key={room._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass rounded-2xl p-5 card-hover">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold">{room.title}</h3>
                  <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                    <MapPin size={11} /> {room.location?.address}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black gradient-text">₹{room.rent?.toLocaleString()}</div>
                  <div className="text-slate-400 text-xs">/month</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="badge bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <BedDouble size={11} /> {room.roomType}
                </span>
                <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sofa size={11} /> {room.furnishing}
                </span>
                {room.amenities?.slice(0, 3).map((a: string) => (
                  <span key={a} className="badge bg-white/5 text-slate-400 border border-white/10">{a}</span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <img src={room.owner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.owner?.name}`}
                    className="w-6 h-6 rounded-full" alt={room.owner?.name} />
                  <span className="text-xs text-slate-400">{room.owner?.name}</span>
                </div>
                {room.owner?._id === user?.id && (
                  <button onClick={() => deleteRoom(room._id)} className="text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

