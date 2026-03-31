import { query } from "../config/database.js";

/**
 * Append-only project timeline (status changes, etc.).
 * @param {number} projectId
 * @param {{ limit?: number }} [opts]
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function listProjectActivity(projectId, { limit = 100 } = {}) {
  const cap = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const result = await query(
    `SELECT id,
            project_id,
            event_type,
            summary,
            details,
            actor_user_id,
            created_at
     FROM project_activity
     WHERE project_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [projectId, cap]
  );
  return result.rows;
}
