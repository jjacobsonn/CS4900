# Architecture & UX Revision Ideas

**Purpose:** Capture ideas and discussion for improving Vellum’s reviewer experience, versioning, admin capabilities, and handling of dev/diagnostic tools. No implementation yet—ideas only.

---

## 1. Reviewer Role

### 1.1 Upload page completely disabled (like Admin)

**Current:** Reviewer can open Upload; form shows “Your role cannot upload assets” and Submit is disabled, but the nav link and page are still visible.

**Goal:** Treat Upload like Admin for reviewers: **hide or disable the Upload nav item** so reviewers never land on the upload page. Same pattern as Admin (disabled in nav, route redirects to dashboard).

**Ideas:**
- In the main nav: if role is `reviewer`, don’t render the Upload button (or render it disabled and non-clickable, with no route access).
- Route guard: `/upload` for reviewer → redirect to `/dashboard`.
- Result: Reviewer never sees or uses the upload flow; only Designer and Admin do.

---

### 1.2 Versioning redesign (Git-like, snapshots, approval-driven versions)

**Current:** Versions are minimal—e.g. derived from asset (single “current version”), no real history, no link between comments/changes and versions.

**Goal:** Each document has a real version history. New versions are created at clear events; each version is a snapshot with metadata. Support concepts similar to Git: push (submit for review), pull (get latest), merge (combine changes), discard (drop changes), with clear approval/review gates.

**Ideas:**

- **What is a “version”?**
  - A **snapshot** of the asset at a point in time (file + metadata).
  - Created when:
    - Designer **submits for review** (e.g. “v2” = ready for review).
    - Reviewer **approves** or **requests changes** (optional: create a “decision” version or just audit log).
    - Option: **every comment** could create a “comment version” (lightweight) vs. **only status changes** create “full” versions—team choice.

- **Version metadata (per version):**
  - Version number (v1, v2, v3).
  - Timestamp (when created).
  - Who created it (user/role).
  - Trigger: “Submitted for review” | “Approved” | “Changes requested” | “New upload” | “Reverted to vX”.
  - Optional: short reason/comment tied to that version (e.g. “Requested changes: update logo”).

- **Git-like concepts (mapped to Vellum):**
  - **Push:** Designer “submits for review” → creates new version, status → In Review.
  - **Pull:** “Get latest” / refresh asset view to current version (and optionally see diff or changelog).
  - **Merge:** Reviewer approves → “merge” into “approved” state; optional: merge feedback into next designer draft (e.g. next version includes approved content + new edits).
  - **Discard:** Designer or Admin “discard my draft” / “revert to v2” → roll back to a prior snapshot, new version or audit entry.
  - **Branch (optional):** “Draft” vs “In Review” vs “Approved” as clear states; “new version” is like a new “commit” on that asset.

- **Data model / backend (high level):**
  - `file_versions` (or equivalent) stores each snapshot: asset_id, version_number, file_ref, status_at_version, created_at, created_by, trigger_type, optional comment/reason.
  - Comments can reference a version (e.g. “comment on v2”) for clarity.
  - “Current” version is either latest or latest-approved, depending on workflow (e.g. show latest to designer, “approved” to stakeholders).

- **UI:**
  - Versions tab: list of versions with date, user, trigger, optional reason; click to view that snapshot (read-only) or “compare to current.”
  - Optional: simple diff view (e.g. metadata diff, or “previous vs current” file if we support it).
  - Clear actions: “Submit for review” (push), “Revert to this version” (discard/pull back), “Approve” (merge).

---

## 2. Admin Role

### 2.1 Show all users in the database

**Current:** Admin has System Overview (counts) and User Management with “Create User” (email + role). There is **no list of existing users** in the UI (even though the code may load users for role dropdowns—see AdminPage and getUsers).

**Goal:** Admin sees a **list (or table) of all users** in the database: e.g. email, role, status (active/inactive), last login (if we have it), and actions (edit role, deactivate, etc.).

**Ideas:**
- Add a “Users” section on Admin that calls the same `getUsers()` (or equivalent) and renders a table: Email | Role | Status | Actions (change role, deactivate).
- Pagination or search if user count grows.
- “Create User” stays; new users appear in the list after creation.

(Note: If the current backend already returns a user list and the frontend only uses it for the role dropdown in a create form, the fix is mainly UI: show that list prominently and add per-row actions.)

### 2.2 Company / tenant model and user flow

**Current:** No notion of “company” or “organization”; users and assets are global.

**Goal:** Think through how a **multi-company (multi-tenant)** product would work so we can design admin (and permissions) in a way that can evolve toward that.

**Ideas:**

- **Tenant = Company / Organization:**
  - Each **company** has its own workspace: its users, its assets, its approval workflows.
  - Admin is **scoped**: “Company Admin” sees only that company’s users and assets; “Super Admin” (optional) sees all companies (for SaaS vendor).
  - User belongs to one (or more) companies; role is per-company (e.g. “Designer at Acme”, “Reviewer at Acme”).

- **User flow for a “standard” company (reference):**
  - **Onboarding:** Invite users by email; they get a link, set password, and are assigned a role (Designer / Reviewer / Admin) for that company.
  - **Admin dashboard:**
    - **Users:** List all users in the company; invite new; change role; deactivate (no delete if we need audit trail).
    - **Overview:** Counts (pending review, changes requested, approved) for *this company’s* assets.
    - **Settings (optional):** Company name, logo, default roles, notification preferences.
  - **Audit / activity (optional):** Who approved what, when; who uploaded what; who changed roles—useful for compliance and “what would pros do.”

- **Implementation order (if we adopt):**
  - Phase 1: Single-tenant as now, but add **user list** and clear “company” in the data model (e.g. one default company).
  - Phase 2: Add company_id to users and assets; scope all admin APIs and UI to “current company.”
  - Phase 3: Invites, deactivate, audit log as needed.

---

## 3. Backend Test Page and Dev/Diagnostic Tools

**Current:** “Backend Test” is in the main nav for everyone. It shows health, user-roles, assets, assets/summary, raw timings, and JSON. Useful for developers; not appropriate for standard users and doesn’t look like a product feature.

**Goals:**
- Standard users (Designer, Reviewer, even most Admins) **should not** see or need the Backend Test page.
- What **would** professionals do for health/diagnostics and where should that live?

**Ideas:**

- **Remove from main nav for normal users:**
  - Backend Test (or “Dev Tools”) should **not** appear in the header for production builds or for non-dev roles.
  - Options:
    - **Role-based:** Only show “Backend Test” (or “System Status”) for a dedicated role (e.g. “Super Admin” or “Developer”) or when a feature flag / env (e.g. `VITE_SHOW_DEV_TOOLS`) is on.
    - **Build-time:** In production build, don’t render the Backend Test route or nav item at all; keep it only in dev.

- **What professionals do:**
  - **Health/status for admins:** A proper “**System status**” or “**Health**” section **inside the Admin area** (not a separate dev page): e.g. “API: OK”, “Database: OK”, “Storage: OK”, and maybe high-level counts (assets, users). No raw JSON or timings. Only admins see it.
  - **Detailed diagnostics:** Kept for developers only: either behind a dev-only route (e.g. `/dev/backend-test`), or a separate internal tool, or only when `?dev=1` or a secret path is used. Not in the main nav.
  - **Public status page (optional):** Some products have a public status page (e.g. status.vellum.com) for “is the service up?”—separate from the app and not inside the app nav.

- **Concrete rework:**
  - Move “is the backend up?” and “basic counts” into **Admin** as a small “System status” block (for Admin role only).
  - Rename or remove “Backend Test” from main nav; keep the current page only for dev/debug (e.g. behind a flag or dev-only route) so it’s not “beginner-level” in the user-facing UI.

---

## 4. Summary Table (for prioritization)

| Area | Change | Effort (rough) |
|------|--------|----------------|
| Reviewer | Disable/hide Upload in nav and route | Low |
| Versioning | Snapshot per version, metadata, Git-like actions (push/pull/merge/discard) | High |
| Admin | Add visible “list all users” table + actions | Medium |
| Admin | Company/tenant model and scoped admin | High (later) |
| Backend Test | Hide from main nav for standard users; move “status” into Admin | Low–Medium |

---

## 5. Next Steps (when we implement)

- **Quick wins:** Reviewer upload disabled in nav + route; Backend Test hidden from main nav (or dev-only); Admin user list visible.
- **Then:** Versioning data model and API (file_versions, triggers, metadata); then UI (Versions tab, actions).
- **Later:** Company/tenant model if we want multi-company.

---

*Doc created to store discussion; update as we refine ideas or add references (e.g. “similar to Figma/Notion/Linear” for versioning or admin flows).*
