import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { MapPin, Zap } from 'lucide-react';

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

const MapView = ({ onPlaceClick }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
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

      <div className="glass" style={{ height: '70vh', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
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
                  <div style={{ padding: '5px' }}>
                    <h4 
                      style={{ margin: '0 0 5px 0', color: '#4361ee', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => onPlaceClick(place)}
                      title="Voir les détails dans la liste"
                    >
                      {place.type === 'activity' ? <Zap size={14} color="#fcc419" /> : <MapPin size={14} color="#4361ee" />}
                      {place.name}
                    </h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#666' }}>{place.location}</p>
                    <p style={{ margin: '0', fontSize: '0.85rem' }}>{place.description}</p>
                    <div style={{ marginTop: '10px', fontSize: '0.75rem', fontWeight: 700, color: place.status === 'visited' ? '#00ff7f' : '#ff4d6d' }}>
                      {place.status === 'visited' ? '✓ Complété' : '○ À faire'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default MapView;
