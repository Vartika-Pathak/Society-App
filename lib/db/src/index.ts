import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as schema from "./schema";

// import.meta.url rather than __dirname: this package is "type": "module", and __dirname
// doesn't exist in native ESM (only in CommonJS, or when a bundler shims it in) — this way
// path resolution works the same whether a consumer bundles this or imports it directly.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH ?? path.join(dirname, "../../../data/pavilion.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
export const db = drizzle(sqlite, { schema });

export * from "./schema";
