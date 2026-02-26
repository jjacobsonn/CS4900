# Vellum Test Guide

This folder holds test documentation for the Vellum monorepo. Test **files** live next to the code they cover; this doc explains what exists and how to run everything, including **login and full-stack verification**.

---

## Quick reference: run all tests

From the **project root**:

```bash
npm test
```

This runs backend tests, then frontend tests. No database or server needs to be running for these unit tests (they use mocks).

- Backend only: `npm run test:backend` or `npm run test -w backend`
- Frontend only: `npm run test:frontend` or `npm run test -w frontend`

---

## Backend tests

**Location:** `backend/src/__tests__/`

**Runner:** Jest (ES modules, `--runInBand`)

| File | What it covers |
|------|----------------|
| **assetsApi.test.js** | Assets API routes with **mocked DB**. Tests: POST create asset (full flow: status lookup → insert asset → insert version → getAssetById), PATCH status (valid + invalid status), GET list, **role checks** (403 without `X-Vellum-Role`, 403 for wrong role on create vs status), POST comment. |
| **userRoleService.test.js** | User role service with **mocked DB**. Tests: `getAllUserRoles` (success + error path), `getUserRoleByCode`, `getUserRoleById` (found, not found, error). |

**Details:**

- The database module (`config/database.js`) is mocked in both files, so no real PostgreSQL is required.
- Assets tests use Supertest against the Express `app`; each test sets up the exact query sequence the service expects (e.g. four mocks for createAsset).
- Role-protected routes require the `X-Vellum-Role` header (designer/reviewer/admin) as used by the frontend.

---

## Frontend tests

**Location:** `frontend/src/` (next to components/utils)

**Runner:** Jest + React Testing Library + ts-jest

| File | What it covers |
|------|----------------|
| **pages/DashboardPage.test.tsx** | Dashboard loads asset list (mocked `getAssets`), shows assets, and **status filter** (e.g. select "Draft" hides others). |
| **pages/AssetDetailPage.test.tsx** | Detail page loads asset and comments (mocked `getAsset`, `getComments`, `getAssetVersions`), **Approve** button calls `patchAssetStatus`, and **Post Comment** calls `addComment` with correct payload. |
| **pages/UploadPage.test.tsx** | **Validation:** submit without file shows "Please select a file"; with file but no title shows "Title is required." **Submit:** with file + title calls `createAsset` with correct payload. |
| **utils/format.test.ts** | `statusLabel` and `formatDate` return expected strings. |
| **utils/permissions.test.ts** | **Role permissions:** `canReview("reviewer")` true, `canReview("designer")` false; `canAccessUpload("designer")` true, `canAccessUpload("reviewer")` false. |

**Details:**

- API modules (`api/assets`, `api/comments`, etc.) are mocked so no real backend is required.
- No dedicated **login** unit test; login flow is covered by **manual “login to test all works”** below.

---

## Login to test all works (full stack + auth)

To verify the full app including **login** and backend auth:

1. **Database**
   - PostgreSQL running, database `vellum` created.
   - Schema and seeds applied: from project root run  
     `npm run init-db`  
     (or `psql -U postgres -d postgres -f database/setup.sql`).

2. **Backend**
   - In `backend/`: copy `.env.example` to `.env` and set `DB_*` and `PORT` if needed.
   - From project root: `npm run start` (or `npm run dev`).  
     Backend runs on **http://localhost:3000**.

3. **Frontend**
   - Started with the same `npm run start` (or `npm run dev`).  
     Frontend runs on **http://localhost:5173** (Vite).

4. **Login**
   - Open **http://localhost:5173**.
   - You should see the login page. Use **seeded accounts** (password is the same for all):
     - **Admin:** `admin@vellum.test` / `TestPass123!`
     - **Designer:** `designer@vellum.test` / `TestPass123!`
     - **Reviewer:** `reviewer@vellum.test` / `TestPass123!`
   - After login you should be redirected to the dashboard.

5. **Smoke checks**
   - **Dashboard:** Asset list loads (from backend `/api/assets`).
   - **Asset detail:** Click an asset; detail page loads; you can change status (reviewer/admin) and add comments.
   - **Upload:** As designer or admin, open Upload and create an asset (title + file); submit and confirm it appears on the dashboard.

If all of the above work, backend, frontend, **login**, and role-based behavior are working end-to-end.

---

## Strategy and scope

- **Unit tests** use mocks (DB, API) and do not require a running server or database.
- **Login** and full-stack behavior are verified manually with the steps above; there is no separate E2E test suite yet.
- For the white-box testing strategy (philosophy, layers, mocking, coverage goals), see **[testing-plan-whitebox.md](./testing-plan-whitebox.md)** in this folder.
