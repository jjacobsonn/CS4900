#!/usr/bin/env node
/**
 * One-command shipping flow:
 * 1) Export current local DB snapshot
 * 2) Import latest snapshot into target hosted DB
 *
 * Usage:
 *   npm run db:snapshot:ship
 *
 * Required target env vars:
 *   TARGET_DB_HOST, TARGET_DB_NAME, TARGET_DB_USER, TARGET_DB_PASSWORD
 * Optional:
 *   TARGET_DB_PORT=5432
 *   TARGET_DB_SSLMODE=require
 */

import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function runNodeScript(scriptName, args = []) {
  const result = spawnSync("node", [join(ROOT, "scripts", scriptName), ...args], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env }
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function latestDumpPath() {
  const backupsDir = join(ROOT, process.env.SNAPSHOT_DIR || "backups");
  const dumps = readdirSync(backupsDir)
    .filter((name) => name.endsWith(".dump"))
    .sort();
  if (dumps.length === 0) {
    console.error(`No .dump files found in ${backupsDir}`);
    process.exit(1);
  }
  return join(backupsDir, dumps[dumps.length - 1]);
}

if (
  !process.env.TARGET_DB_HOST ||
  !process.env.TARGET_DB_NAME ||
  !process.env.TARGET_DB_USER ||
  process.env.TARGET_DB_PASSWORD === undefined
) {
  console.error("Missing target DB env vars for shipping.");
  console.error("Required: TARGET_DB_HOST, TARGET_DB_NAME, TARGET_DB_USER, TARGET_DB_PASSWORD");
  process.exit(1);
}

console.log("Step 1/2: exporting local snapshot...");
runNodeScript("db-snapshot-export.mjs");

const dump = latestDumpPath();
console.log(`Step 2/2: importing latest snapshot into target DB...\n- ${dump}`);
runNodeScript("db-snapshot-import.mjs", [dump]);

console.log("\nDone. Semester data has been shipped to the target database.");
console.log("Recommended follow-up on target environment: npm run db:deploy");
