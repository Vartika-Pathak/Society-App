import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(allowed.includes(file.mimetype) ? null : new Error('Only JPEG, PNG, WEBP, or GIF images are allowed'), allowed.includes(file.mimetype));
  }
});

const router = Router();

router.post('/', requireAuth, requireRole('admin'), upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'photo file is required' });
  const { event_name, caption } = req.body;
  if (!event_name) return res.status(400).json({ error: 'event_name is required' });

  const result = db.prepare(`
    INSERT INTO gallery_photos (uploaded_by, event_name, caption, filename)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, event_name, caption || null, req.file.filename);

  res.status(201).json(db.prepare('SELECT * FROM gallery_photos WHERE id = ?').get(result.lastInsertRowid));
});

router.get('/', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM gallery_photos ORDER BY created_at DESC, id DESC').all());
});

export default router;
