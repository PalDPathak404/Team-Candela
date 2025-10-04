import { Router } from 'express';
import db from '../db.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendPasswordEmail } from '../services/mailer.ts';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '1h' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body ?? {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    // respond with 200 to avoid user enumeration
    return res.json({ message: 'If the email exists, a password has been sent' });
  }
  const newPassword = generateRandomPassword();
  const password_hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, user.id);

  sendPasswordEmail(email, newPassword)
    .then(() => {
      res.json({ message: 'If the email exists, a password has been sent' });
    })
    .catch((err) => {
      console.error('Failed to send email', err);
      res.status(500).json({ error: 'Failed to send email' });
    });
});

function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

export default router;
