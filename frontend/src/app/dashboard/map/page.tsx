'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { InfoWindow, Marker } from '@react-google-maps/api';
import { MapPin, List, Map, Users, Sliders } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d0d1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8fa8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050510' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

export default function MapPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'map' | 'list'>('map');
  const [radius, setRadius] = useState(5);
  const [nearby, setNearby] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState({ lat: 20.5937, lng: 78.9629 });

  useEffect(() => {
    const coords = user?.location?.coordinates;
    if (coords && coords[0] !== 0) setCenter({ lat: coords[1], lng: coords[0] });
    fetchNearby();
  }, [radius, user]);

  const fetchNearby = async () => {
    const coords = user?.location?.coordinates;
    if (!coords || coords[0] === 0) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data } = await api.get('/users/nearby', {
        params: { lat: coords[1], lng: coords[0], radius },
      });
      setNearby(data.users || []);
    } catch { /* no-op */ }
    finally { setLoading(false); }
  };

  const nearbyMarkers = nearby.map((u) => ({
    lat: u.location.coordinates[1],
    lng: u.location.coordinates[0],
    label: u.name,
    color: 'yellow' as const,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black gradient-text">Map View</h1>
          <p className="text-slate-400 text-sm">{nearby.length} users within {radius}km</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 glass rounded-xl px-3 py-2">
            <Sliders size={14} className="text-slate-400" />
            {[1, 5, 10].map((r) => (
              <button key={r} onClick={() => setRadius(r)}
                className={clsx('px-3 py-1 rounded-lg text-sm font-medium transition-all',
                  radius === r ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white')}>
                {r}km
              </button>
            ))}
          </div>
          <div className="glass rounded-xl p-1 flex">
            {(['map', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all capitalize',
                  view === v ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white')}>
                {v === 'map' ? <Map size={14} /> : <List size={14} />} {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'map' ? (
        <MapView
          center={center}
          zoom={13}
          height="65vh"
          markers={nearbyMarkers}
          showRadius={radius * 1000}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? [...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl h-28 shimmer" />)
            : nearby.length === 0
              ? (
                <div className="col-span-3 text-center py-16">
                  <Users size={40} className="text-purple-400 mx-auto mb-3 opacity-50" />
                  <p className="text-slate-400">No users found nearby. Try a larger radius.</p>
                </div>
              )
              : nearby.map((u) => (
                <Link key={u._id} href={`/dashboard/browse/${u._id}`}
                  className="glass rounded-2xl p-4 card-hover flex items-center gap-3">
                  <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                    alt={u.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <MapPin size={10} /> {u.distanceKm} km
                    </div>
                    <div className="text-purple-400 font-bold text-sm mt-0.5">{u.compatibility?.score}% match</div>
                  </div>
                </Link>
              ))}
        </div>
      )}
    </div>
  );
}
