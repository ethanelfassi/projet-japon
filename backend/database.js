const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
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
