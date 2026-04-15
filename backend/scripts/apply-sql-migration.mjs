/**
 * Applies a single .sql migration file using DB_* from .env (same as the API).
 * Prefer the repo-wide command from the project root: `npm run db:deploy`
 * (applies every file in backend/db/migrations in order). Use this script only
 * for one-off debugging.
 *
 * Usage: node scripts/apply-sql-migration.mjs db/migrations/example.sql
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
import dotenv from "dotenv";

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const rel = process.argv[2];
if (!rel) {
  console.error("Usage: node scripts/apply-sql-migration.mjs <path-to.sql>");
  process.exit(1);
}

const filePath = path.isAbsolute(rel) ? rel : path.join(__dirname, "..", rel);
const sql = fs.readFileSync(filePath, "utf8");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "vellum",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD
});

try {
  await pool.query(sql);
  console.log("Migration applied:", rel);
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
