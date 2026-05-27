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
    const { rows } = await pool.query('SELECT id, username, role FROM users WHERE id = $1', [decoded.id]);
    req.user = rows[0] || null;
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

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'projet-japon', allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
});
const upload = multer({ storage });

// --- Auth ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminNames = ['ethan', 'laurine', 'lwi', 'ruben', 'ameline'];
    const isAdmin = adminNames.some(n => username.toLowerCase().includes(n));
    const role = isAdmin ? 'admin' : 'visiteur';
    const { rows } = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, role]
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
    const { name, members } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING id',
      [name, req.user.id]
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
  const { rows } = await pool.query(
    'SELECT g.* FROM groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = $1',
    [req.user.id]
  );
  res.json(rows);
});

// --- Places ---
app.get('/api/places', async (req, res) => {
  let result;
  if (req.user) {
    result = await pool.query(`
      SELECT DISTINCT p.* FROM places p
      LEFT JOIN group_members gm ON p.group_id = gm.group_id
      WHERE p.visibility = 'public'
         OR p.created_by = $1
         OR (p.visibility = 'group' AND gm.user_id = $2)
      ORDER BY p.created_at DESC
    `, [req.user.id, req.user.id]);
  } else {
    result = await pool.query("SELECT * FROM places WHERE visibility = 'public' ORDER BY created_at DESC");
  }
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

// --- Photos ---
app.post('/api/photos', requireRole('editeur', 'admin'), upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { place_id, caption, is_stamp, stamp_style } = req.body;
  const url = req.file.path;
  const publicId = req.file.filename;
  const isStampInt = is_stamp === 'true' || is_stamp === 1 ? 1 : 0;
  const style = stamp_style || 'classic';
  try {
    const { rows } = await pool.query(
      'INSERT INTO photos (place_id, url, caption, is_stamp, stamp_style, cloudinary_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [place_id, url, caption, isStampInt, style, publicId]
    );
    res.json({ id: rows[0].id, place_id, url, caption, is_stamp: isStampInt, stamp_style: style });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/photos/:place_id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM photos WHERE place_id = $1', [req.params.place_id]);
  res.json(rows);
});

app.get('/api/photos', async (req, res) => {
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

// --- Admin ---
app.get('/api/admin/users', requireRole('admin'), async (req, res) => {
  const { rows } = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id');
  res.json(rows);
});

app.patch('/api/admin/users/:id/role', requireRole('admin'), async (req, res) => {
  const { role } = req.body;
  if (!['visiteur', 'editeur', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
  res.json({ message: 'Role updated' });
});

if (process.env.NODE_ENV !== 'production') {
  initDb().then(() => {
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  });
}

module.exports = app;
