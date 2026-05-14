import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

const GroupsManager = ({ user }) => {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, usersRes] = await Promise.all([
        axios.get('/api/groups'),
        axios.get('/api/users')
      ]);
      setGroups(groupsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    try {
      await axios.post('/api/groups', {
        name: newGroupName,
        members: selectedUsers
      });
      setNewGroupName('');
      setSelectedUsers([]);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Chargement...</div>;

  return (
    <div className="container" style={{ padding: '100px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Users size={32} color="var(--primary)" />
        <h2>Mes <span style={{ color: 'var(--primary)' }}>Groupes</span></h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        {/* Créer un groupe */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass" 
          style={{ padding: '30px', borderRadius: '24px' }}
        >
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Plus size={20} color="var(--secondary)" />
            Nouveau Groupe
          </h3>
          <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" 
              placeholder="Nom du groupe (ex: Voyage Japon 2026)" 
              className="glass"
              style={{ width: '100%', padding: '15px', color: 'white', boxSizing: 'border-box' }}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required
            />
            
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Ajouter des membres :</p>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {users.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#ff4d6d' }}>Aucun autre utilisateur inscrit.</p>
                ) : (
                  users.map(u => (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => toggleUserSelection(u.id)}
                      />
                      <span>{u.username}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '15px' }}>
              Créer le groupe
            </button>
          </form>
        </motion.div>

        {/* Liste des groupes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {groups.length === 0 ? (
            <div className="glass" style={{ padding: '30px', textAlign: 'center', borderRadius: '24px', color: 'var(--text-muted)' }}>
              Vous n'êtes dans aucun groupe pour le moment.
            </div>
          ) : (
            groups.map(group => (
              <motion.div 
                key={group.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass" 
                style={{ padding: '20px', borderRadius: '20px', borderLeft: '4px solid var(--primary)' }}
              >
                <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>{group.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  ID du groupe : {group.id}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupsManager;
