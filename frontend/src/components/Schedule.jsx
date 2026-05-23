import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, Trash2, Calendar } from 'lucide-react';

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

const toDateStr = (date) => date.toISOString().split('T')[0];

const formatDayHeader = (date) => {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
};

const Schedule = ({ user }) => {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [items, setItems] = useState([]);
  const [places, setPlaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', time_start: '', time_end: '', place_id: '' });

  const canEdit = user && (user.role === 'editeur' || user.role === 'admin');

  useEffect(() => {
    fetchItems();
    fetchPlaces();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get('/api/itinerary');
      setItems(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchPlaces = async () => {
    try {
      const res = await axios.get('/api/places');
      setPlaces(res.data);
    } catch (err) { console.error(err); }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const itemsForDay = (date) => {
    const str = toDateStr(date);
    return items.filter(item => item.date === str);
  };

  const handleAdd = (date) => {
    setSelectedDate(toDateStr(date));
    setForm({ title: '', description: '', time_start: '', time_end: '', place_id: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/itinerary', { ...form, date: selectedDate });
      await fetchItems();
      setShowModal(false);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/itinerary/${id}`);
      setItems(items.filter(i => i.id !== id));
    } catch (err) { console.error(err); }
  };

  const weekLabel = () => {
    const end = addDays(weekStart, 6);
    const s = weekStart;
    if (s.getMonth() === end.getMonth()) {
      return `${s.getDate()} – ${end.getDate()} ${MONTHS_FR[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${s.getDate()} ${MONTHS_FR[s.getMonth()]} – ${end.getDate()} ${MONTHS_FR[end.getMonth()]} ${s.getFullYear()}`;
  };

  const itemCount = items.length;

  return (
    <div style={{ padding: '100px 20px 60px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h2>Emploi du temps <span style={{ color: 'var(--primary)' }}>Voyage</span></h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          {itemCount} activité{itemCount !== 1 ? 's' : ''} planifiée{itemCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button className="btn-glass" onClick={() => setWeekStart(addDays(weekStart, -7))} style={{ padding: '8px 14px' }}>
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white' }}>
          <Calendar size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--primary)' }} />
          {weekLabel()}
        </span>
        <button className="btn-glass" onClick={() => setWeekStart(addDays(weekStart, 7))} style={{ padding: '8px 14px' }}>
          <ChevronRight size={18} />
        </button>
        <button className="btn-glass" onClick={() => setWeekStart(getMonday(new Date()))} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          Aujourd'hui
        </button>
      </div>

      {/* Week grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '12px',
        overflowX: 'auto'
      }}>
        {weekDays.map((date, i) => {
          const dayItems = itemsForDay(date);
          const isToday = toDateStr(date) === toDateStr(new Date());

          return (
            <div key={i} style={{ minWidth: '140px' }}>
              {/* Day header */}
              <div className="glass" style={{
                padding: '10px',
                textAlign: 'center',
                marginBottom: '10px',
                borderRadius: '12px',
                background: isToday ? 'rgba(67, 97, 238, 0.3)' : undefined,
                borderColor: isToday ? 'var(--primary)' : undefined
              }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {DAYS_FR[i]}
                </p>
                <p style={{ fontWeight: 800, fontSize: '1rem', color: isToday ? 'var(--primary)' : 'white' }}>
                  {formatDayHeader(date)}
                </p>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <AnimatePresence>
                  {dayItems.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="glass"
                      style={{ padding: '12px', borderRadius: '12px', position: 'relative' }}
                    >
                      {canEdit && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          style={{
                            position: 'absolute', top: '6px', right: '6px',
                            background: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', padding: '2px'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px', paddingRight: '16px' }}>
                        {item.title}
                      </p>
                      {(item.time_start || item.time_end) && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                          <Clock size={10} />
                          {item.time_start}{item.time_end ? ` → ${item.time_end}` : ''}
                        </p>
                      )}
                      {item.place_name && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={10} /> {item.place_name}
                        </p>
                      )}
                      {item.description && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                          {item.description}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {canEdit && (
                  <button
                    onClick={() => handleAdd(date)}
                    className="btn-glass"
                    style={{
                      width: '100%', padding: '8px', fontSize: '0.8rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      opacity: 0.6
                    }}
                  >
                    <Plus size={14} /> Ajouter
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '20px'
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass"
              style={{ width: '100%', maxWidth: '480px', padding: '35px', position: 'relative' }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', color: 'white' }}
              >
                <X size={20} />
              </button>

              <h3 style={{ marginBottom: '5px' }}>Ajouter une activité</h3>
              <p style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '25px', fontWeight: 600 }}>
                {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                  className="glass"
                  style={{ padding: '12px', color: 'white' }}
                  placeholder="Titre *"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Début</label>
                    <input
                      type="time"
                      className="glass"
                      style={{ padding: '10px', color: 'white', width: '100%' }}
                      value={form.time_start}
                      onChange={e => setForm({ ...form, time_start: e.target.value })}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Fin</label>
                    <input
                      type="time"
                      className="glass"
                      style={{ padding: '10px', color: 'white', width: '100%' }}
                      value={form.time_end}
                      onChange={e => setForm({ ...form, time_end: e.target.value })}
                    />
                  </div>
                </div>

                <select
                  className="glass"
                  style={{ padding: '12px', color: form.place_id ? 'white' : 'var(--text-muted)' }}
                  value={form.place_id}
                  onChange={e => setForm({ ...form, place_id: e.target.value })}
                >
                  <option value="" style={{ color: 'black' }}>Lier à un lieu (optionnel)</option>
                  {places.map(p => (
                    <option key={p.id} value={p.id} style={{ color: 'black' }}>{p.name}</option>
                  ))}
                </select>

                <textarea
                  className="glass"
                  style={{ padding: '12px', color: 'white', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Description (optionnel)"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />

                <button type="submit" className="btn-primary" style={{ padding: '14px', marginTop: '5px' }}>
                  Enregistrer
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Schedule;
