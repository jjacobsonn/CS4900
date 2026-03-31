## Backend Implementation Plan — Sprint 2

This document turns the Sprint 2 spec into concrete backend steps. It focuses on the first vertical slice: internal-only workflow (no client reviewers yet) with projects, assets, versions, and internal review.

---

### 1. Database changes (high level)

Add or extend tables to support projects and scoped assets:

- **clients**
  - `id`, `organization_id`, `name`, `description`, `created_at`
- **projects**
  - `id`, `client_id`, `name`, `description`, `status`, `priority`, `due_date`, `created_by_user_id`, `created_at`
- Extend **assets**
  - Add `project_id` (FK to projects)
- **workflow_templates** / **workflow_template_stages**
  - For now, seed a simple internal-only template in a migration (Design → Internal Review → Publish).

For the first slice you can hard-code a single organization, and a minimal template, and defer full workflow stage tables if needed; assets just belong to projects and use the existing `asset_status_lookup` statuses that map to the new internal keys.

---

### 2. API additions

Implement minimal project/client endpoints:

- `GET /api/clients` — list clients.
- `POST /api/clients` — create client (admin/manager).
- `GET /api/projects` — list projects (optionally by client).
- `POST /api/projects` — create project (manager), body includes `clientId`, `name`, `description`, `priority`, `dueDate`.
- `GET /api/projects/:projectId` — project detail with basic asset summary.

Extend assets API:

- Accept `projectId` on `POST /api/assets` and persist it.
- Add `GET /api/projects/:projectId/assets` to list assets for a project using `listAssets` filtered by `project_id`.

---

### 3. Status and roles (what’s already wired)

- Route `PATCH /api/assets/:assetId/status` now expects internal keys:
  - `in_progress`, `ready_for_internal_review`, `in_internal_review`, `changes_requested_internal`, `approved_internal`.
- Service enforces allowed transitions via `INTERNAL_STATUS_MAP` and `INTERNAL_STATUS_TRANSITIONS`.
- Roles enforced via `X-Vellum-Role` and `requireRole(["designer" | "reviewer" | "admin"])`.

No schema changes are needed to keep using existing `asset_status_lookup`; you only need to ensure rows exist with names:

- `In Progress`
- `Ready for Internal Review`
- `In Internal Review`
- `Changes Requested (Internal)`
- `Approved (Internal)`

---

### 4. Tests to add next

Once DB changes and new routes are in place, add tests matching `test-cases-functional.md` for the internal slice:

- Unit tests:
  - `updateAssetStatus` transition rules.
- Integration tests:
  - `POST /api/projects`, `POST /api/assets` (with `projectId`), `PATCH /api/assets/:id/status`.
- E2E smoke:
  - Manager creates project → Designer creates asset → Reviewer moves it through internal statuses to `approved_internal`.

