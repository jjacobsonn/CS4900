# Backend Status: Real DB Only, No Mocks

**Goal:** All create/read/update/delete goes through the actual database. No mock data in production or normal dev.

---

## 1. What uses the real DB today (backend)

| Area | Endpoint / flow | Data source |
|------|------------------|-------------|
| **Auth** | POST /api/auth/login | `users` + `user_roles` (lookup by email, role from DB) |
| **Users** | GET/POST/PUT/PATCH/DELETE /api/users | `users` + `user_roles` (all CRUD in DB) |
| **Admin** | GET /api/admin/overview | `assets` + `asset_status_lookup` (counts) |
| **Admin** | GET /api/admin/activity | `assets` + `asset_comments` (recent rows) |
| **Assets** | GET/POST /api/assets, GET/PATCH /api/assets/:id, comments, status | `assets`, `asset_comments`, `asset_status_lookup` |
| **Lookup** | GET /api/user-roles | `user_roles` |

All of the above read/write PostgreSQL. No in-memory mocks on the backend.

---

## 2. Where “mock” or placeholder still exists

| Item | Where | What to do |
|------|--------|------------|
| **MSW (frontend)** | `frontend/src/mocks/` | Only active when `VITE_USE_MSW=true`. **Default is off** — normal dev uses real backend + DB. For “no mocks,” don’t set that env var; use real API. Keep MSW only for unit tests if desired. |
| **Login password check** | `backend/src/services/authService.js` | Currently accepts literal `TestPass123!` for any user (no hash check). **Left to do:** verify password with bcrypt against `users.password_hash`. |
| **Create user password** | `backend/src/services/userService.js` | Stores a placeholder hash; no initial password from admin. **Left to do:** accept optional `password` on create, hash with bcrypt, store in `users.password_hash`; then new users can log in with that password. |
| **Auth token** | Backend returns `token: "mock-token"`; middleware uses `X-Vellum-Role` | Optional later: issue real JWT, validate in middleware, derive role from token so client can’t spoof. |

---

## 3. What’s left to implement (backend, all roles + admin + login + create user)

### Done

- **Admin:** List users, create user (email + role), update role, deactivate (PATCH), soft-delete (DELETE); overview and activity from DB; all routes admin-only.
- **Login:** POST /api/auth/login with email/password; user and role from DB; returns token + user.
- **Roles:** Designer / Reviewer / Admin enforced on assets (create, status) and users/admin routes (admin-only).
- **Assets:** List, get, create, status, comments — all from DB.

### To do (so everything is real DB, no placeholders)

1. **Password hashing (create user + login)**  
   - **Create user:** Add optional `password` to POST /api/users body. If provided, hash with bcrypt and set `users.password_hash`; if not, keep placeholder (or require password).  
   - **Login:** In `authService.loginWithEmailPassword`, verify `password` against `users.password_hash` using bcrypt compare (no more literal `TestPass123!`).  
   - **Seeded users:** Run a one-time migration or script to set real bcrypt hashes for the three seed accounts (e.g. all `TestPass123!`) so they still work.

2. **Optional: JWT instead of mock token**  
   - Issue a signed JWT (e.g. `{ userId, email, role }`) on login.  
   - Add middleware that reads `Authorization: Bearer <jwt>`, verifies signature, sets `req.user` / `req.role`.  
   - Prefer role from JWT over `X-Vellum-Role` (then remove header-based role).

3. **No mocks in app runtime**  
   - Ensure `VITE_USE_MSW` is not set (or is `false`) so the app always calls the real backend.  
   - MSW only for frontend unit tests that mock the API.

---

## 4. Summary checklist (backend, all roles)

| Feature | Status |
|---------|--------|
| Login (email + password, role from DB) | ✅ Done (password check is literal until bcrypt) |
| Create user (admin, stored in DB) | ✅ Done (no initial password yet) |
| List/update/deactivate users (admin) | ✅ Done |
| Role enforcement (designer/reviewer/admin) | ✅ Done |
| Admin overview + activity from DB | ✅ Done |
| Assets CRUD + comments + status from DB | ✅ Done |
| **Password hashing (create + login)** | ❌ To do |
| **JWT (optional)** | ❌ To do |

Once password hashing is in place, “admin login, create user, and all roles” are fully backed by the real DB with no mock or literal password.
