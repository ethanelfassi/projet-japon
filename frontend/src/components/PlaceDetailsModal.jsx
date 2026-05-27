import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, MapPin, Zap, Trash2, MessageSquare, Calendar, Pencil, Check, X } from 'lucide-react';

const PlaceDetailsModal = ({ place, onClose, onAddPhoto, onPhotoDeleted, user, onPlaceUpdated }) => {
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Lightbox and comments states
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [comments, setComments] = useState([]);
  const [newCommentTexts, setNewCommentTexts] = useState({});

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [userGroups, setUserGroups] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Edit photo caption states
  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [editCaptionText, setEditCaptionText] = useState('');
  const [isSavingCaption, setIsSavingCaption] = useState(false);

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
      fetchComments();
    }
    return () => {
      active = false;
    };
  }, [place?.id]);

  const fetchComments = async () => {
    try {
      const res = await axios.get('/api/photo-comments');
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e, photoId) => {
    e.preventDefault();
    const text = newCommentTexts[photoId] || '';
    if (!text.trim()) return;

    try {
      const res = await axios.post(`/api/photo-comments/${photoId}`, { text });
      setComments(prev => [...prev, res.data]);
      setNewCommentTexts(prev => ({ ...prev, [photoId]: '' }));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'ajout du commentaire');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`/api/photo-comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression du commentaire');
    }
  };

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

  const handleSavePhotoCaption = async (photoId) => {
    setIsSavingCaption(true);
    try {
      await axios.patch(`/api/photos/${photoId}`, {
        caption: editCaptionText
      });
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption: editCaptionText } : p));
      setEditingPhotoId(null);
      if (onPhotoDeleted) {
        onPhotoDeleted(); // refresh parent count
      }
    } catch (err) {
      console.error("Error updating photo caption:", err);
      alert("Erreur lors de la modification de la description");
    } finally {
      setIsSavingCaption(false);
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
            <form 
              onSubmit={e => { e.preventDefault(); handleSaveEdit(); }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}
            >
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
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                }}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button 
                  type="submit"
                  className="btn-primary" 
                  style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                  disabled={isSaving || !editName.trim()}
                >
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button 
                  type="button"
                  className="btn-glass" 
                  style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Annuler
                </button>
              </div>
            </form>
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
            {(user?.role === 'editeur' || user?.role === 'admin') && (
              <button className="btn-glass" onClick={() => onAddPhoto(place)} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Plus size={16} /> Ajouter
              </button>
            )}
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
                  {photo.media_type === 'video' ? (
                    <video 
                      src={photo.url} 
                      controls 
                      className="details-photo"
                      style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  ) : photo.is_stamp ? (
                    <div 
                      className="stamp-container" 
                      style={{ width: '100%', transform: 'scale(0.8)', cursor: 'pointer' }}
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img src={photo.url} alt={photo.caption} className={`stamp-image ${photo.stamp_style || 'classic'}`} />
                      <div className="postmark" style={{ fontSize: '6px', width: '30px', height: '30px' }}>2026</div>
                    </div>
                  ) : (
                    <img 
                      src={photo.url} 
                      alt={photo.caption} 
                      className="details-photo"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                  )}
                  {editingPhotoId === photo.id ? (
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '5px', width: '100%', padding: '0 5px' }}>
                      <input
                        type="text"
                        className="glass"
                        value={editCaptionText}
                        onChange={e => setEditCaptionText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSavePhotoCaption(photo.id);
                          }
                        }}
                        style={{ fontSize: '0.7rem', padding: '4px 8px', color: 'white', flex: 1 }}
                        autoFocus
                        disabled={isSavingCaption}
                      />
                      <button 
                        onClick={() => handleSavePhotoCaption(photo.id)} 
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex' }}
                        disabled={isSavingCaption}
                      >
                        <Check size={12} />
                      </button>
                      <button 
                        onClick={() => setEditingPhotoId(null)} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                        disabled={isSavingCaption}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', marginTop: '5px', minHeight: '18px', width: '100%', padding: '0 5px' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                        {photo.caption || ((canEdit && isEditing) ? 'Aucune description' : '')}
                      </p>
                      {canEdit && isEditing && (
                        <button 
                          onClick={() => { setEditingPhotoId(photo.id); setEditCaptionText(photo.caption || ''); }} 
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '2px' }}
                          title="Modifier la description"
                        >
                          <Pencil size={10} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Lightbox photo et commentaires */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lightbox-overlay"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="lightbox-container" onClick={e => e.stopPropagation()}>
              <button className="lightbox-close-btn" onClick={() => setSelectedPhoto(null)}>
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>

              <div className="lightbox-image-side">
                {selectedPhoto.is_stamp ? (
                  <div className="stamp-container" style={{ width: '70%' }}>
                    <img src={selectedPhoto.url} alt={selectedPhoto.caption} className={`stamp-image ${selectedPhoto.stamp_style || 'classic'}`} />
                    <div className="postmark">JAPON 2026</div>
                  </div>
                ) : (
                  <img src={selectedPhoto.url} alt={selectedPhoto.caption} className="lightbox-img" />
                )}
              </div>

              <div className="lightbox-details-side">
                <h3 className="lightbox-caption">{selectedPhoto.caption || 'Sans légende'}</h3>
                
                <div className="lightbox-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 600 }}>
                    {place.name}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} color="var(--primary)" /> {place.location || 'Japon'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} color="var(--primary)" /> {new Date(selectedPhoto.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '15px' }}>Commentaires</h4>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', minHeight: 0 }}>
                  <div className="comments-list" style={{ maxHeight: 'none', flex: 1 }}>
                    {comments.filter(c => c.photo_id === selectedPhoto.id).length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                        Aucun commentaire pour le moment. Soyez le premier !
                      </p>
                    ) : (
                      comments.filter(c => c.photo_id === selectedPhoto.id).map(comment => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-content">
                            <span className="comment-author">{comment.username}</span>
                            <span className="comment-text">{comment.text}</span>
                            <span className="comment-date">
                              {new Date(comment.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {(user?.role === 'admin' || user?.id === comment.user_id) && (
                            <button 
                              className="comment-delete-btn"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {user ? (
                    <form onSubmit={(e) => handleAddComment(e, selectedPhoto.id)} className="comment-form" style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid var(--glass-border)' }}>
                      <input
                        type="text"
                        className="comment-input"
                        placeholder="Écrire un commentaire..."
                        value={newCommentTexts[selectedPhoto.id] || ''}
                        onChange={(e) => setNewCommentTexts(prev => ({ ...prev, [selectedPhoto.id]: e.target.value }))}
                        maxLength={500}
                      />
                      <button type="submit" className="comment-submit-btn">
                        Envoyer
                      </button>
                    </form>
                  ) : (
                    <p className="comment-auth-prompt" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '15px' }}>
                      Veuillez vous connecter pour commenter.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PlaceDetailsModal;
