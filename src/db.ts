import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('data.sqlite');

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

export function seedDemoUser() {
  const email = 'demo@example.com';
  const name = 'Demo User';
  const password = 'Demo@12345';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!existing) {
    const password_hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
      .run(email, name, password_hash);
    console.log('Seeded demo user:', { email, password });
  }
}

export default db;
