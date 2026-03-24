# Roles & Admin Endpoints — Gap List and Target Architecture

**Purpose:** Perfectionist backend view of what each role can do, what exists, what’s missing, and how admin gets “full control.” Use this to drive implementation and API contracts.

---

## 1. Role matrix (target)

| Capability | Designer | Reviewer | Admin |
|------------|----------|----------|--------|
| **Assets** | | | |
| List assets (GET /api/assets) | ✅ | ✅ | ✅ |
| Get asset by id | ✅ | ✅ | ✅ |
| Create asset (POST /api/assets) | ✅ | ❌ 403 | ✅ |
| Update asset status (PATCH …/status) | ❌ 403 | ✅ | ✅ |
| Add comment | ✅ | ✅ | ✅ |
| List comments | ✅ | ✅ | ✅ |
| **Users (admin only)** | | | |
| List users (GET /api/users) | ❌ 403 | ❌ 403 | ✅ |
| Create user (POST /api/users) | ❌ 403 | ❌ 403 | ✅ |
| Update user role (PUT /api/users/:id) | ❌ 403 | ❌ 403 | ✅ |
| Deactivate user (PATCH /api/users/:id) | ❌ 403 | ❌ 403 | ✅ |
| Delete user (DELETE /api/users/:id) | ❌ 403 | ❌ 403 | ✅ |
| **Admin dashboard** | | | |
| Overview counts (GET /api/admin/overview) | ❌ 403 | ❌ 403 | ✅ |
| (Future) Activity / audit list | ❌ | ❌ | ✅ |
| **Other** | | | |
| Health (GET /api/health) | ✅ | ✅ | ✅ |
| User roles lookup (GET /api/user-roles) | ✅ | ✅ | ✅ |

---

## 2. Current vs target (backend)

| Item | Status | Notes |
|------|--------|--------|
| POST /api/assets → designer or admin | ✅ Done | requireRole(['designer','admin']) |
| PATCH /api/assets/:id/status → reviewer or admin | ✅ Done | requireRole(['reviewer','admin']) |
| GET /api/users → admin only | ✅ Done | requireRole(['admin']) on users router |
| POST /api/users → admin only | ✅ Done | Same |
| PUT /api/users/:id → admin only | ✅ Done | Same |
| PATCH /api/users/:id (role + is_active) | ✅ Done | Admin only; implemented |
| DELETE /api/users/:id (soft) | ✅ Done | Admin only; sets is_active = false |
| GET /api/admin/overview | ✅ Done | Real route from DB; admin-only |
| GET /api/admin/activity | ✅ Done | Recent assets + recent comments; admin-only |
| Deactivate user (is_active = false) | ✅ Done | setUserActiveById + PATCH + UI |

---

## 3. Admin “full control” — what to implement

- **View all users:** GET /api/users (already exists) → restrict to admin; ensure list includes is_active.
- **Create users (including other admins):** POST /api/users (already exists) → restrict to admin. Admins can set role = admin.
- **Change role / deactivate:** PUT /api/users/:id (role), PATCH /api/users/:id (e.g. { role?, is_active? }) → admin only. Implement PATCH for is_active and optional role in one body.
- **Delete user:** DELETE /api/users/:id → admin only. Prefer soft-delete (set is_active = false) for audit; optional hard delete for compliance/cleanup.
- **See important data:** GET /api/admin/overview returns { pendingReview, changesRequested, approved } from real DB (assets + status). Later: GET /api/admin/activity or /api/admin/audit for recent changes (approval_history, etc.).

---

## 4. Login flow and “projects” (future)

- **Current:** Login is frontend-only (seed emails → role in localStorage; X-Vellum-Role sent on API requests). No backend session or JWT.
- **Target (later):** Backend login (e.g. POST /api/auth/login with email/password) returns JWT; middleware validates JWT and sets req.user (id, email, role_id). Replace X-Vellum-Role with JWT so role cannot be spoofed.
- **Admins creating other admins:** Already supported once POST /api/users is admin-only: admin creates user with role = admin. When real auth exists, “add user to login” = create user (with temp password or invite) and they log in via same login flow.
- **Projects:** “Create projects and add users to login on the projects” implies a **project/tenant** model: e.g. projects table, project_members (user_id, project_id, role). Admin creates project, adds users to project; login could be global or per-project. Defer to Phase 3 in reimplementation-plan; document here as desired direction.

---

## 5. Implementation checklist (backend)

- [x] **Admin overview:** Add `services/adminService.js` (getOverview() from assets + asset_status_lookup). Add `routes/admin.js` with GET /overview, attachRole + requireRole(['admin']). Mount at /api/admin.
- [x] **Users routes:** Add attachRole + requireRole(['admin']) to all GET/POST/PUT (and new PATCH/DELETE) in `routes/users.js`.
- [x] **User deactivate:** In userService add setUserActive(id, isActive). In routes add PATCH /api/users/:id body { is_active?: boolean, role?: string } (admin only).
- [x] **User delete:** In userService add deleteUserById(id) (hard delete) or treat DELETE as soft-delete (set is_active = false). In routes add DELETE /api/users/:id (admin only).
- [x] **Frontend:** Admin page can add “Deactivate” and “Delete” actions per user when backend is ready; optionally show is_active in the table.

---

## 6. API contract summary (admin + users)

**Admin (all require X-Vellum-Role: admin)**

- `GET /api/admin/overview` → `{ pendingReview, changesRequested, approved }`
- `GET /api/admin/activity` → `{ recentAssets: Array<{ id, title, status, owner, updatedAt }>, recentComments: Array<{ id, assetId, assetTitle, message, author, createdAt }> }`

**Users (all require X-Vellum-Role: admin)**

- `GET /api/users` → `UserAccount[]`
- `POST /api/users` → body `{ email, role }` → 201 + UserAccount
- `PUT /api/users/:id` → body `{ role }` → UserAccount
- `PATCH /api/users/:id` → body `{ role?, is_active? }` → UserAccount
- `DELETE /api/users/:id` → 204 or 200 (soft-delete: set is_active = false and return 200 + updated user)

---

*Last updated: Feb 2026*
