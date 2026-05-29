import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, User, Ban, Users, Trash2, Camera, MapPin, Plus, X } from 'lucide-react';

const ROLE_LABELS = { visiteur: 'Visiteur', editeur: 'Editeur', admin: 'Admin' };
const ROLE_COLORS = { visiteur: '#888', editeur: 'var(--primary)', admin: '#ffd700' };

const AdminPanel = ({ currentUser }) => {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [addMemberGroupId, setAddMemberGroupId] = useState(null);
  const [addMemberUserId, setAddMemberUserId] = useState('');

  // User creation form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('visiteur');
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  useEffect(() => { fetchUsers(); fetchGroups(); fetchAllUsers(); }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreatingUser(true);
    try {
      await axios.post('/api/admin/users', {
        username: newUsername,
        password: newPassword,
        role: newRole
      });
      setCreateSuccess('Utilisateur créé avec succès !');
      setNewUsername('');
      setNewPassword('');
      setNewRole('visiteur');
      fetchUsers();
      fetchAllUsers();
      setTimeout(() => {
        setShowCreateForm(false);
        setCreateSuccess('');
      }, 1500);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setCreatingUser(false);
    }
  };

  const fetchUsers = async () => {
    try { const res = await axios.get('/api/admin/users'); setUsers(res.data); } catch (err) { console.error(err); }
  };

  const fetchGroups = async () => {
    try { const res = await axios.get('/api/admin/groups'); setGroups(res.data); } catch (err) { console.error(err); }
  };

  const fetchAllUsers = async () => {
    try { const res = await axios.get('/api/users'); setAllUsers(res.data); } catch (err) { console.error(err); }
  };

  const changeRole = async (userId, role) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/role`, { role });
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
    } catch { alert('Erreur lors du changement de rôle'); }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Supprimer cet utilisateur ? Attention, cette action supprimera également tous ses lieux, photos, commentaires et groupes créés.')) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    } catch { alert('Erreur lors de la suppression de l\'utilisateur'); }
  };

  const deleteGroup = async (groupId) => {
    if (!confirm('Supprimer ce groupe ?')) return;
    try {
      await axios.delete(`/api/admin/groups/${groupId}`);
      setGroups(groups.filter(g => g.id !== groupId));
    } catch { alert('Erreur'); }
  };

  const removeMember = async (groupId, userId) => {
    try {
      await axios.delete(`/api/groups/${groupId}/members/${userId}`);
      fetchGroups();
    } catch { alert('Erreur'); }
  };

  const addMember = async (groupId) => {
    if (!addMemberUserId) return;
    try {
      await axios.post(`/api/groups/${groupId}/members`, { userId: parseInt(addMemberUserId) });
      setAddMemberGroupId(null);
      setAddMemberUserId('');
      fetchGroups();
    } catch { alert('Erreur'); }
  };

  return (
    <div className="container" style={{ padding: '100px 20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2>Panel <span style={{ color: 'var(--primary)' }}>Admin</span></h2>
      </div>

      {/* Tabs */}
      <div className="glass" style={{ display: 'inline-flex', borderRadius: '12px', padding: '4px', gap: '4px', marginBottom: '30px' }}>
        {[['users', <User size={15} />, 'Utilisateurs'], ['groups', <Users size={15} />, 'Groupes']].map(([v, icon, label]) => (
          <button key={v} onClick={() => setTab(v)} style={{ background: tab === v ? 'var(--primary)' : 'none', border: 'none', borderRadius: '8px', color: 'white', padding: '8px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)} 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '10px 20px' }}
            >
              <Plus size={16} /> Créer un utilisateur
            </button>
          </div>

          {showCreateForm && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="glass" 
              style={{ padding: '25px', borderRadius: '16px', marginBottom: '20px', borderLeft: '4px solid var(--primary)' }}
            >
              <h4 style={{ marginBottom: '15px' }}>Nouvel utilisateur</h4>
              {createError && (
                <div style={{ background: 'rgba(255, 77, 109, 0.15)', color: '#ff4d6d', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px' }}>
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div style={{ background: 'rgba(0, 255, 127, 0.15)', color: '#00ff7f', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px' }}>
                  {createSuccess}
                </div>
              )}
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <input 
                      type="text" 
                      placeholder="Nom d'utilisateur" 
                      className="glass"
                      style={{ width: '100%', padding: '10px 15px', color: 'white', boxSizing: 'border-box', borderRadius: '10px' }}
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <input 
                      type="password" 
                      placeholder="Mot de passe" 
                      className="glass"
                      style={{ width: '100%', padding: '10px 15px', color: 'white', boxSizing: 'border-box', borderRadius: '10px' }}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ minWidth: '150px' }}>
                    <select 
                      className="glass" 
                      style={{ width: '100%', padding: '10px 15px', color: 'white', background: 'none', boxSizing: 'border-box', borderRadius: '10px' }}
                      value={newRole}
                      onChange={e => setNewRole(e.target.value)}
                    >
                      <option value="visiteur" style={{ color: 'black' }}>Visiteur</option>
                      <option value="editeur" style={{ color: 'black' }}>Editeur</option>
                      <option value="admin" style={{ color: 'black' }}>Admin</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }} disabled={creatingUser}>
                    {creatingUser ? 'Création...' : 'Créer'}
                  </button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className="btn-glass" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {users.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {u.role === 'admin' ? <Shield size={18} color="#ffd700" /> : <User size={18} />}
                </div>
                <div>
                  <p style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {u.username}
                    {u.id === currentUser.id && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(vous)</span>}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: ROLE_COLORS[u.role], fontWeight: 600 }}>{ROLE_LABELS[u.role]}</p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '3px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={10} />{u.places_count} lieux</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}><Camera size={10} />{u.photos_count} médias</span>
                  </div>
                </div>
              </div>

              {u.id !== currentUser.id && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {['visiteur', 'editeur', 'admin'].map(role => (
                    <button key={role} onClick={() => changeRole(u.id, role)}
                      className={u.role === role ? 'btn-primary' : 'btn-glass'}
                      style={{ padding: '5px 12px', fontSize: '0.75rem', opacity: u.role === role ? 1 : 0.6, color: u.role === role ? 'white' : ROLE_COLORS[role] }}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                  <button onClick={() => deleteUser(u.id)}
                    style={{ padding: '5px 12px', fontSize: '0.75rem', background: 'rgba(255,50,50,0.15)', border: 'none', borderRadius: '8px', color: '#ff5050', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
                  >
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* GROUPS TAB */}
      {tab === 'groups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {groups.length === 0 && (
            <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '16px' }}>Aucun groupe.</div>
          )}
          {groups.map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass" style={{ padding: '20px 24px', borderRadius: '16px', borderLeft: '4px solid var(--primary)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{g.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>Créé par <strong>{g.creator_name}</strong></p>
                </div>
                <button onClick={() => deleteGroup(g.id)} style={{ background: 'rgba(255,50,50,0.15)', border: 'none', borderRadius: '8px', color: '#ff5050', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600 }}>
                  <Trash2 size={13} /> Supprimer
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {(g.members || []).map(m => (
                  <span key={m.id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', padding: '3px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {m.username}
                    <button onClick={() => removeMember(g.id, m.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>

              {addMemberGroupId === g.id ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select className="glass" style={{ padding: '6px 10px', color: 'white', fontSize: '0.8rem', flex: 1 }} value={addMemberUserId} onChange={e => setAddMemberUserId(e.target.value)}>
                    <option value="" style={{ color: 'black' }}>Choisir un utilisateur...</option>
                    {allUsers.filter(u => !(g.members || []).some(m => m.id === u.id)).map(u => (
                      <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.username}</option>
                    ))}
                  </select>
                  <button onClick={() => addMember(g.id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>Ajouter</button>
                  <button onClick={() => setAddMemberGroupId(null)} className="btn-glass" style={{ padding: '6px 10px' }}><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => setAddMemberGroupId(g.id)} className="btn-glass" style={{ fontSize: '0.78rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Plus size={13} /> Ajouter un membre
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
