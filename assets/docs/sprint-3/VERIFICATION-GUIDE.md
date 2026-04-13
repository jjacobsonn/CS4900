# Vellum — complete verification guide (tests + real-world scenarios)

Use this document to **confirm the app works end-to-end**: automated checks, database state, and **browser scenarios** that mirror real teams.

---

## Part A — Before you test anything

### A1. Environment

| Requirement | Notes |
|-------------|--------|
| Node.js | Matches what the repo expects (see `package.json` engines if present). |
| PostgreSQL | Running; `psql` on your **PATH** (required for migrations from repo scripts). |
| `backend/.env` | Copy from `backend/.env.example`. Set `DB_*`, **`JWT_SECRET`**, optional `JWT_EXPIRES_IN`. |
| Frontend | `VITE_API_BASE_URL` defaults to `/api` with Vite proxy to backend — usual local setup. |

### A2. Database: one command (always the same)

From the **repository root**:

```bash
npm run db:deploy
```

Aliases: `npm run db:migrate`, `npm run migrate` (same script).

- **First machine / empty Postgres:** use `npm run db:setup` once (creates DB + schema + all migrations).
- **After `git pull` or schema errors:** `npm run db:deploy` on an **existing** database.

Requires: database already exists (except first-time `db:setup`). See [BACKEND-RUNBOOK.md](./backend/BACKEND-RUNBOOK.md).

### A3. Start the stack

From repo root:

```bash
npm run dev
```

- Frontend: typically `http://localhost:5173`
- Backend: typically `http://localhost:3000`

### A4. Quick API smoke (optional)

```bash
curl -s http://localhost:3000/api/health
```

Expect JSON indicating the API is up (see `backend/src/server.js`).

---

## Part B — Automated tests (what runs in CI)

Run from **repository root**:

```bash
npm test
```

This runs **backend then frontend** Jest suites.

| Scope | Command | What it exercises |
|--------|---------|-------------------|
| **All** | `npm test` | Full monorepo test run |
| Backend only | `npm run test:backend` | Jest in `backend/` |
| Frontend only | `npm run test:frontend` | Jest in `frontend/` |
| **Production build** | `npm run build` | `tsc` + Vite build for frontend |

### B1. Backend tests (current files)

| File | Focus |
|------|--------|
| `backend/src/__tests__/assetsApi.test.js` | Assets API behavior (e.g. comments, routing through Express). |
| `backend/src/__tests__/jwtService.test.js` | JWT signing/verification. |
| `backend/src/__tests__/userRoleService.test.js` | Role / user-role logic. |

These are **unit / API-level** tests — they do **not** replace full browser QA.

### B2. Frontend tests (current files)

| File | Focus |
|------|--------|
| `frontend/src/pages/UploadPage.test.tsx` | Upload form validation / flow. |
| `frontend/src/pages/AssetDetailPage.test.tsx` | Asset detail UI (e.g. workflow actions). |
| `frontend/src/pages/DashboardPage.test.tsx` | Dashboard render. |
| `frontend/src/utils/permissions.test.ts` | Role permission helpers. |
| `frontend/src/utils/workflowReview.test.ts` | Workflow button logic. |
| `frontend/src/utils/assetStatus.test.ts` | Status normalization. |
| `frontend/src/utils/format.test.ts` | Formatting helpers. |

---

## Part C — Role matrix (what each role should see)

Use this to **expect** navigation and 403 behavior. JWT `role` is lowercase.

| Role | Dashboard / assets | Upload | Admin (users, site-wide) | Organization (`/owner`) |
|------|---------------------|--------|----------------------------|-------------------------|
| `reviewer` | Yes | No | No | No |
| `designer` | Yes | Yes | No | No |
| `manager` | Yes | Yes | No | No |
| `client_reviewer` | Yes | No | No | No |
| `project_owner` | Yes | Yes | No | Yes (scoped: **your** projects, **Team** invites) |
| `admin` / `super_admin` | Yes | Yes | Yes | Yes (site-wide org view; **no** user table on Organization — use **Admin** for accounts) |

**Rule of thumb**

- **Site moderation + create any user role:** **Admin**.
- **Lead a program / invite designers & reviewers for their work:** **`project_owner`** on **Organization**.

---

## Part D — Real-world scenarios (manual, browser)

Work through these in order the first time; later, spot-check by scenario.

### Scenario 1 — “Greenfield install” (developer / demo)

**Goal:** Prove DB + API + UI after clone.

1. `npm install` at repo root.
2. `npm run db:setup` (or `db:deploy` if DB already exists from setup).
3. `npm test` — all green.
4. `npm run dev`, open app, log in with seeded **admin** if available (see seed docs / `database` README).
5. `curl` `/api/health` — OK.

**Pass criteria:** Login works, dashboard loads, no console errors from missing DB columns.

---

### Scenario 2 — “Agency admin sets up an org lead”

**Goal:** Admin creates a **project_owner** who will run day-to-day without Admin access.

1. Log in as **admin**.
2. **Admin → User Management** → create user with role **`project_owner`** (e.g. `owner@client.com`) and optional password.
3. Log out; log in as **project_owner**.
4. Confirm **Organization** appears; **Admin** does **not** (correct for org lead only).

**Pass criteria:** Org owner sees Organization; cannot open Admin.

---

### Scenario 3 — “Admin assigns a project to the org lead”

**Goal:** Admin creates a project whose **organizational owner** is the project owner, not the admin.

1. As **admin**, **Admin → Projects**.
2. Create project (name, client optional).
3. **Organizational owner (optional):** select the `project_owner` user.
4. **Create project** — check **Owner** column matches the assignee.

**Pass criteria:** Owner column shows the org lead; they see the project when logged in as **`project_owner`** (scoped list).

---

### Scenario 4 — “Campaign work: upload → queue → review”

**Goal:** Creative work is tied to a project and visible in review.

1. As **admin** or **designer**, **Upload** — pick the project (or use **Upload** link from project row).
2. Upload a small image/PDF, title, submit.
3. **Dashboard** / **Queue** — filter or link with `projectId` — asset appears.
4. As **reviewer** (or **admin**), open asset, use **review workflow** (approve / request changes) as appropriate.

**Pass criteria:** asset appears in queue; status changes stick; no 403 for allowed actions.

---

### Scenario 5 — “Org owner runs the program” (realistic)

**Goal:** Org lead creates work, invites teammates, no global admin.

1. Log in as **`project_owner`**.
2. **Organization** → **Projects** create a project (you are always owner).
3. Optionally add **Optional: invite teammate** on same form (email + role + optional password) → **Create project**.
4. **Team** section — confirm invitee listed; try **Deactivate** / **Reactivate**.
5. **Upload** / **Queue** from project row — same as Scenario 4.

**Pass criteria:** Project only under their scope; invites succeed; teammate appears under **People you invited**.

---

### Scenario 6 — “Teammate first day”

**Goal:** Invited user can work with minimal permissions.

1. Log in as invited **designer** (or **reviewer**).
2. Confirm **Upload** on/off per role matrix (Part C).
3. Open **Dashboard**, find assigned asset or project filter.
4. Add comment / approve per role rules.

**Pass criteria:** No unexpected 403 on read paths; workflow matches role.

---

### Scenario 7 — “Site admin cleanup”

**Goal:** Moderation and audit paths.

1. As **admin**, **Admin** — **Recent Activity** delete comment or asset (if policy allows).
2. **User Management** — change role, deactivate user (not primary seeded admin if protected).
3. Edit project **owner** in project detail if needed.

**Pass criteria:** Actions succeed; lists refresh.

---

### Scenario 8 — Edge cases (quick)

| Case | What to do | Expect |
|------|------------|--------|
| Duplicate email | Org owner invites same email twice | Second invite fails with clear error (409). |
| Re-run migrations | `npm run db:deploy` again | Idempotent notices OK; no fatal errors. |
| Wrong role | Log in as **reviewer**, hit `/admin` URL manually | Redirect to dashboard or 403 from API. |

---

## Part E — Final sign-off checklist

Use before a demo or release:

- [ ] `npm run db:deploy` succeeds on target DB.
- [ ] `npm test` passes.
- [ ] `npm run build` passes (frontend).
- [ ] `/api/health` OK with backend running.
- [ ] Scenario 2 + 3 (admin + org owner) complete.
- [ ] Scenario 4 or 5 (upload + queue) complete.
- [ ] At least one **project_owner** **Team** invite tested (Scenario 5).

---

## Related docs

- [BACKEND-RUNBOOK.md](./backend/BACKEND-RUNBOOK.md) — DB commands, env, API overview, `/api/owner`.
- [USER-FLOW-TEST.md](./USER-FLOW-TEST.md) — short pointer to this guide (legacy filename).
