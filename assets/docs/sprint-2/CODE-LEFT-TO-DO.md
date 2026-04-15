# Code Left To Do

**Summary of implementation work still needed** (not docs or process). Backend is DB-driven; these are the remaining code gaps.

---

## 1. Must-have (real DB / security)

| Item | Where | What to do |
|------|--------|------------|
| **Password hashing** | `backend/src/services/authService.js`, `userService.js` | Add `bcrypt`; on login verify `bcrypt.compare(password, row.password_hash)`; on create user accept optional `password`, hash with `bcrypt.hash`, store. Keep legacy `TestPass123!` for placeholder hashes if desired. Update `backend/src/routes/users.js` to pass `password` from body to `createUserAccount`. |
| **Seeded users** | DB or one-time script | After bcrypt: set real bcrypt hashes for the three seed users (e.g. all `TestPass123!`) so they can log in. |

**Rough size:** ~1–2 hours (add bcrypt dep, authService + userService + users route).

---

## 2. Optional / later

| Item | What to do |
|------|------------|
| **JWT** | Replace `mock-token` with signed JWT on login; middleware validates `Authorization: Bearer <jwt>`, sets `req.user`/`req.role`; optionally drop `X-Vellum-Role` from client. |
| **Real file upload** | Backend: accept multipart file (e.g. multer), store file on disk or S3, save path in DB; frontend: send file in `FormData` with title/description. Right now upload only creates asset **metadata** (title, description), no file bytes stored. |
| **Integration tests** | Backend: tests that hit real DB or test DB; frontend: integration tests against real API or test server. |
| **Versioning (Phase 2)** | Design in `sprint-2/versioning-spec.md` then implement: backend tables/endpoints (e.g. versions list, submit for review, revert), frontend Versions UI. |
| **Company/tenant (Phase 3)** | Design then implement: company/tenant model, scoped admin, project members. |

---

## 3. Already done (no code left for these)

- Login (DB-backed; password check is literal until bcrypt).
- Create/list/update/deactivate users (admin); all in DB.
- Role enforcement (designer/reviewer/admin) on assets and users/admin.
- Admin overview + activity from DB.
- Assets CRUD + comments + status from DB.
- Reviewer upload disabled; Backend Test admin-only; Admin user table with real API.
- MSW is opt-in (`VITE_USE_MSW=true`); default runs against real backend.

---

## 4. Quick checklist (code only)

- [ ] **Password hashing** — bcrypt in authService (login) + userService (create user) + users route (pass password).
- [ ] **Seed hashes** — one-time update of seed users’ `password_hash` to bcrypt (e.g. `TestPass123!`).
- [ ] **JWT** (optional).
- [ ] **File upload** — backend store file; frontend send file (optional for MVP).
- [ ] **Integration tests** (optional).
- [ ] **Versioning** — Phase 2 design + implement (optional for current sprint).
- [ ] **Company/tenant** — Phase 3 (later).

**Minimum to say “no mocks, real auth”:** do the password hashing + seed hashes.
