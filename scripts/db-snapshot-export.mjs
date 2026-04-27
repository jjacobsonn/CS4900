#!/usr/bin/env node
/**
 * Export a full Vellum snapshot for hosting migration:
 * - PostgreSQL schema + data as custom-format dump (.dump)
 * - Optional upload files archive (.tar.gz) from backend/uploads
 *
 * Usage:
 *   npm run db:snapshot:export
 *
 * Optional env overrides:
 *   SNAPSHOT_DIR=backups
 *   SNAPSHOT_PREFIX=vellum-semester
 *   INCLUDE_UPLOADS=true|false   (default: true)
 */

import { existsSync, mkdirSync } from "fs";
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

const host = process.env.DB_HOST || "localhost";
const port = String(process.env.DB_PORT || "5432");
const user = process.env.DB_USER || "postgres";
const password = process.env.DB_PASSWORD ?? "";
const dbName = process.env.DB_NAME || "vellum";

const snapshotDir = join(ROOT, process.env.SNAPSHOT_DIR || "backups");
const prefix = process.env.SNAPSHOT_PREFIX || "vellum-semester";
const includeUploads = (process.env.INCLUDE_UPLOADS || "true").toLowerCase() !== "false";
const uploadsDir = join(ROOT, "backend", "uploads");

const stamp = new Date().toISOString().replaceAll(":", "-");
const dumpPath = join(snapshotDir, `${prefix}-${stamp}.dump`);
const uploadsArchivePath = join(snapshotDir, `${prefix}-${stamp}-uploads.tar.gz`);

mkdirSync(snapshotDir, { recursive: true });

const env = { ...process.env };
if (password !== "") {
  env.PGPASSWORD = password;
} else {
  delete env.PGPASSWORD;
}

console.log(`Exporting database snapshot from "${dbName}"...`);
const dumpArgs = [
  "-h", host,
  "-p", port,
  "-U", user,
  "-d", dbName,
  "-Fc",
  "-f", dumpPath
];
const dumpResult = spawnSync("pg_dump", dumpArgs, { cwd: ROOT, stdio: "inherit", env });
if (dumpResult.error) {
  console.error(dumpResult.error.message);
  process.exit(1);
}
if (dumpResult.status !== 0) {
  process.exit(dumpResult.status ?? 1);
}

if (includeUploads && existsSync(uploadsDir)) {
  console.log("Archiving backend uploads...");
  const tarResult = spawnSync(
    "tar",
    ["-czf", uploadsArchivePath, "-C", join(ROOT, "backend"), "uploads"],
    { cwd: ROOT, stdio: "inherit" }
  );
  if (tarResult.error) {
    console.error(tarResult.error.message);
    process.exit(1);
  }
  if (tarResult.status !== 0) {
    process.exit(tarResult.status ?? 1);
  }
} else if (includeUploads) {
  console.log("Skipping uploads archive (backend/uploads not found).");
}

console.log("\nSnapshot complete:");
console.log(`- DB dump: ${dumpPath}`);
if (includeUploads) {
  if (existsSync(uploadsDir)) {
    console.log(`- Upload archive: ${uploadsArchivePath}`);
  } else {
    console.log("- Upload archive: skipped");
  }
}
