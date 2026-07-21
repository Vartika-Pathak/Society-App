import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_PATH ?? path.join(__dirname, "../../../data/pavilion.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
export const db = drizzle(sqlite, { schema });

export * from "./schema";
