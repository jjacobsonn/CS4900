#!/usr/bin/env node
/**
 * One-shot database bootstrap for local/dev:
 * 1) database/setup.sql — creates DB `vellum` (if needed), core schema, baseline seed
 * 2) backend/db/migrations/*.sql — in filename order (idempotent where possible)
 *
 * Reads credentials from backend/.env (same keys as backend/src/config/database.js):
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 *
 * Usage (from repo root):
 *   npm run db:setup
 *
 * Requires: `psql` on PATH (PostgreSQL client).
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/** Minimal .env parser (no dependency); does not override existing process.env */
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadEnvFile(join(ROOT, "backend", ".env"));

const host = process.env.DB_HOST || "localhost";
const port = String(process.env.DB_PORT || "5432");
const user = process.env.DB_USER || "postgres";
const password = process.env.DB_PASSWORD ?? "";
const dbName = process.env.DB_NAME || "vellum";

const setupSql = join(ROOT, "database", "setup.sql");
const migrationsDir = join(ROOT, "backend", "db", "migrations");

function runPsql(database, filePath) {
  const label = filePath.replace(ROOT + "/", "");
  console.log(`\n→ psql -d ${database} -f ${label}`);
  const env = { ...process.env };
  if (password !== "") {
    env.PGPASSWORD = password;
  } else {
    delete env.PGPASSWORD;
  }
  const r = spawnSync(
    "psql",
    ["-v", "ON_ERROR_STOP=1", "-h", host, "-p", port, "-U", user, "-d", database, "-f", filePath],
    { cwd: ROOT, stdio: "inherit", env }
  );
  if (r.error) {
    console.error(r.error.message);
    process.exit(1);
  }
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

if (!existsSync(setupSql)) {
  console.error(`Missing ${setupSql}`);
  process.exit(1);
}

console.log("Vellum DB setup");
console.log(`  host=${host} port=${port} user=${user} database=${dbName}`);
if (!existsSync(join(ROOT, "backend", ".env"))) {
  console.warn("  (tip: create backend/.env from backend/.env.example to set DB_PASSWORD etc.)");
}

runPsql("postgres", setupSql);

if (!existsSync(migrationsDir)) {
  console.log("\nNo migrations directory; done.");
  process.exit(0);
}

const migrationFiles = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (migrationFiles.length === 0) {
  console.log("\nNo migration files; done.");
  process.exit(0);
}

console.log(`\nApplying ${migrationFiles.length} migration(s) to database "${dbName}"...`);
for (const f of migrationFiles) {
  runPsql(dbName, join(migrationsDir, f));
}

console.log("\n✓ Database setup complete.");
