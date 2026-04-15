# Vellum Backend Runbook (Sprint 3)

This is the backend source-of-truth for how the API starts, authenticates, reads/writes data, and gets deployed safely.

## Apply database migrations (one command, always the same)

Use this whenever the repo adds new files under `backend/db/migrations/` (or when you pull main and the API errors on missing columns).

**From the repository root** (recommended):

```bash
npm run db:deploy
```

These are equivalent aliases:

- `npm run db:deploy`
- `npm run db:migrate`
- `npm run migrate`

**From the `backend/` folder only:**

```bash
npm run db:migrate
```

(same script: runs `../scripts/db-setup.mjs --migrations-only`)

**Requirements:** `psql` on your PATH (PostgreSQL client), `backend/.env` configured (`DB_*`), and the target database must already exist. If the database does not exist yet, run **`npm run db:setup`** once from the repo root instead (creates DB + schema + all migrations).

Migrations are applied in **sorted filename order** and are written to be safe to re-run (`IF NOT EXISTS`, etc.).

---

## Stack and entrypoint

- Runtime: Node.js + Express (`backend/src/server.js`)
- DB: PostgreSQL via `pg` connection pool (`backend/src/config/database.js`)
- Auth: JWT Bearer tokens (`backend/src/services/jwtService.js`, `backend/src/middleware/roleAuth.js`)
- File storage: local disk under `UPLOAD_DIR` (served by `/uploads`)

Server startup gates:
1. load env
2. test DB connection
3. require `JWT_SECRET`
4. start HTTP server

If DB or JWT secret is missing, server exits by design.

## Request pipeline

1. `cors` + JSON/body parsing middleware
2. static upload serving (`/uploads`)
3. route handlers under `/api/*`
4. 404 fallback
5. centralized error handler (`{ error: message }`)

## Auth and RBAC model

- Login endpoint: `POST /api/auth/login`
- Client sends `Authorization: Bearer <jwt>` on protected requests.
- `attachAuth` verifies token and attaches:
  - `req.userId`
  - `req.role`
- `requireAuth` enforces authenticated user.
- `requireRole([...])` enforces role-specific authorization.

Supported roles (JWT `role` string, lowercase):
- `designer`
- `reviewer`
- `manager`
- `client_reviewer`
- `project_owner` — organization/project lead; scoped `/api/owner/*` and owns `projects.owner_user_id`; can invite teammates (non-admin roles) when enabled in API
- `admin`
- `super_admin`

**Typical split:** site **admins** manage global users and elevated roles; **project_owner** users manage their projects and invited teammates via owner routes (not `/api/users`).

## API surface (current)

- `/api/health` - health check
- `/api/auth` - login/token issuance
- `/api/assets` - list/detail/create/update/delete, status, comments, versions, version-audit
- `/api/projects` - project CRUD + retrieval
- `/api/clients` - client list/create
- `/api/users` - user admin (create/list/update/deactivate); **`admin` / `super_admin` only**
- `/api/user-roles` - role lookup APIs
- `/api/admin` - dashboard overview + activity; **`admin` / `super_admin`**
- `/api/owner` - project-owner dashboard: overview, activity, assignable users, teammate invite/list/active; **`project_owner` only**

## Data model notes that matter operationally

- Main workflow tables: `assets`, `asset_versions`, `asset_comments`, `asset_version_audit`
- Assets track both:
  - `current_version` (label string like `v2.0`)
  - `current_version_id` (FK to `asset_versions.id`, used by backend joins)
- User auth table: `users.password_hash` stores bcrypt hashes.
- `projects.owner_user_id` — organizational owner for scoped dashboards and access (see migrations).
- `users.invited_by_user_id` — set when a `project_owner` invites a teammate via `/api/owner/teammates`.

## DB commands and when to use each

Run from **repo root**:

- `npm run db:setup`
  - First-time (or full local bootstrap): creates DB if needed via `database/setup.sql`, then applies **all** `backend/db/migrations/*.sql` in order.
- `npm run db:sync` (same as `db:reset`)
  - **Local only:** drops and recreates the target database, then setup + migrations. Destructive.
- `npm run db:deploy` (same as `db:migrate`, `migrate`)
  - **The standard upgrade path:** migrations only, no schema reset. Use after `git pull` when new `.sql` files appear, and on shared/staging/prod DBs.

Rule: shared/deploy environments should use **`db:deploy`** only, never `db:sync`.

## Migration strategy

- SQL migrations live in `backend/db/migrations`.
- They run in sorted filename order.
- Migrations are written to be re-runnable (`IF NOT EXISTS`, conflict-safe inserts, guarded updates).
- Any schema needed by runtime queries must exist via migration, even if also present in `database/setup.sql`.

## Local run/test

From repo root:

1. `npm install`
2. `npm run db:setup` (first run) **or** `npm run db:deploy` (existing DB, apply new migrations only)
3. `npm run dev`
4. `npm test` (backend + frontend) or `npm run test:backend` / `npm run test:frontend`

**Manual browser walkthrough (roles, projects, invites):** [VERIFICATION-GUIDE.md](../VERIFICATION-GUIDE.md)

Backend-only:
- `npm run dev:backend`
- `npm run test:backend`

## Environment contract (minimum)

In `backend/.env`:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET` (required)
- optional `JWT_EXPIRES_IN`
- optional upload settings: `UPLOAD_DIR`, `MAX_FILE_SIZE`

## Failure modes and first checks

- `database does not exist`:
  - local recovery: `npm run db:setup`
  - deploy/shared env: create DB once, then run `npm run db:deploy`
- `JWT_SECRET is required`:
  - set `JWT_SECRET` in backend env, restart server
- role-based 403:
  - decode JWT payload and verify `role` matches route requirements

## Maintenance rules

- Never rename DBs in code to fix local state; use migrations/setup scripts.
- Never store plaintext passwords; bcrypt hashes only.
- Treat `db:sync` as local-only.
- Add tests for new services/routes before shipping RBAC or schema changes.
