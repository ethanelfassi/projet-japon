const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'japan_trip.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    type TEXT DEFAULT 'place', -- 'place' or 'activity'
    status TEXT DEFAULT 'planned', -- 'planned' or 'visited'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id INTEGER,
    url TEXT NOT NULL,
    caption TEXT,
    is_stamp INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (place_id) REFERENCES places(id)
  );
`);

// Add some initial data if empty
const rowCount = db.prepare('SELECT count(*) as count FROM places').get();
if (rowCount.count === 0) {
  const insert = db.prepare('INSERT INTO places (name, description, location) VALUES (?, ?, ?)');
  insert.run('Tokyo - Akihabara', 'The electric town, perfect for gadgets and anime.', 'Tokyo');
  insert.run('Kyoto - Fushimi Inari', 'Famous for its thousands of vermilion torii gates.', 'Kyoto');
  insert.run('Osaka - Dotonbori', 'Famous for street food and neon lights.', 'Osaka');
}

module.exports = db;
