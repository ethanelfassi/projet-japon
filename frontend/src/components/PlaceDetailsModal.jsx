import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, MapPin, Zap, Trash2, Pencil } from 'lucide-react';

const PlaceDetailsModal = ({ place, onClose, onAddPhoto, onPhotoDeleted, user, onPlaceUpdated }) => {
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [userGroups, setUserGroups] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchPhotos = async () => {
      try {
        setLoadingPhotos(true);
        const res = await axios.get(`/api/photos/${place.id}`);
        if (active) {
          setPhotos(res.data);
        }
      } catch (err) {
        console.error("Error fetching photos:", err);
      } finally {
        if (active) {
          setLoadingPhotos(false);
        }
      }
    };

    if (place?.id) {
      fetchPhotos();
    }
    return () => {
      active = false;
    };
  }, [place?.id]);

  useEffect(() => {
    if (user && user.role === 'editeur' && place?.visibility === 'group') {
      axios.get('/api/groups')
        .then(res => setUserGroups(res.data))
        .catch(err => console.error("Error fetching user groups:", err));
    }
  }, [user, place]);

  const canEdit = user && (
    user.role === 'admin' ||
    (user.role === 'editeur' && (
      place.visibility === 'public' ||
      place.created_by === user.id ||
      (place.visibility === 'group' && userGroups.some(g => g.id === place.group_id))
    ))
  );

  const handleStartEdit = () => {
    setEditName(place.name);
    setEditDescription(place.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      await axios.patch(`/api/places/${place.id}`, {
        name: editName,
        description: editDescription
      });
      setIsEditing(false);
      if (onPlaceUpdated) {
        onPlaceUpdated();
      }
    } catch (err) {
      console.error("Error updating place:", err);
      alert("Erreur lors de la modification");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePhoto = async (id) => {
    try {
      await axios.delete(`/api/photos/${id}`);
      setPhotos(photos.filter(p => p.id !== id));
      setConfirmDeleteId(null);
      if (onPhotoDeleted) {
        onPhotoDeleted();
      }
    } catch (err) {
      console.error(err);
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
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', color: 'white', border: 'none', cursor: 'pointer' }}
          title="Fermer"
        >
          <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
        </button>

        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}>
              {place.type === 'activity' ? <Zap size={20} /> : <MapPin size={20} />}
              <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>
                {place.type === 'activity' ? 'Activité' : 'Lieu'}
              </span>
            </div>
            
            {canEdit && !isEditing && (
              <button 
                className="btn-glass" 
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                onClick={handleStartEdit}
              >
                <Pencil size={14} /> Modifier
              </button>
            )}
          </div>

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <input
                type="text"
                className="glass"
                style={{ padding: '10px 15px', color: 'white', width: '100%', fontSize: '1.2rem', fontWeight: 600 }}
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Titre du souvenir"
                required
              />
              <textarea
                className="glass"
                style={{ padding: '12px 15px', color: 'white', width: '100%', minHeight: '100px', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical' }}
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Description..."
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button 
                  className="btn-primary" 
                  style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editName.trim()}
                >
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button 
                  className="btn-glass" 
                  style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{place.name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{place.description}</p>
            </>
          )}
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
          
          {loadingPhotos ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Chargement des souvenirs...
            </div>
          ) : photos.length === 0 ? (
            <div className="empty-state">
              <p>Pas encore de photos pour ce moment.</p>
            </div>
          ) : (
            <div className="details-grid">
              {photos.map(photo => (
                <div key={photo.id} className="details-photo-container photo-card">
                  <button className="delete-btn" onClick={() => setConfirmDeleteId(photo.id)}>
                    <Trash2 size={14} />
                  </button>
                  
                  <AnimatePresence>
                    {confirmDeleteId === photo.id && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                          background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', gap: '10px', zIndex: 20,
                          borderRadius: '12px'
                        }}
                      >
                        <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'white' }}>Supprimer ?</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '4px 10px', fontSize: '0.7rem', background: '#ff4d6d' }}
                            onClick={() => handleDeletePhoto(photo.id)}
                          >
                            Oui
                          </button>
                          <button 
                            className="btn-glass" 
                            style={{ padding: '4px 10px', fontSize: '0.7rem', color: 'white' }}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Non
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {photo.is_stamp ? (
                    <div className="stamp-container" style={{ width: '100%', transform: 'scale(0.8)' }}>
                      <img src={photo.url} alt={photo.caption} className={`stamp-image ${photo.stamp_style || 'classic'}`} />
                      <div className="postmark" style={{ fontSize: '6px', width: '30px', height: '30px' }}>2026</div>
                    </div>
                  ) : (
                    <img 
                      src={photo.url} 
                      alt={photo.caption} 
                      className="details-photo"
                      onClick={() => window.open(photo.url, '_blank')}
                    />
                  )}
                  {photo.caption && (
                    <p style={{ fontSize: '0.7rem', marginTop: '5px', color: 'var(--text-muted)', textAlign: 'center' }}>{photo.caption}</p>
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

export default PlaceDetailsModal;
