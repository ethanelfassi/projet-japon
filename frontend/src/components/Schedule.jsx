import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Clock, MapPin, Trash2, Calendar, List, LayoutGrid, Zap } from 'lucide-react';

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

const HOUR_HEIGHT = 64;
const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const SNAP = 15;

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
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

const formatDateLong = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

const yToTimeStr = (y) => {
  const rawMin = (Math.max(0, y) / HOUR_HEIGHT) * 60;
  const snapped = Math.round(rawMin / SNAP) * SNAP;
  const total = Math.min(snapped, TOTAL_HOURS * 60);
  const h = Math.floor(total / 60) + START_HOUR;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const timeStrToY = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h)) return null;
  return Math.max(0, ((h - START_HOUR) * 60 + (m || 0)) / 60 * HOUR_HEIGHT);
};

// --- ItemCard ---
const ItemCard = ({ item, canEdit, onDelete, style }) => {
  const hasPlace = !!item.place_name;
  return (
    <div
      className="glass"
      style={{
        padding: '5px 8px',
        borderRadius: '7px',
        position: 'relative',
        borderLeft: `3px solid ${hasPlace ? 'var(--primary)' : 'var(--secondary)'}`,
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {canEdit && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(item.id); }}
          className="schedule-delete-btn"
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            color: '#ff3b30',
            padding: 0,
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          title="Supprimer"
        >
          <X size={10} strokeWidth={3} />
        </button>
      )}
      <p style={{ fontWeight: 700, fontSize: '0.75rem', paddingRight: '14px', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {item.title}
      </p>
      {item.time_start && (
        <p style={{ fontSize: '0.65rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Clock size={8} />{item.time_start}{item.time_end ? ` – ${item.time_end}` : ''}
        </p>
      )}
      {item.place_name && (
        <p style={{ fontSize: '0.65rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
          <MapPin size={8} />{item.place_name}
        </p>
      )}
    </div>
  );
};

// --- AddModal ---
const AddModal = ({ selectedDate, initialTime, places, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    time_start: initialTime?.time_start || '',
    time_end: initialTime?.time_end || '',
    place_id: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave({ ...form, date: selectedDate });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="glass"
        style={{ width: '100%', maxWidth: '480px', padding: '35px', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          <X size={20} />
        </button>
        <h3 style={{ marginBottom: '5px' }}>Ajouter une activité</h3>
        <p style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '25px', fontWeight: 600 }}>
          {formatDateLong(selectedDate)}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            className="glass" style={{ padding: '12px', color: 'white' }}
            placeholder="Titre *" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required autoFocus
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Début</label>
              <input type="time" className="glass" style={{ padding: '10px', color: 'white', width: '100%' }}
                value={form.time_start} onChange={e => setForm({ ...form, time_start: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Fin</label>
              <input type="time" className="glass" style={{ padding: '10px', color: 'white', width: '100%' }}
                value={form.time_end} onChange={e => setForm({ ...form, time_end: e.target.value })} />
            </div>
          </div>
          <select className="glass" style={{ padding: '12px', color: form.place_id ? 'white' : 'var(--text-muted)' }}
            value={form.place_id} onChange={e => setForm({ ...form, place_id: e.target.value })}>
            <option value="" style={{ color: 'black' }}>Lier à un lieu (optionnel)</option>
            {places.map(p => <option key={p.id} value={p.id} style={{ color: 'black' }}>{p.name}</option>)}
          </select>
          <textarea className="glass" style={{ padding: '12px', color: 'white', minHeight: '80px', resize: 'vertical' }}
            placeholder="Description (optionnel)" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />
          <button type="submit" className="btn-primary" style={{ padding: '14px', marginTop: '5px' }}>
            Enregistrer
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// --- Schedule ---
const Schedule = ({ user }) => {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [items, setItems] = useState([]);
  const [places, setPlaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [initialTime, setInitialTime] = useState(null);
  const [view, setView] = useState('week');
  const [drag, setDrag] = useState(null);
  const colRefs = useRef([]);

  const canEdit = user && (user.role === 'editeur' || user.role === 'admin');

  useEffect(() => { fetchItems(); fetchPlaces(); }, []);

  const fetchItems = async () => {
    try { const res = await axios.get('/api/itinerary'); setItems(res.data); }
    catch (err) { console.error(err); }
  };

  const fetchPlaces = async () => {
    try { const res = await axios.get('/api/places'); setPlaces(res.data); }
    catch (err) { console.error(err); }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const itemsForDay = (dateStr) => items.filter(item => (item.date || '').slice(0, 10) === dateStr);

  const handleSave = async (data) => {
    try { await axios.post('/api/itinerary', data); await fetchItems(); }
    catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`/api/itinerary/${id}`); setItems(prev => prev.filter(i => i.id !== id)); }
    catch (err) { console.error(err); }
  };

  // Drag-to-create
  const handleMouseDown = (e, dayIndex, dateStr) => {
    if (!canEdit || e.button !== 0) return;
    e.preventDefault();
    const rect = colRefs.current[dayIndex]?.getBoundingClientRect();
    if (!rect) return;
    const y = Math.max(0, Math.min(e.clientY - rect.top, TOTAL_HOURS * HOUR_HEIGHT));
    setDrag({ dayIndex, dateStr, startY: y, currentY: y });
  };

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      const rect = colRefs.current[drag.dayIndex]?.getBoundingClientRect();
      if (!rect) return;
      const y = Math.max(0, Math.min(e.clientY - rect.top, TOTAL_HOURS * HOUR_HEIGHT));
      setDrag(prev => prev ? { ...prev, currentY: y } : null);
    };
    const onUp = (e) => {
      const rect = colRefs.current[drag.dayIndex]?.getBoundingClientRect();
      const endY = rect ? Math.max(0, Math.min(e.clientY - rect.top, TOTAL_HOURS * HOUR_HEIGHT)) : drag.currentY;
      const minY = Math.min(drag.startY, endY);
      const maxY = Math.max(drag.startY, endY);
      // If barely moved, default to 1 hour
      const time_start = yToTimeStr(minY);
      const time_end = yToTimeStr(maxY - minY < HOUR_HEIGHT / 2 ? minY + HOUR_HEIGHT : maxY);
      setSelectedDate(drag.dateStr);
      setInitialTime({ time_start, time_end });
      setShowModal(true);
      setDrag(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag]);

  const weekLabel = () => {
    const end = addDays(weekStart, 6);
    const s = weekStart;
    if (s.getMonth() === end.getMonth())
      return `${s.getDate()} – ${end.getDate()} ${MONTHS_FR[s.getMonth()]} ${s.getFullYear()}`;
    return `${s.getDate()} ${MONTHS_FR[s.getMonth()]} – ${end.getDate()} ${MONTHS_FR[end.getMonth()]} ${s.getFullYear()}`;
  };

  const goToNextActivity = () => {
    const today = toDateStr(new Date());
    const next = items.filter(i => i.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (next) setWeekStart(getMonday(new Date(next.date + 'T00:00:00')));
  };

  const totalItems = items.length;
  const linkedCount = items.filter(i => i.place_id).length;
  const freeCount = totalItems - linkedCount;
  const daysWithItems = new Set(items.map(i => i.date)).size;
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  const groupedByDate = items
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time_start || '').localeCompare(b.time_start || ''))
    .reduce((acc, item) => { const d = (item.date || '').slice(0, 10); (acc[d] = acc[d] || []).push(item); return acc; }, {});

  return (
    <div style={{ padding: '100px 20px 60px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '30px' }}>
        <div>
          <h2>Emploi du temps <span style={{ color: 'var(--primary)' }}>Voyage</span></h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            {totalItems} activité{totalItems !== 1 ? 's' : ''} sur {daysWithItems} jour{daysWithItems !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="glass" style={{ display: 'flex', borderRadius: '12px', padding: '4px', gap: '4px' }}>
          {[['week', <LayoutGrid size={15} />, 'Semaine'], ['list', <List size={15} />, 'Liste']].map(([v, icon, label]) => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? 'var(--primary)' : 'none', border: 'none', borderRadius: '8px', color: 'white', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, transition: 'background 0.2s' }}>
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: totalItems, color: 'var(--text-muted)', icon: <Calendar size={14} /> },
          { label: 'Liés à un lieu', value: linkedCount, color: 'var(--primary)', icon: <MapPin size={14} /> },
          { label: 'Activités libres', value: freeCount, color: 'var(--secondary)', icon: <Zap size={14} /> },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: s.color }}>{s.icon}</span>
            <div>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button className="btn-glass" onClick={() => setWeekStart(addDays(weekStart, -7))} style={{ padding: '8px 14px' }}><ChevronLeft size={18} /></button>
        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} style={{ color: 'var(--primary)' }} />{weekLabel()}
        </span>
        <button className="btn-glass" onClick={() => setWeekStart(addDays(weekStart, 7))} style={{ padding: '8px 14px' }}><ChevronRight size={18} /></button>
        <button className="btn-glass" onClick={() => setWeekStart(getMonday(new Date()))} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Aujourd'hui</button>
        {items.some(i => i.date >= toDateStr(new Date())) && (
          <button className="btn-glass" onClick={goToNextActivity} style={{ padding: '8px 16px', fontSize: '0.85rem', color: 'var(--primary)' }}>
            <Zap size={14} style={{ display: 'inline', marginRight: '5px' }} />Prochaine activité
          </button>
        )}
      </div>

      {/* WEEK VIEW */}
      {view === 'week' && (
        <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', position: 'sticky', top: 0, zIndex: 20, background: 'var(--glass-bg)', borderBottom: '1px solid var(--glass-border)' }}>
            <div />
            {weekDays.map((date, i) => {
              const dateStr = toDateStr(date);
              const isToday = dateStr === toDateStr(new Date());
              const count = itemsForDay(dateStr).length;
              return (
                <div key={i} style={{ padding: '12px 8px', textAlign: 'center', borderLeft: '1px solid var(--glass-border)', background: isToday ? 'rgba(67,97,238,0.15)' : undefined }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{DAYS_FR[i]}</p>
                  <p style={{ fontWeight: 800, fontSize: '0.95rem', color: isToday ? 'var(--primary)' : 'white' }}>{formatDayHeader(date)}</p>
                  {count > 0 && <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '999px', fontSize: '0.62rem', fontWeight: 800, padding: '1px 6px' }}>{count}</span>}
                </div>
              );
            })}
          </div>

          {/* Time grid (scrollable) */}
          <div style={{ overflowY: 'auto', maxHeight: '72vh' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)' }}>
              {/* Time labels */}
              <div style={{ position: 'relative', height: TOTAL_HOURS * HOUR_HEIGHT }}>
                {hours.map((h, idx) => (
                  <div key={h} style={{ position: 'absolute', top: idx * HOUR_HEIGHT - 9, right: '6px', fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1, userSelect: 'none' }}>
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map((date, i) => {
                const dateStr = toDateStr(date);
                const isToday = dateStr === toDateStr(new Date());
                const dayItems = itemsForDay(dateStr);
                const timedItems = dayItems.filter(item => item.time_start);
                const untimedItems = dayItems.filter(item => !item.time_start);

                return (
                  <div key={i} style={{ borderLeft: '1px solid var(--glass-border)', background: isToday ? 'rgba(67,97,238,0.04)' : undefined }}>
                    {/* All-day items */}
                    {untimedItems.length > 0 && (
                      <div style={{ padding: '4px', borderBottom: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {untimedItems.map(item => <ItemCard key={item.id} item={item} canEdit={canEdit} onDelete={handleDelete} />)}
                      </div>
                    )}

                    {/* Draggable time area */}
                    <div
                      ref={el => { colRefs.current[i] = el; }}
                      onMouseDown={e => handleMouseDown(e, i, dateStr)}
                      style={{ position: 'relative', height: TOTAL_HOURS * HOUR_HEIGHT, cursor: canEdit ? 'crosshair' : 'default', userSelect: 'none' }}
                    >
                      {/* Grid lines */}
                      {hours.map((h, idx) => (
                        <React.Fragment key={h}>
                          <div style={{ position: 'absolute', left: 0, right: 0, top: idx * HOUR_HEIGHT, borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                          <div style={{ position: 'absolute', left: 0, right: 0, top: idx * HOUR_HEIGHT + HOUR_HEIGHT / 2, borderTop: '1px dashed rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
                        </React.Fragment>
                      ))}

                      {/* Timed items */}
                      {timedItems.map(item => {
                        const top = timeStrToY(item.time_start);
                        if (top === null) return null;
                        const endY = item.time_end ? (timeStrToY(item.time_end) ?? top + HOUR_HEIGHT) : top + HOUR_HEIGHT;
                        const height = Math.max(endY - top, 24);
                        return <ItemCard key={item.id} item={item} canEdit={canEdit} onDelete={handleDelete} style={{ position: 'absolute', top, left: 3, right: 3, height, zIndex: 2 }} />;
                      })}

                      {/* Drag overlay */}
                      {drag && drag.dayIndex === i && (
                        <div style={{
                          position: 'absolute', left: 2, right: 2,
                          top: Math.min(drag.startY, drag.currentY),
                          height: Math.max(Math.abs(drag.currentY - drag.startY), 4),
                          background: 'rgba(67,97,238,0.3)',
                          border: '2px solid var(--primary)',
                          borderRadius: '6px',
                          pointerEvents: 'none',
                          zIndex: 10,
                        }}>
                          <div style={{ padding: '3px 5px', fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700 }}>
                            {yToTimeStr(Math.min(drag.startY, drag.currentY))} – {yToTimeStr(Math.max(drag.startY, drag.currentY))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '700px' }}>
          {Object.keys(groupedByDate).length === 0 ? (
            <div className="glass" style={{ padding: '50px', textAlign: 'center', borderRadius: '20px' }}>
              <Calendar size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Aucune activité planifiée pour l'instant.</p>
              {canEdit && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>Passez en vue Semaine pour en ajouter.</p>}
            </div>
          ) : (
            Object.entries(groupedByDate).map(([date, dayItems]) => {
              const isToday = date === toDateStr(new Date());
              return (
                <div key={date}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h4 style={{ color: isToday ? 'var(--primary)' : 'white', margin: 0, textTransform: 'capitalize' }}>{formatDateLong(date)}</h4>
                    <span style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '999px', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '2px 10px', fontWeight: 600 }}>
                      {dayItems.length} activité{dayItems.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <AnimatePresence>
                      {dayItems.map(item => (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          <ItemCard item={item} canEdit={canEdit} onDelete={handleDelete} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && selectedDate && (
          <AddModal selectedDate={selectedDate} initialTime={initialTime} places={places} onClose={() => setShowModal(false)} onSave={handleSave} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Schedule;
