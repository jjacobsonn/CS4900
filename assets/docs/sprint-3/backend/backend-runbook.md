# Vellum Backend Runbook (Sprint 3)

This is the backend source-of-truth for how the API starts, authenticates, reads/writes data, and gets deployed safely.

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

Supported roles:
- `designer`
- `reviewer`
- `manager`
- `client_reviewer`
- `admin`
- `super_admin`

## API surface (current)

- `/api/health` - health check
- `/api/auth` - login/token issuance
- `/api/assets` - list/detail/create/update/delete, status, comments, versions, version-audit
- `/api/projects` - project CRUD + retrieval
- `/api/clients` - client list/create
- `/api/users` - user admin (create/list/update/deactivate)
- `/api/user-roles` - role lookup APIs
- `/api/admin` - dashboard overview + activity

## Data model notes that matter operationally

- Main workflow tables: `assets`, `asset_versions`, `asset_comments`, `asset_version_audit`
- Assets track both:
  - `current_version` (label string like `v2.0`)
  - `current_version_id` (FK to `asset_versions.id`, used by backend joins)
- User auth table: `users.password_hash` stores bcrypt hashes.

## DB commands and when to use each

Run from repo root:

- `npm run db:setup`
  - bootstrap local DB (create if needed), seed baseline data, then apply all migrations.
- `npm run db:sync` (alias of reset)
  - destructive local rebuild (drop DB, recreate, seed, migrate).
- `npm run db:deploy` (alias `db:migrate`)
  - migration-only path for existing DBs (staging/prod/shared envs).

Rule: deploy environments should use migration-only (`db:deploy`), not reset.

## Migration strategy

- SQL migrations live in `backend/db/migrations`.
- They run in sorted filename order.
- Migrations are written to be re-runnable (`IF NOT EXISTS`, conflict-safe inserts, guarded updates).
- Any schema needed by runtime queries must exist via migration, even if also present in `database/setup.sql`.

## Local run/test

From repo root:

1. `npm install`
2. `npm run db:setup` (first run) or `npm run db:deploy` (upgrade)
3. `npm run dev`
4. `npm run test:backend`

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
