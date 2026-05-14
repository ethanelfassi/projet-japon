const db = require('./database');
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS group_members (
      group_id INTEGER,
      user_id INTEGER,
      PRIMARY KEY (group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  
  // Try adding columns one by one
  const columns = [
    "ALTER TABLE places ADD COLUMN visibility TEXT DEFAULT 'public'",
    "ALTER TABLE places ADD COLUMN created_by INTEGER",
    "ALTER TABLE places ADD COLUMN group_id INTEGER"
  ];

  for (let col of columns) {
    try {
      db.exec(col);
    } catch (e) {
      console.log('Column already exists or error:', e.message);
    }
  }

  console.log('Migration successful');
} catch (e) {
  console.log('Migration failed:', e);
}
