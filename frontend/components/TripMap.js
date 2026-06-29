'use client';
import { useCallback, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { MapPin, Navigation, X } from 'lucide-react';

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#475569' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a3a2a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2d3748' }] },
];

const MARKER_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#84cc16'];

export default function TripMap({ activities, destination, dayNumber }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY,
    libraries: ['places', 'geometry'],
  });

  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [geocoding, setGeocoding] = useState(false);

  const onLoad = useCallback(async (map) => {
    mapRef.current = map;
    setGeocoding(true);

    const geocoder = new window.google.maps.Geocoder();

    const resolved = await Promise.all(
      activities.map((activity, idx) =>
        new Promise((resolve) => {
          geocoder.geocode(
            { address: `${activity.title}, ${destination}` },
            (results, status) => {
              if (status === 'OK' && results[0]) {
                resolve({
                  idx,
                  title: activity.title,
                  time: activity.time,
                  description: activity.description,
                  position: {
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng(),
                  },
                  color: MARKER_COLORS[idx % MARKER_COLORS.length],
                });
              } else {
                resolve(null);
              }
            }
          );
        })
      )
    );

    const valid = resolved.filter(Boolean);
    setMarkers(valid);
    setGeocoding(false);

    if (valid.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      valid.forEach(m => bounds.extend(m.position));
      map.fitBounds(bounds, { padding: 60 });
    }
  }, [activities, destination]);

  const routePath = markers.map(m => m.position);

  function openDirections() {
    const waypoints = activities.map(a => encodeURIComponent(`${a.title} ${destination}`)).join('/');
    window.open(`https://www.google.com/maps/dir/${waypoints}`, '_blank');
  }

  if (!isLoaded) {
    return (
      <div className="h-[420px] bg-[#1e293b] rounded-2xl flex items-center justify-center border border-white/8">
        <div className="flex flex-col items-center gap-3">
          <MapPin className="w-8 h-8 text-violet-500 animate-pulse" />
          <p className="text-slate-400 text-sm">Loading map…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-white/8 relative">

      {/* Top bar */}
      <div className="bg-[#1e293b] px-4 py-3 flex items-center justify-between border-b border-white/8">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-white">Day {dayNumber} Map</span>
          {geocoding && <span className="text-xs text-slate-400 ml-1">Locating places…</span>}
          {!geocoding && markers.length > 0 && (
            <span className="text-xs text-slate-400">{markers.length} place{markers.length > 1 ? 's' : ''} found</span>
          )}
        </div>
        <button
          onClick={openDirections}
          className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-3 py-1.5 rounded-full transition-all"
        >
          <Navigation className="w-3.5 h-3.5" /> Get Directions
        </button>
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '380px' }}
        center={{ lat: 20, lng: 0 }}
        zoom={2}
        onLoad={onLoad}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {/* Route polyline */}
        {routePath.length > 1 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: '#8b5cf6',
              strokeOpacity: 0.6,
              strokeWeight: 2,
              geodesic: true,
            }}
          />
        )}

        {/* Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.idx}
            position={marker.position}
            label={{
              text: String(marker.idx + 1),
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: marker.color,
              fillOpacity: 1,
              strokeColor: '#0f172a',
              strokeWeight: 2,
            }}
            onClick={() => setSelected(marker)}
          />
        ))}

        {/* Info window */}
        {selected && (
          <InfoWindow
            position={selected.position}
            onCloseClick={() => setSelected(null)}
          >
            <div style={{ background: '#1e293b', color: 'white', borderRadius: '8px', padding: '10px', maxWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: selected.color, flexShrink: 0 }} />
                <p style={{ fontWeight: 700, fontSize: '13px', margin: 0 }}>{selected.title}</p>
              </div>
              {selected.time && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>{selected.time}</p>}
              {selected.description && (
                <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '6px', lineHeight: '1.4' }}>
                  {selected.description.slice(0, 80)}{selected.description.length > 80 ? '…' : ''}
                </p>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.title + ' ' + destination)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', color: '#8b5cf6', textDecoration: 'none' }}
              >
                Open in Google Maps →
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Activity legend */}
      {markers.length > 0 && (
        <div className="bg-[#1e293b] border-t border-white/8 px-4 py-3 flex flex-wrap gap-2">
          {markers.map(m => (
            <button
              key={m.idx}
              onClick={() => { setSelected(m); mapRef.current?.panTo(m.position); }}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full transition-all"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
              {m.idx + 1}. {m.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
