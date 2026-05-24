import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Image as ImageIcon, Bookmark, Trash2, MessageSquare } from 'lucide-react';

const PhotoAlbum = ({ user }) => {
  const [photos, setPhotos] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'photos', 'stamps'
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [comments, setComments] = useState([]);
  const [expandedComments, setExpandedComments] = useState({});
  const [newCommentTexts, setNewCommentTexts] = useState({});

  useEffect(() => {
    fetchPhotos();
    fetchComments();
  }, []);

  const fetchPhotos = async () => {
    try {
      const res = await axios.get('/api/photos');
      setPhotos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

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

  const toggleComments = (photoId) => {
    setExpandedComments(prev => ({
      ...prev,
      [photoId]: !prev[photoId]
    }));
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/photos/${id}`);
      setConfirmDeleteId(null);
      fetchPhotos();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
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
               {(user?.role === 'editeur' || user?.role === 'admin') && (
                 <button
                   className="delete-btn"
                   onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(photo.id); }}
                   title="Supprimer la photo"
                 >
                   <Trash2 size={16} />
                 </button>
               )}

               <AnimatePresence>
                 {confirmDeleteId === photo.id && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 10 }}
                     style={{
                       position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                       background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
                       alignItems: 'center', justifyContent: 'center', gap: '15px', zIndex: 20,
                       borderRadius: photo.is_stamp ? '0' : '15px'
                     }}
                     onClick={(e) => e.stopPropagation()}
                   >
                     <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>Supprimer ?</p>
                     <div style={{ display: 'flex', gap: '10px' }}>
                       <button 
                         className="btn-primary" 
                         style={{ padding: '5px 15px', fontSize: '0.8rem', background: '#ff4d6d' }}
                         onClick={() => handleDelete(photo.id)}
                       >
                         Oui
                       </button>
                       <button 
                         className="btn-glass" 
                         style={{ padding: '5px 15px', fontSize: '0.8rem', color: 'white' }}
                         onClick={() => setConfirmDeleteId(null)}
                       >
                         Non
                       </button>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
              {photo.is_stamp ? (
                <div className="stamp-container" style={{ width: '100%' }}>
                  <img src={photo.url} alt={photo.caption} className={`stamp-image ${photo.stamp_style || 'classic'}`} />
                  <div className="postmark">JAPON 2026</div>
                  <div style={{ marginTop: '15px', padding: '0 10px 10px' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#333', marginBottom: '5px' }}>{photo.place_name}</p>
                    {photo.caption && (
                      <p style={{ fontSize: '0.75rem', color: '#555', fontStyle: 'italic', marginBottom: '8px' }}>"{photo.caption}"</p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#777', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '5px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={10} /> {photo.place_location || 'Japon'}
                      </span>
                      <span>{new Date(photo.created_at).toLocaleDateString()}</span>
                    </div>
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
                    <p style={{ fontWeight: 700, marginBottom: '8px', fontSize: '1.05rem' }}>{photo.caption || 'Sans légende'}</p>
                    <p style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>{photo.place_name}</p>
                    
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px',
                      color: 'var(--text-muted)', 
                      fontSize: '0.85rem',
                      borderTop: '1px solid var(--glass-border)',
                      paddingTop: '12px'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} color="var(--primary)" /> {photo.place_location || 'Localisation inconnue'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} color="var(--primary)" /> {new Date(photo.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </>
              )}
              <PhotoComments
                photoId={photo.id}
                comments={comments}
                user={user}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                expanded={!!expandedComments[photo.id]}
                onToggle={() => toggleComments(photo.id)}
                newCommentText={newCommentTexts[photo.id]}
                setNewCommentText={(val) => setNewCommentTexts(prev => ({ ...prev, [photo.id]: val }))}
                isStamp={!!photo.is_stamp}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const PhotoComments = ({ 
  photoId, 
  comments, 
  user, 
  onAddComment, 
  onDeleteComment, 
  expanded, 
  onToggle, 
  newCommentText, 
  setNewCommentText,
  isStamp
}) => {
  const photoComments = comments.filter(c => c.photo_id === photoId);
  
  return (
    <div 
      className="photo-comments-section" 
      style={{ 
        borderTop: (expanded && !isStamp) ? '1px solid var(--glass-border)' : 'none',
        background: isStamp ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.2)',
        borderRadius: isStamp ? '12px' : '0 0 15px 15px',
        marginTop: isStamp ? '12px' : '0',
        border: isStamp ? '1px solid var(--glass-border)' : 'none'
      }}
    >
      <button 
        className="comments-header-btn" 
        onClick={onToggle}
      >
        <MessageSquare size={14} color={photoComments.length > 0 ? "var(--primary)" : "currentColor"} />
        <span>
          {photoComments.length === 0 
            ? "Ajouter un commentaire" 
            : `${photoComments.length} commentaire${photoComments.length > 1 ? 's' : ''}`
          }
        </span>
      </button>

      {expanded && (
        <>
          {photoComments.length > 0 && (
            <div className="comments-list">
              {photoComments.map(comment => (
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
                      onClick={() => onDeleteComment(comment.id)}
                      title="Supprimer le commentaire"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {user ? (
            <form onSubmit={(e) => onAddComment(e, photoId)} className="comment-form">
              <input
                type="text"
                className="comment-input"
                placeholder="Écrire un commentaire..."
                value={newCommentText || ''}
                onChange={(e) => setNewCommentText(e.target.value)}
                maxLength={500}
              />
              <button type="submit" className="comment-submit-btn">
                Envoyer
              </button>
            </form>
          ) : (
            <p className="comment-auth-prompt">
              Veuillez vous connecter pour commenter.
            </p>
          )}
        </>
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
