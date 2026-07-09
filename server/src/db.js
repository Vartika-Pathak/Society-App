import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'society.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('resident','guard','admin')),
  flat_number TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resident_id INTEGER NOT NULL REFERENCES users(id),
  visitor_type TEXT NOT NULL DEFAULT 'guest' CHECK (visitor_type IN ('guest','cab_delivery','household_help','maintenance_service')),
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  reference_code TEXT,
  id_card_number TEXT,
  scheduled_date TEXT,
  scheduled_start TEXT,
  scheduled_end TEXT,
  otp_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','used','expired')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staff_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  id_card_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('household_help','maintenance_vendor')),
  flat_number TEXT,
  shift_start TEXT NOT NULL DEFAULT '06:00',
  shift_end TEXT NOT NULL DEFAULT '21:00',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_name TEXT NOT NULL,
  flat_number TEXT,
  scheduled_date TEXT NOT NULL,
  scheduled_start TEXT NOT NULL,
  scheduled_end TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  visitor_type TEXT NOT NULL CHECK (visitor_type IN ('guest','cab_delivery','household_help','maintenance_service','emergency')),
  flat_number TEXT NOT NULL,
  invite_id INTEGER REFERENCES invites(id),
  staff_id INTEGER REFERENCES staff_registry(id),
  service_request_id INTEGER REFERENCES service_requests(id),
  status TEXT NOT NULL CHECK (status IN (
    'awaiting_resident','awaiting_admin','approved','denied','on_premises','departed'
  )),
  identifiable INTEGER,
  verified INTEGER,
  reference_code TEXT,
  resident_notified_at TEXT,
  entry_time TEXT,
  exit_time TEXT,
  decided_by_user_id INTEGER REFERENCES users(id),
  decision_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL REFERENCES visits(id),
  event_type TEXT NOT NULL,
  actor_role TEXT,
  actor_id INTEGER,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Add columns to invites for pre-existing DBs created before category support was added.
function ensureColumn(table, column, definition) {
  const existing = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!existing.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
ensureColumn('invites', 'visitor_type', "TEXT NOT NULL DEFAULT 'guest'");
ensureColumn('invites', 'reference_code', 'TEXT');
ensureColumn('invites', 'id_card_number', 'TEXT');
ensureColumn('invites', 'scheduled_date', 'TEXT');
ensureColumn('invites', 'scheduled_start', 'TEXT');
ensureColumn('invites', 'scheduled_end', 'TEXT');

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, flat_number)
    VALUES (@name, @email, @phone, @password_hash, @role, @flat_number)
  `);

  const demoPassword = bcrypt.hashSync('password123', 10);

  insertUser.run({
    name: 'Riya Sharma', email: 'resident@demo.com', phone: '9000000001',
    password_hash: demoPassword, role: 'resident', flat_number: 'A-101'
  });
  insertUser.run({
    name: 'Gate Guard', email: 'guard@demo.com', phone: '9000000002',
    password_hash: demoPassword, role: 'guard', flat_number: null
  });
  insertUser.run({
    name: 'Society Admin', email: 'admin@demo.com', phone: '9000000003',
    password_hash: demoPassword, role: 'admin', flat_number: null
  });

  db.prepare(`
    INSERT INTO staff_registry (name, id_card_number, category, flat_number, shift_start, shift_end)
    VALUES ('Sunita Devi', 'HH-1001', 'household_help', 'A-101', '07:00', '19:00')
  `).run();

  const today = new Date().toISOString().slice(0, 10);
  db.prepare(`
    INSERT INTO service_requests (vendor_name, flat_number, scheduled_date, scheduled_start, scheduled_end)
    VALUES ('CoolFix AC Repair', 'A-101', ?, '09:00', '17:00')
  `).run(today);

  console.log('Seeded demo data. Demo logins (password: password123):');
  console.log('  resident@demo.com / guard@demo.com / admin@demo.com');
}

seed();
