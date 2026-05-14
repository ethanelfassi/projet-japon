import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MapPin, Calendar } from 'lucide-react';

const PhotoAlbum = () => {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const res = await axios.get('/api/photos');
      setPhotos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ padding: '100px 20px' }}>
      <h2 style={{ marginBottom: '40px' }}>Album Photo de <span style={{ color: 'var(--primary)' }}>l'Aventure</span></h2>
      
      {photos.length === 0 ? (
        <div className="glass" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Pas encore de photos. Allez explorer le Japon !</p>
        </div>
      ) : (
        <div style={{ 
          columns: '3 300px',
          columnGap: '20px',
        }}>
          {photos.map((photo, index) => (
            <motion.div 
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="glass"
              style={{ 
                marginBottom: '20px', 
                overflow: 'hidden', 
                breakInside: 'avoid',
                display: 'inline-block',
                width: '100%'
              }}
            >
              <img 
                src={photo.url} 
                alt={photo.caption} 
                style={{ width: '100%', display: 'block', borderBottom: '1px solid var(--glass-border)' }} 
              />
              <div style={{ padding: '20px' }}>
                <p style={{ fontWeight: 600, marginBottom: '10px' }}>{photo.caption}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={12} /> {photo.place_name}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={12} /> {new Date(photo.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoAlbum;
