#!/usr/bin/env node
/**
 * Restore a Vellum snapshot into a target (usually hosted) PostgreSQL DB.
 *
 * Usage:
 *   npm run db:snapshot:import -- /absolute/or/relative/path/to/file.dump
 *
 * Required target env vars:
 *   TARGET_DB_HOST
 *   TARGET_DB_PORT (default 5432)
 *   TARGET_DB_NAME
 *   TARGET_DB_USER
 *   TARGET_DB_PASSWORD
 *
 * Optional:
 *   TARGET_DB_SSLMODE (example: require)
 */

import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

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

const dumpArg = process.argv[2];
if (!dumpArg) {
  console.error("Usage: npm run db:snapshot:import -- <path-to.dump>");
  process.exit(1);
}

const dumpPath = dumpArg.startsWith("/") ? dumpArg : join(ROOT, dumpArg);
if (!existsSync(dumpPath)) {
  console.error(`Dump file not found: ${dumpPath}`);
  process.exit(1);
}

const targetHost = process.env.TARGET_DB_HOST;
const targetPort = String(process.env.TARGET_DB_PORT || "5432");
const targetName = process.env.TARGET_DB_NAME;
const targetUser = process.env.TARGET_DB_USER;
const targetPassword = process.env.TARGET_DB_PASSWORD ?? "";
const targetSslMode = process.env.TARGET_DB_SSLMODE;

if (!targetHost || !targetName || !targetUser) {
  console.error("Missing target DB configuration.");
  console.error("Required: TARGET_DB_HOST, TARGET_DB_NAME, TARGET_DB_USER, TARGET_DB_PASSWORD");
  process.exit(1);
}

const env = { ...process.env };
if (targetPassword !== "") {
  env.PGPASSWORD = targetPassword;
} else {
  delete env.PGPASSWORD;
}
if (targetSslMode) {
  env.PGSSLMODE = targetSslMode;
}

console.log(`Restoring snapshot into ${targetName} on ${targetHost}:${targetPort}...`);
const restoreArgs = [
  "-h", targetHost,
  "-p", targetPort,
  "-U", targetUser,
  "-d", targetName,
  "--no-owner",
  "--no-privileges",
  "--clean",
  "--if-exists",
  dumpPath
];

const restoreResult = spawnSync("pg_restore", restoreArgs, {
  cwd: ROOT,
  stdio: "inherit",
  env
});

if (restoreResult.error) {
  console.error(restoreResult.error.message);
  process.exit(1);
}
if (restoreResult.status !== 0) {
  process.exit(restoreResult.status ?? 1);
}

console.log("\nRestore complete.");
console.log("Next step: run `npm run db:deploy` against that target DB to ensure all repo migrations are current.");
