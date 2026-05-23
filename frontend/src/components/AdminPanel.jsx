import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, User, Edit3 } from 'lucide-react';

const ROLE_LABELS = { visiteur: 'Visiteur', editeur: 'Editeur', admin: 'Admin' };
const ROLE_COLORS = { visiteur: '#888', editeur: 'var(--primary)', admin: '#ffd700' };

const AdminPanel = ({ currentUser }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const changeRole = async (userId, role) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/role`, { role });
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err) {
      alert('Erreur lors du changement de rôle');
    }
  };

  return (
    <div className="container" style={{ padding: '100px 20px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h2>Panel <span style={{ color: 'var(--primary)' }}>Admin</span></h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Gère les rôles des utilisateurs.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {users.map((u, i) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass"
            style={{ padding: '20px 25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {u.role === 'admin' ? <Shield size={18} color="#ffd700" /> : <User size={18} />}
              </div>
              <div>
                <p style={{ fontWeight: 700 }}>{u.username} {u.id === currentUser.id && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(vous)</span>}</p>
                <p style={{ fontSize: '0.8rem', color: ROLE_COLORS[u.role], fontWeight: 600 }}>{ROLE_LABELS[u.role]}</p>
              </div>
            </div>

            {u.id !== currentUser.id && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {['visiteur', 'editeur', 'admin'].map(role => (
                  <button
                    key={role}
                    onClick={() => changeRole(u.id, role)}
                    className={u.role === role ? 'btn-primary' : 'btn-glass'}
                    style={{
                      padding: '6px 14px', fontSize: '0.8rem',
                      opacity: u.role === role ? 1 : 0.6,
                      color: u.role === role ? 'white' : ROLE_COLORS[role]
                    }}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;
