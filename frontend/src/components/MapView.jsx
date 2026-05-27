import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { MapPin, Zap, Compass, Camera } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import PlaceDetailsModal from './PlaceDetailsModal';

const createPinIcon = (place) => {
  const img = place.first_photo_url
    ? `<img src="${place.first_photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" style="flex-shrink:0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div style="
        width:44px;height:44px;border-radius:50%;
        background:linear-gradient(135deg,#7c3aed,#a855f7);
        border:2.5px solid rgba(255,255,255,0.5);
        display:flex;align-items:center;justify-content:center;
        overflow:hidden;
        box-shadow:0 4px 16px rgba(124,58,237,0.7),0 0 0 4px rgba(124,58,237,0.2);
        transition:transform 0.2s;
      ">${img}</div>
      <div style="width:2px;height:8px;background:linear-gradient(to bottom,#7c3aed,rgba(124,58,237,0));"></div>
      <div style="width:6px;height:6px;border-radius:50%;background:#7c3aed;box-shadow:0 0 8px rgba(124,58,237,0.9);"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [44, 62],
    iconAnchor: [22, 62],
    popupAnchor: [0, -64],
  });
};

const MapView = ({ onPlaceClick, onAddPhoto, user }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => { fetchPlaces(); }, []);

  const fetchPlaces = async () => {
    try {
      const res = await axios.get('/api/places');
      setPlaces(res.data.filter(p => p.lat && p.lng));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const japanCenter = [36.2048, 138.2529];

  return (
    <div className="container" style={{ padding: '100px 20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2>Carte de <span style={{ color: 'var(--primary)' }}>l'Aventure</span></h2>
        <p style={{ color: 'var(--text-muted)' }}>Visualisez tous vos projets et souvenirs sur la carte du Japon.</p>
      </div>

      <div className="glass" style={{ height: '70vh', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative' }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Chargement de la carte...
          </div>
        ) : (
          <MapContainer center={japanCenter} zoom={5} style={{ height: '100%', width: '100%', background: '#111' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {places.map(place => (
              <Marker key={place.id} position={[place.lat, place.lng]} icon={createPinIcon(place)}>
                <Popup className="custom-map-popup" minWidth={220} maxWidth={260}>
                  <div style={{ fontFamily: 'inherit', borderRadius: '12px', overflow: 'hidden', background: '#1a1a2e', color: 'white', margin: '-13px -20px' }}>
                    {/* Photo header */}
                    {place.first_photo_url ? (
                      <div style={{ position: 'relative', height: '130px', overflow: 'hidden' }}>
                        <img
                          src={place.first_photo_url}
                          alt={place.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,26,46,0.9) 0%, transparent 60%)' }} />
                        <div style={{ position: 'absolute', bottom: '8px', left: '10px', right: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                            {place.name}
                          </h4>
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '50px', background: 'linear-gradient(135deg,#7c3aed22,#a855f722)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '8px' }}>
                        <MapPin size={14} style={{ color: '#a855f7' }} />
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>{place.name}</h4>
                      </div>
                    )}

                    {/* Body */}
                    <div style={{ padding: '10px 14px 12px' }}>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                          background: place.type === 'activity' ? 'rgba(255,193,7,0.15)' : 'rgba(168,85,247,0.15)',
                          color: place.type === 'activity' ? '#ffc107' : '#a855f7',
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                          {place.type === 'activity' ? <Zap size={9} /> : <MapPin size={9} />}
                          {place.type === 'activity' ? 'Activité' : 'Lieu'}
                        </span>
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                          background: place.status === 'visited' ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                          color: place.status === 'visited' ? '#22c55e' : '#818cf8',
                        }}>
                          {place.status === 'visited' ? '✓ Visité' : '· À faire'}
                        </span>
                      </div>

                      {place.location && (
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 0 6px' }}>
                          <MapPin size={10} /> {place.location}
                        </p>
                      )}
                      {place.description && (
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: '0 0 10px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {place.description}
                        </p>
                      )}

                      <button
                        onClick={() => setSelectedPlace(place)}
                        style={{
                          width: '100%', padding: '8px', border: 'none', borderRadius: '8px',
                          background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                          color: 'white', fontWeight: 700, fontSize: '0.78rem',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          boxShadow: '0 2px 8px rgba(124,58,237,0.4)'
                        }}
                      >
                        <Compass size={13} /> Voir les souvenirs
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      <AnimatePresence>
        {selectedPlace && (
          <PlaceDetailsModal
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
            user={user}
            onPlaceUpdated={fetchPlaces}
            onAddPhoto={(p) => { setSelectedPlace(null); if (onAddPhoto) onAddPhoto(p); }}
            onPhotoDeleted={fetchPlaces}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapView;
