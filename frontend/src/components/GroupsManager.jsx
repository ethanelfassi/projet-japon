import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, UserPlus, Trash2, LogOut, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GroupsManager = ({ user }) => {
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [addMemberGroupId, setAddMemberGroupId] = useState(null);
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [gRes, uRes] = await Promise.all([axios.get('/api/groups'), axios.get('/api/users')]);
      setGroups(gRes.data);
      setAllUsers(uRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      await axios.post('/api/groups', { name: newGroupName });
      setNewGroupName('');
      setCreating(false);
      fetchData();
    } catch { alert('Erreur lors de la création'); }
  };

  const joinGroup = async (groupId) => {
    try {
      await axios.post(`/api/groups/${groupId}/members`, { userId: user.id });
      fetchData();
    } catch { alert('Erreur'); }
  };

  const leaveGroup = async (groupId) => {
    try {
      await axios.post(`/api/groups/${groupId}/leave`);
      fetchData();
    } catch { alert('Erreur'); }
  };

  const deleteGroup = async (groupId) => {
    if (!confirm('Supprimer ce groupe ?')) return;
    try {
      await axios.delete(`/api/groups/${groupId}`);
      fetchData();
    } catch { alert('Erreur'); }
  };

  const removeMember = async (groupId, userId) => {
    try {
      await axios.delete(`/api/groups/${groupId}/members/${userId}`);
      fetchData();
    } catch { alert('Erreur'); }
  };

  const addMember = async (groupId) => {
    if (!addMemberUserId) return;
    try {
      await axios.post(`/api/groups/${groupId}/members`, { userId: parseInt(addMemberUserId) });
      setAddMemberGroupId(null);
      setAddMemberUserId('');
      fetchData();
    } catch { alert('Erreur'); }
  };

  const toggleExpand = (groupId) => setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));

  const isMember = (g) => (g.members || []).some(m => m.id === user.id);
  const isOwner = (g) => g.created_by === user.id;
  const isAdmin = user.role === 'admin';
  const canManageMembers = (g) => isOwner(g) || isAdmin || user.role === 'editeur';
  const canDelete = (g) => isOwner(g) || isAdmin;

  const myGroups = groups.filter(g => isMember(g));
  const otherGroups = groups.filter(g => !isMember(g));

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Chargement...</div>;

  return (
    <div className="container" style={{ padding: '100px 20px', maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={28} color="var(--primary)" />
          Mes <span style={{ color: 'var(--primary)' }}>&nbsp;Groupes</span>
        </h2>
        <button onClick={() => setCreating(!creating)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
          <Plus size={16} /> Nouveau groupe
        </button>
      </div>

      {/* Create group form */}
      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="glass" style={{ padding: '24px', borderRadius: '16px', marginBottom: '28px', borderLeft: '4px solid var(--primary)' }}
          >
            <form onSubmit={createGroup} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Nom du groupe..." className="glass"
                style={{ flex: 1, minWidth: '200px', padding: '12px 16px', color: 'white', borderRadius: '10px' }}
                value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required autoFocus
              />
              <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }}>Créer</button>
              <button type="button" onClick={() => setCreating(false)} className="btn-glass" style={{ padding: '12px 14px' }}><X size={16} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My groups */}
      {myGroups.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '14px', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mes groupes ({myGroups.length})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {myGroups.map((g, i) => (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass" style={{ padding: '20px 24px', borderRadius: '16px', borderLeft: '4px solid var(--primary)' }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>{g.name}</p>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                      Créé par <strong>{g.creator_name}</strong> · {(g.members || []).length} membre{(g.members || []).length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {canDelete(g) && (
                      <button onClick={() => deleteGroup(g.id)} style={{ background: 'rgba(255,50,50,0.15)', border: 'none', borderRadius: '8px', color: '#ff5050', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600 }}>
                        <Trash2 size={13} /> Supprimer
                      </button>
                    )}
                    {!isOwner(g) && (
                      <button onClick={() => leaveGroup(g.id)} style={{ background: 'rgba(255,200,0,0.12)', border: 'none', borderRadius: '8px', color: '#ffd700', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600 }}>
                        <LogOut size={13} /> Quitter
                      </button>
                    )}
                    <button onClick={() => toggleExpand(g.id)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', padding: '6px 10px' }}>
                      {expandedGroups[g.id] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Expanded: members + add member */}
                <AnimatePresence>
                  {expandedGroups[g.id] && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {(g.members || []).map(m => (
                            <span key={m.id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', padding: '4px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {m.username}
                              {m.id === user.id && <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>(vous)</span>}
                              {(isOwner(g) || isAdmin) && m.id !== user.id && (
                                <button onClick={() => removeMember(g.id, m.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                                  <X size={11} />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>

                        {canManageMembers(g) && (
                          addMemberGroupId === g.id ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <select className="glass" style={{ padding: '7px 10px', color: 'white', fontSize: '0.8rem', flex: 1 }}
                                value={addMemberUserId} onChange={e => setAddMemberUserId(e.target.value)}
                              >
                                <option value="" style={{ color: 'black' }}>Choisir un utilisateur...</option>
                                {allUsers.filter(u => !(g.members || []).some(m => m.id === u.id)).map(u => (
                                  <option key={u.id} value={u.id} style={{ color: 'black' }}>{u.username}</option>
                                ))}
                              </select>
                              <button onClick={() => addMember(g.id)} className="btn-primary" style={{ padding: '7px 14px', fontSize: '0.8rem' }}>Ajouter</button>
                              <button onClick={() => setAddMemberGroupId(null)} className="btn-glass" style={{ padding: '7px 10px' }}><X size={14} /></button>
                            </div>
                          ) : (
                            <button onClick={() => { setAddMemberGroupId(g.id); setAddMemberUserId(''); }} className="btn-glass"
                              style={{ fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <UserPlus size={13} /> Ajouter un membre
                            </button>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {myGroups.length === 0 && !creating && (
        <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '16px', marginBottom: '40px' }}>
          Vous n'êtes dans aucun groupe. Créez-en un ou rejoignez-en un ci-dessous.
        </div>
      )}

      {/* Other groups to join */}
      {otherGroups.length > 0 && (
        <div>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '14px', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rejoindre un groupe ({otherGroups.length})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {otherGroups.map((g, i) => (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass" style={{ padding: '18px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}
              >
                <div>
                  <p style={{ fontWeight: 700, margin: 0 }}>{g.name}</p>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                    Créé par <strong>{g.creator_name}</strong> · {(g.members || []).length} membre{(g.members || []).length > 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={() => joinGroup(g.id)} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <UserPlus size={14} /> Rejoindre
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsManager;
