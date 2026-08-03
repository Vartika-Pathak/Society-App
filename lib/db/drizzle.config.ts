import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_PATH ?? path.join(__dirname, "../../data/pavilion.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export default defineConfig({
  // Plain forward-slash relative path (resolved by drizzle-kit relative to
  // this config file). Do NOT build this with path.join(__dirname, ...) —
  // drizzle-kit resolves `schema` via glob matching, and on Windows
  // path.join produces backslash-separated paths, which glob libraries
  // treat as escape characters and silently corrupt the path.
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
