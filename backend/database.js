const { Pool } = require('pg');
const fs = require('fs');

const isDocker = fs.existsSync('/.dockerenv');
let dbUrl = process.env.DATABASE_URL;

if (isDocker && dbUrl) {
  dbUrl = dbUrl
    .replace('://localhost', '://host.docker.internal')
    .replace('://127.0.0.1', '://host.docker.internal');
}

// Only use SSL for external databases (like Neon) and not local ones
const useSSL = dbUrl && !dbUrl.includes('@db') && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1') && !dbUrl.includes('host.docker.internal');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id INTEGER REFERENCES groups(id),
      user_id INTEGER REFERENCES users(id),
      PRIMARY KEY (group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS places (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      type TEXT DEFAULT 'place',
      status TEXT DEFAULT 'planned',
      lat REAL,
      lng REAL,
      visibility TEXT DEFAULT 'public',
      created_by INTEGER REFERENCES users(id),
      group_id INTEGER REFERENCES groups(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS photos (
      id SERIAL PRIMARY KEY,
      place_id INTEGER REFERENCES places(id),
      url TEXT NOT NULL,
      caption TEXT,
      is_stamp INTEGER DEFAULT 0,
      stamp_style TEXT DEFAULT 'classic',
      cloudinary_id TEXT,
      media_type TEXT DEFAULT 'photo',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS photo_comments (
      id SERIAL PRIMARY KEY,
      photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`ALTER TABLE photos ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'photo'`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'visiteur'`);
  await pool.query(`
    UPDATE users SET role = 'admin'
    WHERE id = (SELECT MIN(id) FROM users)
    AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')
  `);

  const { rows } = await pool.query('SELECT COUNT(*) as count FROM places');
  if (parseInt(rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO places (name, description, location) VALUES
      ('Tokyo - Akihabara', 'The electric town, perfect for gadgets and anime.', 'Tokyo'),
      ('Kyoto - Fushimi Inari', 'Famous for its thousands of vermilion torii gates.', 'Kyoto'),
      ('Osaka - Dotonbori', 'Famous for street food and neon lights.', 'Osaka')
    `);
  }
};

module.exports = { pool, initDb };
