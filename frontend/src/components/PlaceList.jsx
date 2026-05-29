import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle, Circle, MapPin, Camera, Zap, Compass, Trash2, Users } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PlaceDetailsModal from './PlaceDetailsModal';

const LocationPicker = ({ onLocationSelect, initialPos }) => {
  const [position, setPosition] = useState(initialPos);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
};

export const GROUP_COLORS = {
  purple: { label: 'Violet', bg: 'rgba(155, 89, 182, 0.2)', text: '#d580ff', border: '#9b59b6' },
  teal: { label: 'Turquoise', bg: 'rgba(26, 188, 156, 0.2)', text: '#4effd7', border: '#1abc9c' },
  orange: { label: 'Orange', bg: 'rgba(230, 126, 34, 0.2)', text: '#ff9f43', border: '#e67e22' },
  blue: { label: 'Bleu', bg: 'rgba(52, 152, 219, 0.2)', text: '#54a0ff', border: '#3498db' },
  green: { label: 'Vert', bg: 'rgba(46, 204, 113, 0.2)', text: '#2ecc71', border: '#2ecc71' },
  pink: { label: 'Rose', bg: 'rgba(233, 30, 99, 0.2)', text: '#ff758f', border: '#e91e63' }
};

export const getGroupColor = (groupId, groupColorKey) => {
  const colorsList = ['purple', 'teal', 'orange', 'blue', 'green', 'pink'];
  const key = groupColorKey && GROUP_COLORS[groupColorKey] ? groupColorKey : null;
  if (key) return GROUP_COLORS[key];
  
  if (!groupId) return GROUP_COLORS.purple;
  const index = Math.abs(parseInt(groupId, 10)) % colorsList.length;
  const fallbackKey = colorsList[isNaN(index) ? 0 : index];
  return GROUP_COLORS[fallbackKey];
};

const PlaceList = ({ onAddPhoto, selectedPlaceDetails, setSelectedPlaceDetails, user }) => {
  const [places, setPlaces] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newPlace, setNewPlace] = useState({
    name: '', description: '', location: '', type: 'place', lat: null, lng: null, visibility: 'public', group_id: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchLocation = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Japan')}`);
      if (res.data && res.data.length > 0) {
        const { lat, lon, display_name } = res.data[0];
        const newCoords = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setNewPlace({
          ...newPlace,
          lat: newCoords.lat,
          lng: newCoords.lng,
          location: display_name.split(',')[0] // Take first part of address
        });
        setSearchQuery('');
      } else {
        alert('Lieu non trouvé');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const res = await axios.get('/api/groups');
      setUserGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlaces = async () => {
    try {
      const res = await axios.get('/api/places');
      // For each place, fetch photo count
      const placesWithPhotos = await Promise.all(res.data.map(async (place) => {
        const photosRes = await axios.get(`/api/photos/${place.id}`);
        return { ...place, photos: photosRes.data };
      }));
      setPlaces(placesWithPhotos);

      // Update selected place details if it's open to refresh photo list
      if (selectedPlaceDetails) {
        const updated = placesWithPhotos.find(p => p.id === selectedPlaceDetails.id);
        if (updated) setSelectedPlaceDetails(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPlace = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/places', newPlace);
      setNewPlace({ name: '', description: '', location: '', type: 'place', lat: null, lng: null, visibility: 'public', group_id: '' });
      setShowAdd(false);
      fetchPlaces();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (e, id, currentStatus) => {
    e.stopPropagation();
    const nextStatus = currentStatus === 'visited' ? 'planned' : 'visited';
    try {
      await axios.patch(`/api/places/${id}`, { status: nextStatus });
      fetchPlaces();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlace = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Voulez-vous vraiment supprimer cette tâche ?')) return;
    try {
      await axios.delete(`/api/places/${id}`);
      fetchPlaces();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression de la tâche');
    }
  };

  // Group places by location
  const groupedPlaces = places.reduce((acc, place) => {
    const loc = place.location || 'Ailleurs';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(place);
    return acc;
  }, {});

  return (
    <div className="container" style={{ padding: '100px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h2>Bucket List <span style={{ color: 'var(--primary)' }}>Japon</span></h2>
        {(user?.role === 'editeur' || user?.role === 'admin') && (
          <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={20} /> Ajouter
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass"
            style={{ padding: '30px', marginBottom: '40px', overflow: 'hidden' }}
          >
            <form onSubmit={handleAddPlace} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <TypeSelector
                  active={newPlace.type === 'place'}
                  onClick={() => setNewPlace({ ...newPlace, type: 'place' })}
                  icon={<MapPin size={16} />}
                  label="Lieu"
                />
                <TypeSelector
                  active={newPlace.type === 'activity'}
                  onClick={() => setNewPlace({ ...newPlace, type: 'activity' })}
                  icon={<Zap size={16} />}
                  label="Activité"
                />
              </div>
              <input
                type="text" placeholder="Nom (ex: Akihabara ou Faire du Kart)" className="glass"
                style={{ padding: '12px', color: 'white' }}
                value={newPlace.name} onChange={e => setNewPlace({ ...newPlace, name: e.target.value })}
                required
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text" placeholder="Ville ou Adresse (ex: Tokyo)" className="glass"
                  style={{ padding: '12px', color: 'white', flex: 1 }}
                  value={newPlace.location} onChange={e => setNewPlace({ ...newPlace, location: e.target.value })}
                />
              </div>

              {user && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ color: 'var(--text-muted)' }}>Visibilité :</label>
                  <select
                    className="glass"
                    style={{ padding: '10px', color: 'white', flex: 1 }}
                    value={newPlace.visibility}
                    onChange={e => setNewPlace({ ...newPlace, visibility: e.target.value })}
                  >
                    <option value="public" style={{ color: 'black' }}>Public</option>
                    <option value="private" style={{ color: 'black' }}>Privé</option>
                    <option value="group" style={{ color: 'black' }}>Partager avec un groupe</option>
                  </select>

                  {newPlace.visibility === 'group' && (
                    <select
                      className="glass"
                      style={{ padding: '10px', color: 'white', flex: 1 }}
                      value={newPlace.group_id}
                      onChange={e => setNewPlace({ ...newPlace, group_id: e.target.value })}
                      required
                    >
                      <option value="" style={{ color: 'black' }}>Choisir un groupe...</option>
                      {userGroups.map(g => (
                        <option key={g.id} value={g.id} style={{ color: 'black' }}>{g.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <p style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--text-muted)' }}>
                  Position sur la carte (clique pour placer un point ou cherche ci-dessous) :
                </p>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text" placeholder="Chercher une adresse..." className="glass"
                    style={{ padding: '8px 12px', color: 'white', flex: 1, fontSize: '0.9rem' }}
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleSearchLocation())}
                  />
                  <button type="button" className="btn-glass" onClick={handleSearchLocation} disabled={isSearching} style={{ padding: '0 20px' }}>
                    {isSearching ? '...' : 'Chercher'}
                  </button>
                </div>
                <div style={{ height: '200px', borderRadius: '15px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                  <MapContainer center={[35.6762, 139.6503]} zoom={10} style={{ height: '100%', width: '100%', background: '#111' }}>
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; CARTO'
                    />
                    <LocationPicker
                      onLocationSelect={(pos) => setNewPlace({ ...newPlace, lat: pos.lat, lng: pos.lng })}
                      initialPos={newPlace.lat ? { lat: newPlace.lat, lng: newPlace.lng } : null}
                    />
                  </MapContainer>
                </div>
                {newPlace.lat && (
                  <p style={{ fontSize: '0.7rem', color: '#00ff7f', marginTop: '5px' }}>
                    Coordonnées enregistrées : {newPlace.lat.toFixed(4)}, {newPlace.lng.toFixed(4)}
                  </p>
                )}
              </div>

              <textarea
                placeholder="Description" className="glass"
                style={{ padding: '12px', color: 'white', minHeight: '100px' }}
                value={newPlace.description} onChange={e => setNewPlace({ ...newPlace, description: e.target.value })}
              />
              <button type="submit" className="btn-primary" style={{ padding: '15px' }}>Enregistrer</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {Object.keys(groupedPlaces).map((location, groupIndex) => (
        <div key={location} style={{ marginBottom: '60px' }}>
          <h3 style={{
            fontSize: '1.8rem',
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            color: 'var(--primary)'
          }}>
            <MapPin size={28} /> {location}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              ({groupedPlaces[location].length})
            </span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
            {groupedPlaces[location].map((place, index) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass place-card"
                style={{ padding: '25px', position: 'relative' }}
                onClick={() => setSelectedPlaceDetails(place)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      background: place.type === 'activity' ? 'rgba(254, 228, 64, 0.2)' : 'rgba(67, 97, 238, 0.2)',
                      color: place.type === 'activity' ? 'var(--accent)' : 'var(--secondary)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                      fontWeight: 800
                    }}>
                      {place.type === 'activity' ? 'Activité' : 'Lieu'}
                    </span>
                    <span style={{
                      fontSize: '0.8rem',
                      background: place.status === 'visited' ? 'rgba(0, 255, 127, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      color: place.status === 'visited' ? '#00ff7f' : 'var(--text-muted)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontWeight: 600
                    }}>
                      {place.status === 'visited' ? (place.type === 'activity' ? 'Fait' : 'Visité') : 'À faire'}
                    </span>
                    {place.visibility === 'group' && (
                      <span style={{
                        fontSize: '0.8rem',
                        background: getGroupColor(place.group_id, place.group_color).bg,
                        color: getGroupColor(place.group_id, place.group_color).text,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Users size={12} /> Groupe : {place.group_name || 'Chargement...'}
                      </span>
                    )}
                  </div>
                  {(user?.role === 'editeur' || user?.role === 'admin') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleStatus(e, place.id, place.status)}
                        style={{ background: 'none', padding: 0, color: place.status === 'visited' ? '#00ff7f' : 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                      >
                        {place.status === 'visited' ? <CheckCircle size={22} /> : <Circle size={22} />}
                      </button>
                      <button
                        onClick={(e) => handleDeletePlace(e, place.id)}
                        style={{ background: 'none', padding: 0, color: '#ff4d6d', cursor: 'pointer', display: 'flex' }}
                        title="Supprimer la tâche"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                </div>

                <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {place.type === 'activity' ? <Zap size={20} color="var(--accent)" /> : <MapPin size={20} color="var(--secondary)" />}
                  {place.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {place.photos && place.photos.length > 0 && (
                    <div className="photo-count">
                      <Camera size={14} /> {place.photos.length} souvenirs
                    </div>
                  )}
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '15px 0 20px' }}>{place.description}</p>

                {(user?.role === 'editeur' || user?.role === 'admin') && (
                  <button
                    className="btn-glass"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    onClick={(e) => { e.stopPropagation(); onAddPhoto(place); }}
                  >
                    <Camera size={18} /> Ajouter des souvenirs
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      <AnimatePresence>
        {selectedPlaceDetails && (
          <PlaceDetailsModal
            place={selectedPlaceDetails}
            onClose={() => setSelectedPlaceDetails(null)}
            user={user}
            onPlaceUpdated={fetchPlaces}
            onAddPhoto={(p) => {
              setSelectedPlaceDetails(null);
              onAddPhoto(p);
            }}
            onPhotoDeleted={fetchPlaces}
          />
        )}
      </AnimatePresence>
    </div>
  );
};


const TypeSelector = ({ active, onClick, icon, label }) => (
  <div
    onClick={onClick}
    style={{
      padding: '8px 15px',
      borderRadius: '10px',
      background: active ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
      color: active ? 'white' : 'var(--text-muted)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.9rem',
      transition: 'all 0.3s ease',
      border: active ? '1px solid var(--primary)' : '1px solid transparent'
    }}
  >
    {icon} {label}
  </div>
);

export default PlaceList;
