const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { pool, initDb } = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_japan_key_2026';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(cors());
app.use(express.json());

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) { req.user = null; return next(); }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query('SELECT id, username, role, banned FROM users WHERE id = $1', [decoded.id]);
    req.user = (rows[0] && !rows[0].banned) ? rows[0] : null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  next();
};

let initPromise = null;
const ensureDb = () => {
  if (!initPromise) initPromise = initDb();
  return initPromise;
};

app.use((req, res, next) => {
  ensureDb().then(next).catch(() => res.status(500).json({ error: 'DB init failed' }));
});

app.use(authenticateToken);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const storage = new CloudinaryStorage({
  cloudinary,
  params: { 
    folder: 'projet-japon', 
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'webm', 'mkv'] 
  },
});
const upload = multer({ storage });

// --- Auth ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, 'visiteur']
    );
    const token = jwt.sign({ id: rows[0].id, username: rows[0].username }, JWT_SECRET);
    res.json({ token, user: { id: rows[0].id, username: rows[0].username, role: rows[0].role } });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username already taken' });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (!rows[0]) return res.status(400).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: rows[0].id, username: rows[0].username }, JWT_SECRET);
    res.json({ token, user: { id: rows[0].id, username: rows[0].username, role: rows[0].role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/users', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id, username FROM users WHERE id != $1', [req.user.id]);
  res.json(rows);
});

// --- Groups ---
app.post('/api/groups', requireRole('editeur', 'admin'), async (req, res) => {
  try {
    const { name, members, color } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO groups (name, created_by, color) VALUES ($1, $2, $3) RETURNING id',
      [name, req.user.id, color || 'purple']
    );
    const groupId = rows[0].id;
    await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId, req.user.id]);
    if (members && members.length > 0) {
      for (const memberId of members) {
        await pool.query(
          'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [groupId, memberId]
        );
      }
    }
    res.json({ id: groupId, name, created_by: req.user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/groups', requireAuth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT g.*,
      (SELECT json_agg(json_build_object('id', u.id, 'username', u.username))
       FROM group_members gm JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = g.id) as members,
      (SELECT username FROM users WHERE id = g.created_by) as creator_name
    FROM groups g
    ORDER BY g.created_at DESC
  `);
  res.json(rows);
});

app.delete('/api/groups/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT created_by FROM groups WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Group not found' });
  if (rows[0].created_by !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM group_members WHERE group_id = $1', [req.params.id]);
  await pool.query('DELETE FROM groups WHERE id = $1', [req.params.id]);
  res.json({ message: 'Group deleted' });
});

app.patch('/api/groups/:id', requireAuth, async (req, res) => {
  const { name, color } = req.body;
  const { rows } = await pool.query('SELECT created_by FROM groups WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Group not found' });
  if (rows[0].created_by !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  
  if (name !== undefined && color !== undefined) {
    await pool.query('UPDATE groups SET name = $1, color = $2 WHERE id = $3', [name, color, req.params.id]);
  } else if (name !== undefined) {
    await pool.query('UPDATE groups SET name = $1 WHERE id = $2', [name, req.params.id]);
  } else if (color !== undefined) {
    await pool.query('UPDATE groups SET color = $1 WHERE id = $2', [color, req.params.id]);
  }
  res.json({ message: 'Updated' });
});

app.post('/api/groups/:id/members', requireAuth, async (req, res) => {
  const { userId } = req.body;
  const { rows } = await pool.query('SELECT created_by FROM groups WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Group not found' });
  if (rows[0].created_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, userId]);
  res.json({ message: 'Member added' });
});

app.delete('/api/groups/:id/members/:userId', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT created_by FROM groups WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Group not found' });
  if (rows[0].created_by !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  await pool.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [req.params.id, req.params.userId]);
  res.json({ message: 'Member removed' });
});

app.post('/api/groups/:id/leave', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ message: 'Left group' });
});

// --- Places ---
app.get('/api/places', requireAuth, async (req, res) => {
  const photoSub = `(SELECT url FROM photos WHERE place_id = p.id ORDER BY created_at ASC LIMIT 1) as first_photo_url`;
  const result = await pool.query(`
    SELECT DISTINCT p.*, g.name AS group_name, g.color AS group_color, ${photoSub} FROM places p
    LEFT JOIN group_members gm ON p.group_id = gm.group_id
    LEFT JOIN groups g ON p.group_id = g.id
    WHERE p.visibility = 'public'
       OR p.created_by = $1
       OR (p.visibility = 'group' AND gm.user_id = $2)
    ORDER BY p.created_at DESC
  `, [req.user.id, req.user.id]);
  res.json(result.rows);
});

app.post('/api/places', requireRole('editeur', 'admin'), async (req, res) => {
  const { name, description, location, type, lat, lng, visibility, group_id } = req.body;
  const finalVisibility = req.user ? (visibility || 'public') : 'public';
  const createdBy = req.user ? req.user.id : null;
  const finalGroupId = finalVisibility === 'group' ? group_id : null;
  const { rows } = await pool.query(
    'INSERT INTO places (name, description, location, type, lat, lng, visibility, created_by, group_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
    [name, description, location, type || 'place', lat, lng, finalVisibility, createdBy, finalGroupId]
  );
  res.json({ id: rows[0].id, name, description, location, type: type || 'place', lat, lng, status: 'planned', visibility: finalVisibility, created_by: createdBy, group_id: finalGroupId });
});

app.patch('/api/places/:id', requireRole('editeur', 'admin'), async (req, res) => {
  const { name, description, status } = req.body;
  const placeId = req.params.id;

  try {
    const { rows: placeRows } = await pool.query('SELECT * FROM places WHERE id = $1', [placeId]);
    if (!placeRows[0]) return res.status(404).json({ error: 'Place not found' });
    const place = placeRows[0];

    if (req.user.role !== 'admin') {
      if (place.visibility === 'private') {
        if (place.created_by !== req.user.id) {
          return res.status(403).json({ error: 'Forbidden: Private place' });
        }
      } else if (place.visibility === 'group') {
        const { rows: memberRows } = await pool.query(
          'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
          [place.group_id, req.user.id]
        );
        if (memberRows.length === 0 && place.created_by !== req.user.id) {
          return res.status(403).json({ error: 'Forbidden: You are not a member of the group sharing this place' });
        }
      }
    }

    const updates = [];
    const values = [];
    let paramIdx = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIdx++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIdx++}`);
      values.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIdx++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(placeId);
    const query = `UPDATE places SET ${updates.join(', ')} WHERE id = $${paramIdx}`;
    
    await pool.query(query, values);
    res.json({ message: 'Place updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/places/:id', requireRole('admin'), async (req, res) => {
  const { name, description, location, type, lat, lng, status } = req.body;
  await pool.query(
    'UPDATE places SET name=$1, description=$2, location=$3, type=$4, lat=$5, lng=$6, status=$7 WHERE id=$8',
    [name, description, location, type, lat, lng, status, req.params.id]
  );
  res.json({ message: 'Place updated' });
});

app.delete('/api/places/:id', requireRole('editeur', 'admin'), async (req, res) => {
  const { rows } = await pool.query('SELECT cloudinary_id FROM photos WHERE place_id = $1', [req.params.id]);
  for (const photo of rows) {
    if (photo.cloudinary_id) {
      try { await cloudinary.uploader.destroy(photo.cloudinary_id); } catch (e) { console.error(e); }
    }
  }
  await pool.query('DELETE FROM photo_comments WHERE photo_id IN (SELECT id FROM photos WHERE place_id = $1)', [req.params.id]);
  await pool.query('DELETE FROM photos WHERE place_id = $1', [req.params.id]);
  await pool.query('DELETE FROM places WHERE id = $1', [req.params.id]);
  res.json({ message: 'Place deleted' });
});

// --- Photos ---
app.post('/api/photos', requireRole('editeur', 'admin'), upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { place_id, caption, is_stamp, stamp_style } = req.body;
  const url = req.file.path;
  const publicId = req.file.filename;
  const isStampInt = is_stamp === 'true' || is_stamp === 1 ? 1 : 0;
  const style = stamp_style || 'classic';
  const mediaType = req.file.mimetype && req.file.mimetype.startsWith('video/') ? 'video' : 'photo';
  try {
    const { rows } = await pool.query(
      'INSERT INTO photos (place_id, url, caption, is_stamp, stamp_style, cloudinary_id, media_type, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
      [place_id, url, caption, isStampInt, style, publicId, mediaType, req.user.id]
    );
    res.json({ id: rows[0].id, place_id, url, caption, is_stamp: isStampInt, stamp_style: style, media_type: mediaType, uploaded_by: req.user.id });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/photos/:place_id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM photos WHERE place_id = $1', [req.params.place_id]);
  res.json(rows);
});

app.get('/api/photos', requireAuth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT photos.*, places.name as place_name, places.location as place_location,
           places.visibility as place_visibility, places.created_by as place_created_by, places.group_id as place_group_id
    FROM photos JOIN places ON photos.place_id = places.id
    ORDER BY photos.created_at DESC
  `);
  res.json(rows);
});

app.patch('/api/photos/:id', requireRole('editeur', 'admin'), async (req, res) => {
  const { caption } = req.body;
  const photoId = req.params.id;
  try {
    const { rows: photoRows } = await pool.query('SELECT place_id FROM photos WHERE id = $1', [photoId]);
    if (!photoRows[0]) return res.status(404).json({ error: 'Photo not found' });
    const photo = photoRows[0];

    const { rows: placeRows } = await pool.query('SELECT * FROM places WHERE id = $1', [photo.place_id]);
    if (!placeRows[0]) return res.status(404).json({ error: 'Place not found' });
    const place = placeRows[0];

    if (req.user.role !== 'admin') {
      if (place.visibility === 'private') {
        if (place.created_by !== req.user.id) {
          return res.status(403).json({ error: 'Forbidden: Private place' });
        }
      } else if (place.visibility === 'group') {
        const { rows: memberRows } = await pool.query(
          'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
          [place.group_id, req.user.id]
        );
        if (memberRows.length === 0 && place.created_by !== req.user.id) {
          return res.status(403).json({ error: 'Forbidden: You are not a member of the group sharing this place' });
        }
      }
    }

    await pool.query('UPDATE photos SET caption = $1 WHERE id = $2', [caption, photoId]);
    res.json({ message: 'Photo caption updated successfully', id: photoId, caption });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/photos/:id', requireRole('editeur', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT cloudinary_id, place_id FROM photos WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Photo not found' });
    const photo = rows[0];

    const { rows: placeRows } = await pool.query('SELECT * FROM places WHERE id = $1', [photo.place_id]);
    if (!placeRows[0]) return res.status(404).json({ error: 'Place not found' });
    const place = placeRows[0];

    if (req.user.role !== 'admin') {
      if (place.visibility === 'private') {
        if (place.created_by !== req.user.id) {
          return res.status(403).json({ error: 'Forbidden: Private place' });
        }
      } else if (place.visibility === 'group') {
        const { rows: memberRows } = await pool.query(
          'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
          [place.group_id, req.user.id]
        );
        if (memberRows.length === 0 && place.created_by !== req.user.id) {
          return res.status(403).json({ error: 'Forbidden: You are not a member of the group sharing this place' });
        }
      }
    }

    if (photo.cloudinary_id) {
      try { await cloudinary.uploader.destroy(photo.cloudinary_id); } catch (err) { console.error(err); }
    }
    await pool.query('DELETE FROM photos WHERE id = $1', [req.params.id]);
    res.json({ message: 'Photo deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Photo Comments ---
app.get('/api/photo-comments', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT pc.*, u.username
      FROM photo_comments pc
      JOIN users u ON pc.user_id = u.id
      ORDER BY pc.created_at ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error fetching comments' });
  }
});

app.post('/api/photo-comments/:photo_id', requireAuth, async (req, res) => {
  const { text } = req.body;
  const { photo_id } = req.params;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Comment text is required' });
  }
  try {
    const parsedPhotoId = parseInt(photo_id, 10);
    const { rows } = await pool.query(
      'INSERT INTO photo_comments (photo_id, user_id, text) VALUES ($1, $2, $3) RETURNING id, photo_id, user_id, text, created_at',
      [parsedPhotoId, req.user.id, text]
    );
    res.json({ ...rows[0], username: req.user.username });
  } catch (err) {
    res.status(500).json({ error: 'Database error adding comment' });
  }
});

app.delete('/api/photo-comments/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT user_id FROM photo_comments WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Comment not found' });
    if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    await pool.query('DELETE FROM photo_comments WHERE id = $1', [id]);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Database error deleting comment' });
  }
});

// --- Itinerary ---
app.get('/api/itinerary', requireAuth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT i.*, p.name as place_name, p.location as place_location
    FROM itinerary i
    LEFT JOIN places p ON i.place_id = p.id
    ORDER BY i.date ASC, i.time_start ASC
  `);
  res.json(rows);
});

app.post('/api/itinerary', requireRole('editeur', 'admin'), async (req, res) => {
  const { date, title, description, time_start, time_end, place_id } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO itinerary (date, title, description, time_start, time_end, place_id, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [date, title, description, time_start || null, time_end || null, place_id || null, req.user.id]
  );
  res.json(rows[0]);
});

app.delete('/api/itinerary/:id', requireRole('editeur', 'admin'), async (req, res) => {
  await pool.query('DELETE FROM itinerary WHERE id = $1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

// --- Admin ---
app.get('/api/admin/users', requireRole('admin'), async (req, res) => {
  const { rows } = await pool.query(`
    SELECT u.id, u.username, u.role, u.banned, u.created_at,
      COUNT(DISTINCT p.id) as places_count,
      COUNT(DISTINCT ph.id) as photos_count
    FROM users u
    LEFT JOIN places p ON p.created_by = u.id
    LEFT JOIN photos ph ON ph.uploaded_by = u.id
    GROUP BY u.id
    ORDER BY u.id
  `);
  res.json(rows);
});

app.patch('/api/admin/users/:id/role', requireRole('admin'), async (req, res) => {
  const { role } = req.body;
  if (!['visiteur', 'editeur', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
  res.json({ message: 'Role updated' });
});

app.patch('/api/admin/users/:id/ban', requireRole('admin'), async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot ban yourself' });
  const { banned } = req.body;
  await pool.query('UPDATE users SET banned = $1 WHERE id = $2', [banned, req.params.id]);
  res.json({ message: 'Updated' });
});

app.get('/api/admin/groups', requireRole('admin'), async (req, res) => {
  const { rows } = await pool.query(`
    SELECT g.*,
      (SELECT json_agg(json_build_object('id', u.id, 'username', u.username))
       FROM group_members gm JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = g.id) as members,
      (SELECT username FROM users WHERE id = g.created_by) as creator_name
    FROM groups g ORDER BY g.created_at DESC
  `);
  res.json(rows);
});

app.delete('/api/admin/groups/:id', requireRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM group_members WHERE group_id = $1', [req.params.id]);
  await pool.query('DELETE FROM groups WHERE id = $1', [req.params.id]);
  res.json({ message: 'Group deleted' });
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Tous les champs sont requis' });
    
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    
    const valid = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Ancien mot de passe incorrect' });
    
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users', requireRole('admin'), async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) return res.status(400).json({ error: 'Tous les champs sont requis' });
    if (!['visiteur', 'editeur', 'admin'].includes(role)) return res.status(400).json({ error: 'Rôle invalide' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, role]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Nom d\'utilisateur déjà pris' });
    res.status(500).json({ error: err.message });
  }
});

initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});

module.exports = app;
