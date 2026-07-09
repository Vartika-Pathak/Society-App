import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken } from '../auth.js';

const router = Router();

router.post('/signup', (req, res) => {
  const { name, email, phone, password, role, flat_number } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, and role are required' });
  }
  if (!['resident', 'guard', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be resident, guard, or admin' });
  }
  if (role === 'resident' && !flat_number) {
    return res.status(400).json({ error: 'flat_number is required for residents' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, flat_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, email, phone || null, password_hash, role, flat_number || null);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

function publicUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

export default router;
