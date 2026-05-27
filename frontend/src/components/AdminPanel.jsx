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

  useEffect(() => { fetchUsers(); fetchGroups(); fetchAllUsers(); }, []);

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

  const toggleBan = async (userId, banned) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/ban`, { banned: !banned });
      setUsers(users.map(u => u.id === userId ? { ...u, banned: !banned } : u));
    } catch { alert('Erreur'); }
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
          {users.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', opacity: u.banned ? 0.5 : 1 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {u.role === 'admin' ? <Shield size={18} color="#ffd700" /> : <User size={18} />}
                </div>
                <div>
                  <p style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {u.username}
                    {u.id === currentUser.id && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(vous)</span>}
                    {u.banned && <span style={{ background: 'rgba(255,50,50,0.2)', color: '#ff5050', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '6px', fontWeight: 700 }}>BANNI</span>}
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
                  <button onClick={() => toggleBan(u.id, u.banned)}
                    style={{ padding: '5px 12px', fontSize: '0.75rem', background: u.banned ? 'rgba(0,255,127,0.15)' : 'rgba(255,50,50,0.15)', border: 'none', borderRadius: '8px', color: u.banned ? '#00ff7f' : '#ff5050', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
                  >
                    <Ban size={13} />{u.banned ? 'Débannir' : 'Bannir'}
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
