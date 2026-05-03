'use client';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d0d1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d0d1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8fa8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0d0d1a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a2a45' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050510' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

interface Marker {
  lat: number;
  lng: number;
  label?: string;
  color?: 'blue' | 'purple' | 'red' | 'green' | 'yellow';
}

interface MapViewProps {
  center: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  markers?: Marker[];
  showRadius?: number; // meters
  className?: string;
}

export default function MapView({
  center, zoom = 14, height = '400px', markers = [], showRadius, className = '',
}: MapViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    id: 'roomora-map',
  });

  if (loadError) return (
    <div className={`rounded-2xl bg-[#12121e] border border-white/5 flex items-center justify-center ${className}`} style={{ height }}>
      <div className="text-center text-slate-500">
        <MapPin size={28} className="mx-auto mb-2 text-red-400" />
        <p className="text-sm">Map failed to load.</p>
      </div>
    </div>
  );

  if (!isLoaded) return (
    <div className={`rounded-2xl bg-[#12121e] border border-white/5 flex items-center justify-center ${className}`} style={{ height }}>
      <div className="text-center">
        <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-slate-500 text-sm">Loading map…</p>
      </div>
    </div>
  );

  return (
    <div className={`rounded-2xl overflow-hidden border border-white/10 ${className}`} style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={zoom}
        options={{
          styles: DARK_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: 7 },
          gestureHandling: 'cooperative',
        }}
      >
        {/* User location pulse circle */}
        {showRadius && (
          <Circle
            center={center}
            radius={showRadius}
            options={{
              fillColor: '#7c3aed',
              fillOpacity: 0.08,
              strokeColor: '#7c3aed',
              strokeOpacity: 0.4,
              strokeWeight: 1.5,
            }}
          />
        )}

        {/* User marker (blue dot) */}
        <Marker
          position={center}
          title="You are here"
          icon={{
            path: 'M 0,0 m -6,0 a 6,6 0 1,0 12,0 a 6,6 0 1,0 -12,0',
            fillColor: '#7c3aed',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2.5,
            scale: 1.2,
          }}
        />

        {/* Extra markers */}
        {markers.map((m, i) => (
          <Marker
            key={i}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.label}
            icon={{ url: `https://maps.google.com/mapfiles/ms/icons/${m.color || 'purple'}-dot.png` }}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
