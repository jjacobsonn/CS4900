#!/usr/bin/env node
/**
 * Load Render target credentials from backend/.env.render.sync (override),
 * run db:snapshot:ship (local export + hosted restore), then migrations on hosted DB.
 *
 * Prereq: backend/.env.render.sync (copy from .env.render.sync.example)
 *
 * Usage (repo root):
 *   npm run db:render:sync
 */

import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SYNC = join(ROOT, "backend", ".env.render.sync");

function loadOverrideEnv(filePath) {
  if (!existsSync(filePath)) {
    console.error(`Missing ${filePath}`);
    console.error("Copy backend/.env.render.sync.example → backend/.env.render.sync and fill TARGET_DB_* (External host + password).");
    process.exit(1);
  }
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
    if (key) process.env[key] = val;
  }
}

loadOverrideEnv(SYNC);

const required = ["TARGET_DB_HOST", "TARGET_DB_NAME", "TARGET_DB_USER", "TARGET_DB_PASSWORD"];
for (const k of required) {
  if (!process.env[k]?.trim()) {
    console.error(`Set ${k} in backend/.env.render.sync`);
    process.exit(1);
  }
}

function runNode(rel, args = []) {
  const r = spawnSync(process.execPath, [join(ROOT, rel), ...args], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env }
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("→ Step 1/2: export local DB + restore to Render (db-snapshot-ship)…");
runNode("scripts/db-snapshot-ship.mjs");

process.env.DB_HOST = process.env.TARGET_DB_HOST;
process.env.DB_PORT = process.env.TARGET_DB_PORT || "5432";
process.env.DB_NAME = process.env.TARGET_DB_NAME;
process.env.DB_USER = process.env.TARGET_DB_USER;
process.env.DB_PASSWORD = process.env.TARGET_DB_PASSWORD;
process.env.PGSSLMODE = process.env.TARGET_DB_SSLMODE || "require";

console.log("→ Step 2/2: apply SQL migrations on hosted DB…");
const r = spawnSync("node", [join(ROOT, "scripts", "db-setup.mjs"), "--migrations-only"], {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env }
});
if (r.status !== 0) process.exit(r.status ?? 1);

console.log("\nDone. Verify with:");
console.log('  render psql vellum-postgres -c "SELECT COUNT(*) FROM users;" -o text');
