import React, { useState } from 'react';
import axios from 'axios';
import { User, Lock, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Auth = ({ setUser, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(endpoint, formData);
      
      // Save token
      localStorage.setItem('token', res.data.token);
      
      // Set user state in App.jsx
      setUser(res.data.user);
      onAuthSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '100px 20px', maxWidth: '500px', margin: '0 auto' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass" 
        style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}
      >
        <h2 style={{ marginBottom: '10px', fontSize: '2rem' }}>
          {isLogin ? 'Bon retour' : 'Rejoindre'} <span style={{ color: 'var(--primary)' }}>Japon</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
          {isLogin ? 'Connecte-toi pour gérer ta bucket list et tes groupes.' : 'Crée un compte pour collaborer avec tes amis.'}
        </p>

        {error && (
          <div style={{ background: 'rgba(255, 77, 109, 0.2)', color: '#ff4d6d', padding: '10px', borderRadius: '10px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <User size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Nom d'utilisateur" 
              className="glass"
              style={{ width: '100%', padding: '15px 15px 15px 45px', color: 'white', boxSizing: 'border-box' }}
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Mot de passe" 
              className="glass"
              style={{ width: '100%', padding: '15px 15px 15px 45px', color: 'white', boxSizing: 'border-box' }}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '15px' }} disabled={loading}>
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div style={{ marginTop: '30px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {isLogin ? "Tu n'as pas de compte ?" : 'Tu as déjà un compte ?'}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, marginLeft: '10px', cursor: 'pointer' }}
          >
            {isLogin ? "S'inscrire" : 'Se connecter'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
