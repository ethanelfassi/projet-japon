import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle, Circle, MapPin, Camera, Zap, Compass, Trash2 } from 'lucide-react';

const PlaceList = ({ onAddPhoto }) => {
  const [places, setPlaces] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: '', description: '', location: '', type: 'place' });
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);

  useEffect(() => {
    fetchPlaces();
  }, []);

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
      setNewPlace({ name: '', description: '', location: '', type: 'place' });
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

  return (
    <div className="container" style={{ padding: '100px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h2>Bucket List <span style={{ color: 'var(--primary)' }}>Japon</span></h2>
        <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={20} /> Ajouter
        </button>
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
            <form onSubmit={handleAddPlace} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
                <TypeSelector 
                  active={newPlace.type === 'place'} 
                  onClick={() => setNewPlace({...newPlace, type: 'place'})} 
                  icon={<MapPin size={16} />} 
                  label="Lieu" 
                />
                <TypeSelector 
                  active={newPlace.type === 'activity'} 
                  onClick={() => setNewPlace({...newPlace, type: 'activity'})} 
                  icon={<Zap size={16} />} 
                  label="Activité" 
                />
              </div>
              <input 
                type="text" placeholder="Nom (ex: Akihabara ou Faire du Kart)" className="glass" 
                style={{ padding: '12px', color: 'white' }}
                value={newPlace.name} onChange={e => setNewPlace({...newPlace, name: e.target.value})}
                required
              />
              <input 
                type="text" placeholder="Localisation (ex: Tokyo)" className="glass" 
                style={{ padding: '12px', color: 'white' }}
                value={newPlace.location} onChange={e => setNewPlace({...newPlace, location: e.target.value})}
              />
              <textarea 
                placeholder="Description" className="glass" 
                style={{ padding: '12px', color: 'white', gridColumn: 'span 2' }}
                value={newPlace.description} onChange={e => setNewPlace({...newPlace, description: e.target.value})}
              />
              <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Enregistrer</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
        {places.map((place, index) => (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              </div>
              <button 
                onClick={(e) => toggleStatus(e, place.id, place.status)}
                style={{ background: 'none', padding: 0, color: place.status === 'visited' ? '#00ff7f' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                {place.status === 'visited' ? <CheckCircle size={24} /> : <Circle size={24} />}
              </button>
            </div>
            
            <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {place.type === 'activity' ? <Zap size={20} color="var(--accent)" /> : <MapPin size={20} color="var(--secondary)" />}
              {place.name}
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <Compass size={14} /> {place.location || 'Partout'}
              </div>
              {place.photos && place.photos.length > 0 && (
                <div className="photo-count">
                  <Camera size={14} /> {place.photos.length}
                </div>
              )}
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '15px 0 20px' }}>{place.description}</p>
            
            <button 
              className="btn-glass" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              onClick={(e) => { e.stopPropagation(); onAddPhoto(place); }}
            >
              <Camera size={18} /> Ajouter des souvenirs
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPlaceDetails && (
          <PlaceDetailsModal 
            place={selectedPlaceDetails} 
            onClose={() => setSelectedPlaceDetails(null)} 
            onAddPhoto={(p) => {
              setSelectedPlaceDetails(null);
              onAddPhoto(p);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const PlaceDetailsModal = ({ place, onClose, onAddPhoto }) => {
  const [photos, setPhotos] = useState(place.photos || []);

  const handleDeletePhoto = async (id) => {
    if (window.confirm('Supprimer cette photo ?')) {
      try {
        await axios.delete(`/api/photos/${id}`);
        setPhotos(photos.filter(p => p.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass"
        style={{ 
          maxWidth: '800px', width: '100%', padding: '40px', 
          maxHeight: '90vh', overflowY: 'auto', position: 'relative' 
        }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', color: 'white' }}
        >
          <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
        </button>

        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '10px' }}>
            {place.type === 'activity' ? <Zap size={20} /> : <MapPin size={20} />}
            <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>
              {place.type === 'activity' ? 'Activité' : 'Lieu'}
            </span>
          </div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{place.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{place.description}</p>
        </div>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Camera size={20} /> Souvenirs ({photos.length})
            </h3>
            <button className="btn-glass" onClick={() => onAddPhoto(place)} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Plus size={16} /> Ajouter
            </button>
          </div>
          
          {photos.length === 0 ? (
            <div className="empty-state">
              <p>Pas encore de photos pour ce moment.</p>
            </div>
          ) : (
            <div className="details-grid">
              {photos.map(photo => (
                <div key={photo.id} className="details-photo-container photo-card">
                  <button className="delete-btn" onClick={() => handleDeletePhoto(photo.id)}>
                    <Trash2 size={14} />
                  </button>
                  <img 
                    src={photo.url} 
                    alt={photo.caption} 
                    className="details-photo"
                    onClick={() => window.open(photo.url, '_blank')}
                  />
                  {photo.caption && (
                    <p style={{ fontSize: '0.7rem', marginTop: '5px', color: 'var(--text-muted)' }}>{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
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
