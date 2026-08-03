import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import * as schema from "./schema";

// Consumers either import this package's source directly (tsx, no bundler) or bundle it
// into their own single-file output (api-server's esbuild step) — in the bundled case,
// import.meta.url points at wherever the *bundle* physically ends up, not this file's
// original location, so a fixed "../../whatever" relative path silently resolves to the
// wrong place depending on how deep the bundle happens to sit. Walking up to the actual
// monorepo root (marked by pnpm-workspace.yaml) and resolving from there works either way.
function findRepoRoot(startDir: string): string {
  let dir = startDir;
  while (!fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not locate the monorepo root (no pnpm-workspace.yaml found above ${startDir})`,
      );
    }
    dir = parent;
  }
  return dir;
}

const repoRoot = findRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
const dbPath = process.env.DATABASE_PATH ?? path.join(repoRoot, "data/pavilion.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
export const db = drizzle(sqlite, { schema });

// Applies drizzle/*.sql on every startup — a no-op once already applied (drizzle tracks
// this itself in a __drizzle_migrations table). This is what actually creates the schema
// on a brand new database (e.g. a fresh deploy with no shell access to run `db:push`
// manually) instead of relying on someone remembering a separate manual step.
migrate(db, { migrationsFolder: path.join(repoRoot, "lib/db/drizzle") });

export * from "./schema";
export { seedEvents } from "./seed";
