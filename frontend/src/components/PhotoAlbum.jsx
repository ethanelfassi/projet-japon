import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Image as ImageIcon, Bookmark, Trash2 } from 'lucide-react';

const PhotoAlbum = () => {
  const [photos, setPhotos] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'photos', 'stamps'

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

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Es-tu sûr de vouloir supprimer cette photo ?')) {
      try {
        await axios.delete(`/api/photos/${id}`);
        fetchPhotos();
      } catch (err) {
        console.error(err);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const filteredPhotos = photos.filter(p => {
    if (filter === 'photos') return p.is_stamp === 0;
    if (filter === 'stamps') return p.is_stamp === 1;
    return true;
  });

  return (
    <div className="container" style={{ padding: '100px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ marginBottom: '10px' }}>Album Photo de <span style={{ color: 'var(--primary)' }}>l'Aventure</span></h2>
          <p style={{ color: 'var(--text-muted)' }}>Nos souvenirs capturés au fil du voyage.</p>
        </div>
        
        <div className="glass" style={{ display: 'flex', padding: '5px' }}>
          <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} icon={<ImageIcon size={16} />} label="Tout" />
          <FilterBtn active={filter === 'photos'} onClick={() => setFilter('photos')} icon={<ImageIcon size={16} />} label="Photos" />
          <FilterBtn active={filter === 'stamps'} onClick={() => setFilter('stamps')} icon={<Bookmark size={16} />} label="Timbres" />
        </div>
      </div>
      
      {filteredPhotos.length === 0 ? (
        <div className="glass" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Pas encore de {filter === 'stamps' ? 'timbres' : 'photos'} dans cette catégorie.</p>
        </div>
      ) : (
        <div style={{ 
          columns: filter === 'stamps' ? '4 200px' : '3 300px',
          columnGap: '20px',
        }}>
          {filteredPhotos.map((photo, index) => (
            <motion.div 
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
               style={{ 
                 marginBottom: '20px', 
                 overflow: photo.is_stamp ? 'visible' : 'hidden', 
                 breakInside: 'avoid',
                 display: 'inline-block',
                 width: '100%',
                 padding: photo.is_stamp ? '0' : '0'
               }}
               className={photo.is_stamp ? "photo-card" : "glass photo-card"}
             >
               <button 
                 className="delete-btn" 
                 onClick={(e) => handleDelete(e, photo.id)}
                 title="Supprimer la photo"
               >
                 <Trash2 size={16} />
               </button>
              {photo.is_stamp ? (
                <div className="stamp-container" style={{ width: '100%' }}>
                  <img src={photo.url} alt={photo.caption} className="stamp-image" />
                  <div className="postmark">JAPON 2026</div>
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#333' }}>{photo.place_name}</p>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterBtn = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    style={{
      background: active ? 'var(--primary)' : 'transparent',
      color: active ? 'white' : 'var(--text-muted)',
      padding: '8px 15px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '0.9rem'
    }}
  >
    {icon} {label}
  </button>
);

export default PhotoAlbum;
