import { query } from "../config/database.js";

/**
 * @param {number} projectId
 */
export async function getProjectDetail(projectId) {
  const projectResult = await query(
    `SELECT p.id,
            p.name,
            p.description,
            p.status,
            p.priority,
            p.due_date,
            p.client_id,
            p.organization_id,
            o.name AS organization_name,
            c.name AS client_name,
            p.created_by_user_id,
            p.owner_user_id,
            p.created_at
     FROM projects p
     LEFT JOIN clients c ON c.id = p.client_id
     LEFT JOIN organizations o ON o.id = p.organization_id
     WHERE p.id = $1`,
    [projectId]
  );
  const project = projectResult.rows[0];
  if (!project) return null;

  const assetsResult = await query(
    `SELECT a.id,
            a.title,
            a.description,
            s.status_name AS status,
            a.current_version,
            a.created_at,
            COALESCE(u.display_name, u.email, 'Unassigned') AS owner
     FROM assets a
     JOIN asset_status_lookup s ON s.id = a.status_id
     LEFT JOIN users u ON u.id = a.created_by_user_id
     WHERE a.project_id = $1
     ORDER BY a.created_at DESC`,
    [projectId]
  );

  const contributorsResult = await query(
    `SELECT DISTINCT u.id,
            u.email,
            COALESCE(u.display_name, u.email) AS display_name
     FROM users u
     WHERE u.id IN (
       SELECT created_by_user_id FROM assets WHERE project_id = $1 AND created_by_user_id IS NOT NULL
       UNION
       SELECT created_by_user_id FROM projects WHERE id = $1 AND created_by_user_id IS NOT NULL
       UNION
       SELECT owner_user_id FROM projects WHERE id = $1 AND owner_user_id IS NOT NULL
       UNION
       SELECT user_id FROM project_members WHERE project_id = $1
     )
     ORDER BY u.email`,
    [projectId]
  );

  return {
    project,
    assets: assetsResult.rows,
    contributors: contributorsResult.rows
  };
}

/**
 * @param {number} projectId
 * @param {{
 *   name?: string,
 *   description?: string | null,
 *   status?: string,
 *   priority?: string | null,
 *   dueDate?: string | null,
 *   clientId?: number | null,
 *   ownerUserId?: number | null,
 *   organizationId?: number | null
 * }} patch
 */
export async function updateProjectById(projectId, patch) {
  const current = await query("SELECT * FROM projects WHERE id = $1 LIMIT 1", [projectId]);
  if (current.rows.length === 0) return null;

  const row = current.rows[0];
  const name = patch.name !== undefined ? String(patch.name).trim() : row.name;
  if (!name) {
    const err = new Error("name cannot be empty");
    err.status = 400;
    throw err;
  }

  const description = patch.description !== undefined ? patch.description : row.description;
  const status = patch.status !== undefined ? String(patch.status).trim() : row.status;
  const priority = patch.priority !== undefined ? patch.priority : row.priority;
  const due_date = patch.dueDate !== undefined ? patch.dueDate : row.due_date;
  let client_id = row.client_id;
  if (patch.clientId !== undefined) {
    const cid = patch.clientId;
    if (cid == null || cid === "") {
      client_id = null;
    } else {
      const n = Number(cid);
      if (!Number.isFinite(n)) {
        const err = new Error("Invalid clientId");
        err.status = 400;
        throw err;
      }
      const check = await query("SELECT id FROM clients WHERE id = $1 LIMIT 1", [n]);
      if (check.rows.length === 0) {
        const err = new Error("Client not found");
        err.status = 400;
        throw err;
      }
      client_id = n;
    }
  }

  let organization_id = row.organization_id;
  if (patch.organizationId !== undefined) {
    const oid = patch.organizationId;
    if (oid == null || oid === "") {
      organization_id = null;
    } else {
      const n = Number(oid);
      if (!Number.isFinite(n)) {
        const err = new Error("Invalid organizationId");
        err.status = 400;
        throw err;
      }
      const ocheck = await query("SELECT id FROM organizations WHERE id = $1 LIMIT 1", [n]);
      if (ocheck.rows.length === 0) {
        const err = new Error("Organization not found");
        err.status = 400;
        throw err;
      }
      organization_id = n;
    }
  }

  let owner_user_id = row.owner_user_id;
  if (patch.ownerUserId !== undefined) {
    if (patch.ownerUserId == null || patch.ownerUserId === "") {
      owner_user_id = null;
    } else {
      const ou = Number(patch.ownerUserId);
      if (!Number.isFinite(ou)) {
        const err = new Error("Invalid ownerUserId");
        err.status = 400;
        throw err;
      }
      const ucheck = await query("SELECT id FROM users WHERE id = $1 AND is_active = TRUE LIMIT 1", [ou]);
      if (ucheck.rows.length === 0) {
        const err = new Error("User not found or inactive");
        err.status = 400;
        throw err;
      }
      owner_user_id = ou;
    }
  }

  const result = await query(
    `UPDATE projects
     SET name = $1,
         description = $2,
         status = $3,
         priority = $4,
         due_date = $5,
         client_id = $6,
         owner_user_id = $7,
         organization_id = $8
     WHERE id = $9
     RETURNING id, client_id, organization_id, name, description, status, priority, due_date, created_at, owner_user_id`,
    [name, description ?? null, status, priority ?? null, due_date ?? null, client_id, owner_user_id, organization_id, projectId]
  );
  return result.rows[0];
}
