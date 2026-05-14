import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check } from 'lucide-react';

const UploadModal = ({ place, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [isStamp, setIsStamp] = useState(false);
  const [stampStyle, setStampStyle] = useState('classic');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('place_id', place.id);
    formData.append('caption', caption);
    formData.append('is_stamp', isStamp ? 'true' : 'false');
    formData.append('stamp_style', stampStyle);

    try {
      await axios.post('/api/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  const STYLES = [
    { id: 'classic', label: 'Classique', icon: '◻️' },
    { id: 'circle', label: 'Tampon', icon: '⚪' },
    { id: 'hex', label: 'Hexagone', icon: '⬢' },
    { id: 'wavy', label: 'Vague', icon: '〰️' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass"
        style={{ width: '100%', maxWidth: '500px', padding: '40px', position: 'relative' }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', color: 'white' }}
        >
          <X size={24} />
        </button>

        <h2 style={{ marginBottom: '10px' }}>Souvenir de <span style={{ color: 'var(--primary)' }}>{place.name}</span></h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Partagez un moment inoubliable avec vos amis.</p>

        {!success ? (
          <form onSubmit={handleUpload}>
            <div style={{ 
              border: '2px dashed var(--glass-border)', 
              borderRadius: '15px', 
              padding: '40px', 
              textAlign: 'center',
              marginBottom: '20px',
              cursor: 'pointer',
              background: file ? 'rgba(255, 77, 109, 0.05)' : 'none'
            }} onClick={() => document.getElementById('file-input').click()}>
              {file ? (
                <div>
                  <Check size={40} color="#00ff7f" />
                  <p style={{ marginTop: '10px' }}>{file.name}</p>
                </div>
              ) : (
                <>
                  <Upload size={40} color="var(--text-muted)" />
                  <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>Cliquez pour choisir une photo</p>
                </>
              )}
              <input 
                id="file-input" type="file" hidden accept="image/*"
                onChange={e => setFile(e.target.files[0])}
              />
            </div>

            <textarea 
              placeholder="Une petite légende..."
              className="glass"
              style={{ width: '100%', padding: '15px', color: 'white', marginBottom: '20px' }}
              value={caption}
              onChange={e => setCaption(e.target.value)}
            />

            <div style={{ marginBottom: '25px' }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', cursor: 'pointer' }} 
                onClick={() => setIsStamp(!isStamp)}
              >
                <div style={{ 
                  width: '20px', height: '20px', borderRadius: '4px', 
                  border: '2px solid var(--primary)', 
                  background: isStamp ? 'var(--primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isStamp && <Check size={14} color="white" />}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Transformer en timbre de collection</span>
              </div>

              {isStamp && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', overflow: 'hidden' }}
                >
                  {STYLES.map(s => (
                    <div 
                      key={s.id}
                      onClick={() => setStampStyle(s.id)}
                      style={{
                        padding: '10px 5px',
                        borderRadius: '8px',
                        background: stampStyle === s.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        border: stampStyle === s.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{s.icon}</div>
                      <div style={{ fontSize: '0.7rem' }}>{s.label}</div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', padding: '15px' }}
              disabled={uploading || !file}
            >
              {uploading ? 'Envoi en cours...' : 'Publier le souvenir'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ background: '#00ff7f', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}
            >
              <Check size={40} color="black" />
            </motion.div>
            <h3>Souvenir partagé !</h3>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UploadModal;
