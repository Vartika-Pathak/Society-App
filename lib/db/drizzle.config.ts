import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_PATH ?? path.join(__dirname, "../../data/pavilion.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
