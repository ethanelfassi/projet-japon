import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { X, Lock, KeyRound } from 'lucide-react';

const ChangePasswordModal = ({ onClose }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit faire au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/change-password', {
        oldPassword,
        newPassword
      });
      setSuccess(res.data.message);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
      padding: '20px'
    }} onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass"
        style={{ width: '100%', maxWidth: '400px', padding: '30px', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', color: 'white', border: 'none', cursor: 'pointer' }}
          title="Fermer"
        >
          <X size={20} />
        </button>

        <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <KeyRound size={20} color="var(--primary)" /> Modifier le mot de passe
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Saisis ton mot de passe actuel pour définir le nouveau.
        </p>

        {error && (
          <div style={{ background: 'rgba(255, 77, 109, 0.15)', color: '#ff4d6d', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(0, 255, 127, 0.15)', color: '#00ff7f', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Mot de passe actuel" 
              className="glass"
              style={{ width: '100%', padding: '10px 12px 10px 38px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }}
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Nouveau mot de passe" 
              className="glass"
              style={{ width: '100%', padding: '10px 12px 10px 38px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Confirmer le nouveau mot de passe" 
              className="glass"
              style={{ width: '100%', padding: '10px 12px 10px 38px', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box' }}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ padding: '10px 15px', fontSize: '0.9rem', width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Modification...' : 'Enregistrer'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ChangePasswordModal;
