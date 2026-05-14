import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle, Circle, MapPin, Camera } from 'lucide-react';

const PlaceList = ({ onAddPhoto }) => {
  const [places, setPlaces] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: '', description: '', location: '' });

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const res = await axios.get('/api/places');
      setPlaces(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPlace = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/places', newPlace);
      setNewPlace({ name: '', description: '', location: '' });
      setShowAdd(false);
      fetchPlaces();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
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
          <Plus size={20} /> Ajouter un lieu
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
              <input 
                type="text" placeholder="Nom du lieu" className="glass" 
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
            className="glass"
            style={{ padding: '25px', position: 'relative' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <span style={{ 
                fontSize: '0.8rem', 
                background: place.status === 'visited' ? 'rgba(0, 255, 127, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: place.status === 'visited' ? '#00ff7f' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: '20px',
                fontWeight: 600
              }}>
                {place.status === 'visited' ? 'Visité' : 'À faire'}
              </span>
              <button 
                onClick={() => toggleStatus(place.id, place.status)}
                style={{ background: 'none', padding: 0, color: place.status === 'visited' ? '#00ff7f' : 'var(--text-muted)' }}
              >
                {place.status === 'visited' ? <CheckCircle size={24} /> : <Circle size={24} />}
              </button>
            </div>
            
            <h3 style={{ marginBottom: '10px' }}>{place.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>
              <MapPin size={14} /> {place.location}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px' }}>{place.description}</p>
            
            <button 
              className="btn-glass" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              onClick={() => onAddPhoto(place)}
            >
              <Camera size={18} /> Ajouter des photos
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PlaceList;
