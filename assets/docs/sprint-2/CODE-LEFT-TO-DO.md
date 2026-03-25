# Code Left To Do

**Summary of implementation work still needed** (not docs or process). Backend is DB-driven; these are the remaining code gaps.

---

## 1. Must-have (real DB / security) — status

| Item | Status | Notes |
|------|--------|--------|
| **bcrypt on login** | Done | `authService.js` verifies `password_hash` with bcrypt (and dev fallback for placeholder hashes). |
| **Optional password on user create** | Not done | `userService.createUserAccount` still stores a placeholder hash; `POST /api/users` does not accept `password`. For invites, add optional `password` in body, `bcrypt.hash`, wire from `routes/users.js`. |
| **Seeded users** | Verify per env | Migrations/seeds should use real bcrypt hashes for demo accounts (e.g. `TestPass123!`) where you rely on bcrypt path only. |

---

## 2. Optional / later (unchanged list)

| Item | What to do |
|------|------------|
| **Cloud/object storage** | Move binaries to S3/Azure Blob; signed URLs for downloads. |
| **Integration tests** | Backend against test DB; frontend against test API. |
| **Versioning (Phase 2)** | `sprint-2/versioning-spec.md` then implement. |
| **Company/tenant (Phase 3)** | Scoped admin, project members. |

---

## 3. Session-bound API auth (JWT) — **implemented** (Mar 2026)

**Done:** `jsonwebtoken` + `JWT_SECRET` / optional `JWT_EXPIRES_IN` in `.env.example`; `signAuthToken` / `verifyAuthToken` in `jwtService.js`; `POST /api/auth/login` returns a real JWT; `attachAuth` + `requireAuth` + `requireRole` in `roleAuth.js` (no `X-Vellum-Role`); protected routers: assets, users, admin, clients, projects, user-roles; actors for comments, status, asset/version create, version audit user come from `req.userId` (JWT `sub`); frontend `api/client.ts` sends `Authorization: Bearer` and clears session on `401` (except failed login so wrong password does not wipe storage); server refuses to start without `JWT_SECRET` (non-test); assets API tests use signed JWTs.

**Still optional / later:** refresh tokens; MSW parity with 401 without token; role-in-JWT vs DB refresh on every request; tighten CORS and add integration tests.

---

## 4. Already done (baseline)

- Login (DB-backed) with bcrypt verification for real hashes + dev fallback for placeholders.
- Create/list/update/deactivate users (admin); persisted in DB (new users still get placeholder password until Phase 1 optional password work).
- Role checks on mutating asset/admin/user routes (still header-based until JWT track completes).
- Admin overview + activity; assets CRUD + comments + status; projects/clients slices.
- Reviewer upload disabled; Admin user table with real API; MSW opt-in.

---

## 5. Quick checklist (code only)

- [ ] **Optional invite password** — `POST /api/users` + `createUserAccount` optional `password` + bcrypt hash.
- [x] **JWT track** — see §3 (done).
- [ ] **Cloud/object storage** (optional / later).
- [ ] **Integration tests** (optional).
- [ ] **Versioning** — Phase 2 (optional).
- [ ] **Company/tenant** — Phase 3 (later).

**Minimum to say “API auth matches a real app”:** complete §3 (JWT + attach to routes + frontend Bearer + drop `X-Vellum-Role`).
