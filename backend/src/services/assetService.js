/**
 * Asset Service
 * 
 * This service demonstrates how to connect to the database and retrieve asset
 * workflow data for Sprint 1 frontend flows.
 * 
 * It provides the service -> database connection pattern for:
 * - asset listing and lookup
 * - status updates
 * - asset comments
 */

import { query } from "../config/database.js";
import { getPublicFileUrl } from "../config/upload.js";

/**
 * Example API -> DB flow snippet requested in sprint outline:
 * const pool = require('./db/connection');
 * const assets = await pool.query('SELECT * FROM assets;');
 */

function mapAssetRow(row) {
  if (!row) return null;
  return {
    ...row,
    asset_type: row.asset_type ?? null,
    external_url: row.external_url ?? null,
    file_url: getPublicFileUrl(row.file_path),
    file_name: row.original_file_name ?? null,
    mime_type: row.mime_type ?? null,
    size_bytes: row.size_bytes ?? null
  };
}

/**
 * Get all assets from the database
 * 
 * This function queries the assets table and joins lookup/user data to return
 * display-ready rows for the frontend dashboard.
 * 
 * @returns {Promise<Array>} Array of asset rows with status and owner details
 */
export async function listAssets() {
  const result = await query(
    `SELECT a.id,
            a.title,
            a.description,
            a.asset_type,
            a.external_url,
            s.status_name AS status,
            a.current_version,
            a.current_version_id,
            COALESCE(u.display_name, u.email, 'Unassigned') AS owner,
            v.original_file_name,
            v.mime_type,
            v.size_bytes,
            v.file_path,
            a.created_at,
            a.updated_at
     FROM assets a
     JOIN asset_status_lookup s ON s.id = a.status_id
     LEFT JOIN users u ON u.id = a.created_by_user_id
     LEFT JOIN asset_versions v
       ON v.asset_id = a.id
      AND (v.id = a.current_version_id OR (a.current_version_id IS NULL AND v.version_number = CAST(SPLIT_PART(REPLACE(a.current_version, 'v', ''), '.', 1) AS INTEGER)))
     ORDER BY a.id DESC`
  );
  return result.rows.map(mapAssetRow);
}

/**
 * Create a new asset record
 *
 * This function inserts a new asset and defaults it to Draft status. When a
 * createdByUserId is provided, that user is recorded as the asset owner.
 *
 * @param {{ title: string, description?: string, assetType?: string|null, externalUrl?: string|null, createdByUserId?: number|null, projectId?: number|null, file?: Object|null }} payload - Asset create payload
 * @returns {Promise<Object>} Created asset response object (raw DB row)
 */
export async function createAsset(payload) {
  const status = await query(
    "SELECT id FROM asset_status_lookup WHERE status_name = 'Draft' LIMIT 1"
  );
  const statusId = status.rows[0]?.id;
  const created = await query(
    `INSERT INTO assets (title, description, asset_type, external_url, status_id, current_version, created_by_user_id, project_id)
     VALUES ($1, $2, $3, $4, $5, 'v1.0', $6, $7)
     RETURNING id`,
    [
      payload.title,
      payload.description ?? null,
      payload.assetType ?? null,
      payload.externalUrl ?? null,
      statusId,
      payload.createdByUserId ?? null,
      payload.projectId ?? null
    ]
  );
  const row = created.rows[0];
  if (!row) return null;
  // Seed an initial version row for this asset (v1)
  await query(
    `INSERT INTO asset_versions (
       asset_id,
       version_number,
       created_by_user_id,
       original_file_name,
       stored_file_name,
       mime_type,
       size_bytes,
       file_path
     )
     VALUES ($1, 1, $2, $3, $4, $5, $6, $7)`,
    [
      row.id,
      payload.createdByUserId ?? null,
      payload.file?.originalFileName ?? null,
      payload.file?.storedFileName ?? null,
      payload.file?.mimeType ?? null,
      payload.file?.sizeBytes ?? null,
      payload.file?.filePath ?? null
    ]
  );
  // Re-load via getAssetById so owner/status fields match list/get endpoints.
  const refreshed = await getAssetById(row.id);
  return refreshed;
}

/**
 * Get a single asset by ID
 * 
 * @param {number} assetId - Asset ID
 * @returns {Promise<Object|null>} Asset row or null if not found
 */
export async function getAssetById(assetId) {
  const result = await query(
    `SELECT a.id,
            a.title,
            a.description,
            a.asset_type,
            a.external_url,
            s.status_name AS status,
            a.current_version,
            a.current_version_id,
            COALESCE(u.display_name, u.email, 'Unassigned') AS owner,
            v.original_file_name,
            v.mime_type,
            v.size_bytes,
            v.file_path,
            a.created_at,
            a.updated_at
     FROM assets a
     JOIN asset_status_lookup s ON s.id = a.status_id
     LEFT JOIN users u ON u.id = a.created_by_user_id
     LEFT JOIN asset_versions v
       ON v.asset_id = a.id
      AND (v.id = a.current_version_id OR (a.current_version_id IS NULL AND v.version_number = CAST(SPLIT_PART(REPLACE(a.current_version, 'v', ''), '.', 1) AS INTEGER)))
     WHERE a.id = $1`,
    [assetId]
  );
  return mapAssetRow(result?.rows?.[0] ?? null);
}

/**
 * List all versions for a given asset.
 *
 * @param {number} assetId - Asset ID
 * @returns {Promise<Array>} Ordered list of versions (oldest first)
 */
export async function listAssetVersions(assetId) {
  const result = await query(
    `SELECT v.id,
            v.asset_id,
            v.version_number,
            v.created_at,
            v.label,
            v.notes,
            COALESCE(u.display_name, u.email, 'Unknown') AS created_by,
            v.original_file_name,
            v.mime_type,
            v.size_bytes,
            v.file_path
     FROM asset_versions v
     LEFT JOIN users u ON u.id = v.created_by_user_id
     WHERE v.asset_id = $1
     ORDER BY v.version_number ASC`,
    [assetId]
  );
  return result.rows.map((row) => ({
    ...row,
    file_url: getPublicFileUrl(row.file_path)
  }));
}

/**
 * Delete an asset by id (cascades to comments/versions via FK constraints).
 *
 * @param {number} assetId - Asset ID
 * @returns {Promise<Object|null>} Deleted row id or null if not found
 */
export async function deleteAssetById(assetId) {
  const result = await query("DELETE FROM assets WHERE id = $1 RETURNING id", [assetId]);
  return result.rows[0] ?? null;
}

/**
 * Add a comment to an asset
 * 
 * @param {number} assetId - Asset ID
 * @param {{ message: string, commentType?: string, authorUserId?: number|null }} payload - Comment payload
 * @returns {Promise<Object>} Inserted comment row
 */
export async function addAssetComment(assetId, payload) {
  const commentType = await query(
    "SELECT id FROM comment_type_lookup WHERE type_name = $1 LIMIT 1",
    [payload.commentType ?? "General"]
  );
  const typeId = commentType.rows[0]?.id;
  const authorUserId = payload.authorUserId ?? null;
  const inserted = await query(
    `INSERT INTO asset_comments (asset_id, author_user_id, comment_type_id, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, asset_id, message, created_at`,
    [assetId, authorUserId, typeId, payload.message]
  );
  const row = inserted.rows[0];
  if (!row) return null;
  let author = "Unknown";
  if (authorUserId) {
    const u = await query(
      "SELECT COALESCE(display_name, email, 'Unknown') AS author FROM users WHERE id = $1",
      [authorUserId]
    );
    author = u.rows[0]?.author ?? "Unknown";
  }
  return { id: row.id, asset_id: row.asset_id, message: row.message, created_at: row.created_at, author };
}

/**
 * Get all comments for a specific asset
 * 
 * @param {number} assetId - Asset ID
 * @returns {Promise<Array>} Ordered list of comments for the asset
 */
export async function listAssetComments(assetId) {
  const result = await query(
    `SELECT c.id, c.asset_id, c.message, c.created_at,
            COALESCE(u.display_name, u.email, 'Unknown') AS author
     FROM asset_comments c
     LEFT JOIN users u ON u.id = c.author_user_id
     WHERE c.asset_id = $1
     ORDER BY c.created_at ASC`,
    [assetId]
  );
  return result.rows;
}

/**
 * Delete a single asset comment by id.
 *
 * @param {number} commentId - Comment ID
 * @returns {Promise<Object|null>} Deleted row id or null if not found
 */
export async function deleteAssetCommentById(commentId) {
  const result = await query("DELETE FROM asset_comments WHERE id = $1 RETURNING id", [commentId]);
  return result.rows[0] ?? null;
}

/**
 * Update the primary owner (created_by_user_id) for an asset.
 *
 * @param {number} assetId - Asset ID
 * @param {number|null} userId - New owner user id, or null to unassign
 * @returns {Promise<Object|null>} Updated asset row or null if not found
 */
export async function setAssetOwner(assetId, userId) {
  const result = await query(
    "UPDATE assets SET created_by_user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id",
    [userId, assetId]
  );
  if (result.rows.length === 0) return null;
  return getAssetById(assetId);
}

/**
 * Create a new version for an existing asset.
 *
 * This increments the version_number for the asset, creates an asset_versions row,
 * and moves the asset status back to "In Review" so it appears in review queues.
 *
 * @param {number} assetId - Asset ID
 * @param {{ label?: string, notes?: string, createdByUserId?: number|null, file?: Object|null }} payload
 * @returns {Promise<Object|null>} Newly created version row
 */
export async function createAssetVersion(assetId, payload) {
  // Determine next version number
  const max = await query(
    "SELECT COALESCE(MAX(version_number), 0) AS max_version FROM asset_versions WHERE asset_id = $1",
    [assetId]
  );
  const nextVersion = Number(max.rows[0]?.max_version ?? 0) + 1;

  const inserted = await query(
    `INSERT INTO asset_versions (
       asset_id,
       version_number,
       created_by_user_id,
       label,
       notes,
       original_file_name,
       stored_file_name,
       mime_type,
       size_bytes,
       file_path
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, asset_id, version_number, created_at, original_file_name, mime_type, size_bytes, file_path`,
    [
      assetId,
      nextVersion,
      payload.createdByUserId ?? null,
      payload.label ?? null,
      payload.notes ?? null,
      payload.file?.originalFileName ?? null,
      payload.file?.storedFileName ?? null,
      payload.file?.mimeType ?? null,
      payload.file?.sizeBytes ?? null,
      payload.file?.filePath ?? null
    ]
  );
  const row = inserted.rows[0];
  if (!row) return null;

  // Move asset status back to In Review and bump current_version string
  const status = await query(
    "SELECT id FROM asset_status_lookup WHERE status_name = 'In Review' LIMIT 1"
  );
  const statusId = status.rows[0]?.id ?? null;
  if (statusId) {
    await query(
      `UPDATE assets
       SET status_id = $1,
           current_version = $2,
           current_version_id = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [statusId, `v${nextVersion}.0`, row.id, assetId]
    );
  }

  return {
    ...row,
    file_url: getPublicFileUrl(row.file_path)
  };
}

/**
 * Internal-only workflow statuses for Sprint 2 (initial slice).
 *
 * These are enforced at the service layer to avoid arbitrary status values.
 */
const INTERNAL_STATUS_MAP = {
  // key           // canonical DB status_name
  draft: "Draft",
  in_progress: "In Progress",
  ready_for_internal_review: "Ready for Internal Review",
  in_internal_review: "In Internal Review",
  changes_requested_internal: "Changes Requested (Internal)",
  approved_internal: "Approved (Internal)"
};

// Allowed state transitions for the initial internal-only workflow slice.
const INTERNAL_STATUS_TRANSITIONS = {
  Draft: new Set(["In Progress", "Ready for Internal Review"]),
  "In Progress": new Set(["Ready for Internal Review"]),
  "Ready for Internal Review": new Set(["In Internal Review"]),
  "In Internal Review": new Set(["Changes Requested (Internal)", "Approved (Internal)"]),
  "Changes Requested (Internal)": new Set(["In Progress", "Ready for Internal Review"]),
  "Approved (Internal)": new Set([]) // terminal for internal-only slice
};

/**
 * Update asset status
 *
 * For Sprint 2's internal-only slice, this function:
 * - Accepts a normalized internal status key (e.g., "in_progress").
 * - Maps it to the canonical status_name in asset_status_lookup.
 * - Enforces allowed transitions based on current status.
 *
 * @param {number} assetId - Asset ID
 * @param {string} statusKey - New internal status key
 * @returns {Promise<Object|null|{invalidStatus: boolean, reason?: string}>}
 *          Updated asset, null if not found, or invalidStatus marker
 */
export async function updateAssetStatus(assetId, statusKey) {
  const canonicalName = INTERNAL_STATUS_MAP[statusKey];
  if (!canonicalName) {
    return { invalidStatus: true, reason: "Unknown internal status key" };
  }

  // Load current status for this asset to enforce transitions.
  const current = await query(
    `SELECT s.status_name
     FROM assets a
     JOIN asset_status_lookup s ON s.id = a.status_id
     WHERE a.id = $1`,
    [assetId]
  );
  if (current.rows.length === 0) {
    return null;
  }
  const currentStatusName = current.rows[0].status_name;
  const allowedNext = INTERNAL_STATUS_TRANSITIONS[currentStatusName];
  if (!allowedNext || !allowedNext.has(canonicalName)) {
    return { invalidStatus: true, reason: "Illegal status transition" };
  }

  const valid = await query(
    "SELECT id, status_name FROM asset_status_lookup WHERE status_name = $1",
    [canonicalName]
  );
  if (valid.rows.length === 0) {
    return { invalidStatus: true, reason: "Status not configured in lookup" };
  }

  const updated = await query(
    `UPDATE assets
     SET status_id = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id`,
    [valid.rows[0].id, assetId]
  );

  if (updated.rows.length === 0) {
    return null;
  }

  const refreshed = await getAssetById(assetId);
  if (!refreshed) {
    return null;
  }

  return refreshed;
}

/**
 * Update asset title and/or description. Admin only at route layer.
 *
 * @param {number} assetId - Asset ID
 * @param {{ title?: string, description?: string }} payload
 * @returns {Promise<Object|null>} Updated asset or null if not found
 */
export async function updateAsset(assetId, payload) {
  const updates = [];
  const values = [];
  let i = 1;
  if (payload.title !== undefined && typeof payload.title === "string") {
    updates.push(`title = $${i++}`);
    values.push(payload.title.trim() || null);
  }
  if (payload.description !== undefined) {
    updates.push(`description = $${i++}`);
    values.push(payload.description === "" || payload.description == null ? null : String(payload.description));
  }
  if (updates.length === 0) return getAssetById(assetId);
  values.push(assetId);
  const result = await query(
    `UPDATE assets SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${i} RETURNING id`,
    values
  );
  if (result.rows.length === 0) return null;
  return getAssetById(assetId);
}

/**
 * Update a version's metadata and optionally replace or remove its file.
 * Admin only at route layer.
 *
 * @param {number} assetId - Asset ID
 * @param {number} versionId - Version ID
 * @param {{ label?: string, notes?: string, file?: Object|null, removeFile?: boolean }} payload
 * @param {number|null} performedByUserId - For audit
 * @returns {Promise<Object|null>} Updated version row or null
 */
export async function updateAssetVersion(assetId, versionId, payload, performedByUserId = null) {
  const version = await query(
    "SELECT id, asset_id, version_number FROM asset_versions WHERE id = $1 AND asset_id = $2",
    [versionId, assetId]
  );
  if (version.rows.length === 0) return null;

  const updates = [];
  const values = [];
  let i = 1;
  if (payload.label !== undefined) {
    updates.push(`label = $${i++}`);
    values.push(payload.label === "" || payload.label == null ? null : String(payload.label));
  }
  if (payload.notes !== undefined) {
    updates.push(`notes = $${i++}`);
    values.push(payload.notes === "" || payload.notes == null ? null : String(payload.notes));
  }
  if (payload.removeFile === true) {
    updates.push("original_file_name = NULL", "stored_file_name = NULL", "mime_type = NULL", "size_bytes = NULL", "file_path = NULL");
  } else if (payload.file) {
    updates.push(
      "original_file_name = $" + i,
      "stored_file_name = $" + (i + 1),
      "mime_type = $" + (i + 2),
      "size_bytes = $" + (i + 3),
      "file_path = $" + (i + 4)
    );
    values.push(
      payload.file.originalFileName ?? null,
      payload.file.storedFileName ?? null,
      payload.file.mimeType ?? null,
      payload.file.sizeBytes ?? null,
      payload.file.filePath ?? null
    );
    i += 5;
  }
  if (updates.length > 0) {
    values.push(versionId);
    await query(
      `UPDATE asset_versions SET ${updates.join(", ")} WHERE id = $${i}`,
      values
    );
  }
  const updated = await query(
    `SELECT v.id, v.asset_id, v.version_number, v.created_at, v.original_file_name, v.mime_type, v.size_bytes, v.file_path
     FROM asset_versions v WHERE v.id = $1`,
    [versionId]
  );
  const row = updated.rows[0];
  if (!row) return null;
  const out = { ...row, file_url: getPublicFileUrl(row.file_path) };
  return out;
}

/**
 * Delete a version. If it was the current version, asset's current_version is set to the previous version.
 * Admin only at route layer.
 *
 * @param {number} assetId - Asset ID
 * @param {number} versionId - Version ID
 * @returns {Promise<{ deleted: boolean }>}
 */
export async function deleteAssetVersionById(assetId, versionId) {
  const version = await query(
    "SELECT id, version_number FROM asset_versions WHERE id = $1 AND asset_id = $2",
    [versionId, assetId]
  );
  if (version.rows.length === 0) return { deleted: false };
  const currentVersionId = (await query("SELECT current_version_id FROM assets WHERE id = $1", [assetId])).rows[0]?.current_version_id;
  await query("DELETE FROM asset_versions WHERE id = $1", [versionId]);
  if (currentVersionId === versionId) {
    const prev = await query(
      "SELECT id, version_number FROM asset_versions WHERE asset_id = $1 ORDER BY version_number DESC LIMIT 1",
      [assetId]
    );
    const nextId = prev.rows[0]?.id ?? null;
    const nextNum = prev.rows[0]?.version_number ?? 1;
    await query(
      `UPDATE assets SET current_version_id = $1, current_version = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [nextId, `v${nextNum}.0`, assetId]
    );
  }
  return { deleted: true };
}

/**
 * List audit log entries for an asset's versions. Admin only.
 *
 * @param {number} assetId - Asset ID
 * @returns {Promise<Array>}
 */
export async function listVersionAudit(assetId) {
  const result = await query(
    `SELECT a.id, a.asset_id, a.asset_version_id, a.action, a.performed_at, a.details,
            COALESCE(u.display_name, u.email, 'Unknown') AS performed_by
     FROM asset_version_audit a
     LEFT JOIN users u ON u.id = a.performed_by_user_id
     WHERE a.asset_id = $1
     ORDER BY a.performed_at DESC`,
    [assetId]
  );
  return result.rows;
}
