import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { MapPin, Zap, Compass } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import PlaceDetailsModal from './PlaceDetailsModal';

// Fix for default marker icons in Leaflet with Webpack/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MapView = ({ onPlaceClick, onAddPhoto, user }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const res = await axios.get('/api/places');
      // Filter out places without coordinates
      const withCoords = res.data.filter(p => p.lat && p.lng);
      setPlaces(withCoords);
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
              <Marker key={place.id} position={[place.lat, place.lng]}>
                <Popup>
                  <div className="map-popup-card">
                    <div className="map-popup-header">
                      <span className={`map-popup-badge ${place.type}`}>
                        {place.type === 'activity' ? <Zap size={10} style={{ color: 'var(--accent)' }} /> : <MapPin size={10} style={{ color: 'var(--secondary)' }} />}
                        {place.type === 'activity' ? 'Activité' : 'Lieu'}
                      </span>
                      <span className={`map-popup-status ${place.status}`}>
                        {place.status === 'visited' ? 'Visité' : 'À faire'}
                      </span>
                    </div>
                    <h4 className="map-popup-title">{place.name}</h4>
                    {place.location && (
                      <p className="map-popup-location">
                        <MapPin size={12} /> {place.location}
                      </p>
                    )}
                    {place.description && (
                      <p className="map-popup-description">{place.description}</p>
                    )}
                    <button 
                      className="map-popup-btn" 
                      onClick={() => setSelectedPlace(place)}
                    >
                      <Compass size={14} /> Voir les souvenirs
                    </button>
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
            onAddPhoto={(p) => {
              setSelectedPlace(null);
              if (onAddPhoto) onAddPhoto(p);
            }}
            onPhotoDeleted={fetchPlaces}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapView;
