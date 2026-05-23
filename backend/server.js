const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const db = require('./database');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_japan_key_2026';

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
      return next();
    }
    req.user = user;
    next();
  });
};

const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

app.use(authenticateToken);

// Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'projet-japon', allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
});
const upload = multer({ storage });

// API Endpoints

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const info = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hashedPassword);
    const token = jwt.sign({ id: info.lastInsertRowid, username }, JWT_SECRET);
    res.json({ token, user: { id: info.lastInsertRowid, username } });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Username already taken' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/users', requireAuth, (req, res) => {
  const users = db.prepare('SELECT id, username FROM users WHERE id != ?').all(req.user.id);
  res.json(users);
});

// --- Groups Routes ---
app.post('/api/groups', requireAuth, (req, res) => {
  try {
    const { name, members } = req.body; // members is array of user IDs
    const info = db.prepare('INSERT INTO groups (name, created_by) VALUES (?, ?)').run(name, req.user.id);
    const groupId = info.lastInsertRowid;
    
    // Add creator to group
    db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(groupId, req.user.id);
    
    // Add other members
    if (members && members.length > 0) {
      const insertMember = db.prepare('INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)');
      members.forEach(memberId => {
        insertMember.run(groupId, memberId);
      });
    }
    res.json({ id: groupId, name, created_by: req.user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/groups', requireAuth, (req, res) => {
  const groups = db.prepare(`
    SELECT g.* FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ?
  `).all(req.user.id);
  res.json(groups);
});


// Get all places (filtered by visibility)
app.get('/api/places', (req, res) => {
  let places = [];
  if (req.user) {
    // Logged in: public + own + groups
    places = db.prepare(`
      SELECT DISTINCT p.* FROM places p
      LEFT JOIN group_members gm ON p.group_id = gm.group_id
      WHERE p.visibility = 'public'
         OR p.created_by = ?
         OR (p.visibility = 'group' AND gm.user_id = ?)
      ORDER BY p.created_at DESC
    `).all(req.user.id, req.user.id);
  } else {
    // Not logged in: only public
    places = db.prepare(`
      SELECT * FROM places 
      WHERE visibility = 'public' 
      ORDER BY created_at DESC
    `).all();
  }
  res.json(places);
});

// Add a new place/activity
app.post('/api/places', (req, res) => {
  const { name, description, location, type, lat, lng, visibility, group_id } = req.body;
  
  // If not logged in, force public
  const finalVisibility = req.user ? (visibility || 'public') : 'public';
  const createdBy = req.user ? req.user.id : null;
  const finalGroupId = finalVisibility === 'group' ? group_id : null;

  const info = db.prepare(`
    INSERT INTO places (name, description, location, type, lat, lng, visibility, created_by, group_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, location, type || 'place', lat, lng, finalVisibility, createdBy, finalGroupId);
  
  res.json({ 
    id: info.lastInsertRowid, name, description, location, 
    type: type || 'place', lat, lng, status: 'planned',
    visibility: finalVisibility, created_by: createdBy, group_id: finalGroupId
  });
});

// Update place status
app.patch('/api/places/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE places SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Status updated' });
});

// Upload photo
app.post('/api/photos', upload.single('photo'), (req, res) => {
  console.log('--- Upload Request Received ---');
  console.log('Body:', req.body);
  console.log('File:', req.file ? req.file.filename : 'No file');
  
  if (!req.file) {
    console.error('Upload failed: No file provided');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { place_id, caption, is_stamp, stamp_style } = req.body;
  const url = req.file.path;
  const publicId = req.file.filename;
  const isStampInt = is_stamp === 'true' || is_stamp === 1 ? 1 : 0;
  const style = stamp_style || 'classic';

  try {
    const info = db.prepare('INSERT INTO photos (place_id, url, caption, is_stamp, stamp_style, cloudinary_id) VALUES (?, ?, ?, ?, ?, ?)').run(place_id, url, caption, isStampInt, style, publicId);
    console.log('Photo saved to DB, ID:', info.lastInsertRowid);
    res.json({ id: info.lastInsertRowid, place_id, url, caption, is_stamp: isStampInt, stamp_style: style });
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get photos for a place
app.get('/api/photos/:place_id', (req, res) => {
  const photos = db.prepare('SELECT * FROM photos WHERE place_id = ?').all(req.params.place_id);
  res.json(photos);
});

// Get all photos (for the album)
app.get('/api/photos', (req, res) => {
  const photos = db.prepare('SELECT photos.*, places.name as place_name, places.location as place_location FROM photos JOIN places ON photos.place_id = places.id ORDER BY photos.created_at DESC').all();
  res.json(photos);
});

// Delete a photo
app.delete('/api/photos/:id', (req, res) => {
  const { id } = req.params;
  
  const photo = db.prepare('SELECT cloudinary_id FROM photos WHERE id = ?').get(id);

  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  if (photo.cloudinary_id) {
    try {
      await cloudinary.uploader.destroy(photo.cloudinary_id);
    } catch (err) {
      console.error('Cloudinary delete error:', err);
    }
  }

  db.prepare('DELETE FROM photos WHERE id = ?').run(id);
  res.json({ message: 'Photo deleted successfully' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT} (Access via network using your IP)`);
});
