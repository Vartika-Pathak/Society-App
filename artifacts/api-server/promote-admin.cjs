const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.resolve(__dirname, "..", "..", "data", "pavilion.db");
console.log("Using DB at:", dbPath);

const db = new Database(dbPath);
const email = "vartikap982@gmail.com";

const before = db.prepare("SELECT id, email, role FROM users WHERE email = ?").get(email);
console.log("before:", before);

if (!before) {
  console.log("No user found with that email — signup may not have saved, or the email doesn't match exactly.");
} else {
  const result = db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);
  console.log("rows updated:", result.changes);

  const after = db.prepare("SELECT id, email, role FROM users WHERE email = ?").get(email);
  console.log("after:", after);
}