const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// API Endpoints

// Get all places
app.get('/api/places', (req, res) => {
  const places = db.prepare('SELECT * FROM places ORDER BY created_at DESC').all();
  res.json(places);
});

// Add a new place/activity
app.post('/api/places', (req, res) => {
  const { name, description, location, type } = req.body;
  const info = db.prepare('INSERT INTO places (name, description, location, type) VALUES (?, ?, ?, ?)').run(name, description, location, type || 'place');
  res.json({ id: info.lastInsertRowid, name, description, location, type: type || 'place', status: 'planned' });
});

// Update place status
app.patch('/api/places/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE places SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Status updated' });
});

// Upload photo
app.post('/api/photos', upload.single('photo'), (req, res) => {
  const { place_id, caption, is_stamp } = req.body;
  const url = `/uploads/${req.file.filename}`;
  const isStampInt = is_stamp === 'true' || is_stamp === 1 ? 1 : 0;
  const info = db.prepare('INSERT INTO photos (place_id, url, caption, is_stamp) VALUES (?, ?, ?, ?)').run(place_id, url, caption, isStampInt);
  res.json({ id: info.lastInsertRowid, place_id, url, caption, is_stamp: isStampInt });
});

// Get photos for a place
app.get('/api/photos/:place_id', (req, res) => {
  const photos = db.prepare('SELECT * FROM photos WHERE place_id = ?').all(req.params.place_id);
  res.json(photos);
});

// Get all photos (for the album)
app.get('/api/photos', (req, res) => {
  const photos = db.prepare('SELECT photos.*, places.name as place_name FROM photos JOIN places ON photos.place_id = places.id ORDER BY photos.created_at DESC').all();
  res.json(photos);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT} (Access via network using your IP)`);
});
