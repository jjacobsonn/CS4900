# Personal Journal — Jackson Jacobson

**Project:** Vellum - Digital Asset Review & Approval Platform  
**Course:** CS 4900 - Senior Capstone Project  
**Student:** Jackson Jacobson (jjacobsonn)

---

## Sprint 0 - Week 1 (February 10-16, 2026)

### February 16, 2026

**Tasks Completed:**
- Pulled latest changes from main branch
- Created development branch `dev-jj`
- Merged teammate's frontend work (lw-dev branch)
- Created professional documentation structure in `assets/docs/` folder
- Created and tested database setup script (`database/setup.sql`)
- Implemented complete backend structure:
  - Express.js server with PostgreSQL connection
  - User roles API endpoints
  - Service → Database code examples
  - Unit tests with mocked database
- Reorganized frontend into `frontend/` directory
- Connected frontend to backend:
  - Configured Vite proxy
  - Updated login page to fetch roles from backend
  - Demonstrated GUI → Service → Database flow
- Updated all documentation for Sprint 0 Review

**Challenges:**
- Initial Jest configuration issue with ES modules (resolved)
- Coordinating frontend/backend integration
- Ensuring normalized database structure per requirements

**Accomplishments:**
- Full-stack application working end-to-end
- Database properly normalized with lookup tables
- Code examples demonstrating all required patterns
- Professional project structure

**Next Steps:**
- Prepare for Sprint 0 Review presentation
- Address any feedback from review team
- Plan Sprint 1 features (authentication, additional endpoints)

**Reflections:**
Successfully transitioned from planning to implementation. We have a working full-stack application with database integration that exceeds Sprint 1 requirements. The foundation is solid for building out additional features in Sprint 2.

---

## Sprint 0 - Individual Tasks

### Completed Tasks
- [x] Repository setup and branch management
- [x] Documentation review and organization
- [x] Project Follow-up document creation
- [x] Personal Journal setup
- [x] Database setup script (SQL) - created and tested
- [x] README update with setup instructions
- [x] Backend project initialization
- [x] Basic Express server setup
- [x] Database connection implementation
- [x] Initial unit tests
- [x] Code examples for review
- [x] Frontend-backend integration
- [x] Sprint 0 Review preparation

---

## Notes & Observations

- The project uses PostgreSQL as the database (per architecture doc)
- Need to create normalized lookup tables for roles and approval statuses
- Team coordination will be important as we start implementing features
- Testing infrastructure needs to be set up early to support TDD approach

---

**Last Updated:** February 16, 2026

---

## Sprint 1 - Week 1 (Feb 24 - Mar 2, 2026)

### February 27, 2026

**Tasks Completed:**
- Implemented additional backend API scaffolding and started authentication planning
- Wrote unit tests for `userRoleService` and fixed minor edge cases
- Reviewed teammate code for frontend routing and merged small fixes

**Challenges:**
- Authentication design decisions to finalize in Sprint 1 planning

**Next Steps:**
- Finalize authentication design and begin implementing login flow

---

## Re-implementation (Architecture revisions)

### February 23, 2026

**Tasks Completed (Phase 0 & 1):**
- Started re-implementation per `architecture-revise.md` (reviewer upload, admin user list, versioning ideas, backend test visibility).
- **Phase 0:** Created `archive/sprint-1-baseline` snapshot of sprint-1 docs; confirmed `sprint-2/` and reimplementation plan; added `DOC-VERSIONING.md` and `review-prep-and-cadence.md`.
- **Phase 1 quick wins:**  
  - Reviewer: Upload disabled in nav and route (same pattern as Admin); reviewers cannot open Upload.  
  - Backend Test: Nav and route restricted to admin only; designers and reviewers no longer see it.  
  - Admin: "All users in database" table (Email | Role) with role dropdown, loading state, and error state when user list fails to load.  
- Updated `reimplementation-plan.md` with completed Phase 0 and Phase 1 checkboxes.

**Next Steps (after Phase 1 at that time):**
- Phase 2: Add `sprint-2/versioning-spec.md` and implement versioning (snapshots, Git-like actions).
- Add backend users route so Admin table shows real users instead of MSW-only data.

---

### March 19, 2026 — Sprint 1 Review Prep (Backend, Admin, Versioning)

**Tasks Completed:**
- **Authentication & roles**
  - Implemented backend `/api/auth/login` using the real `users` + `user_roles` tables; login now validates email/password and returns role from DB.
  - Updated frontend Login page to call the backend and persist a token plus user (id, email, role) in local storage.
  - Added role middleware to backend routes and ensured designer/reviewer/admin permissions are enforced for assets, users, and admin endpoints.
- **User management & admin dashboard**
  - Implemented full `/api/users` CRUD (list, create, update role, deactivate/reactivate, soft-delete) with admin-only access.
  - Extended users with `display_name` and wired Admin “Create User” form + user table to show realistic names.
  - Implemented `/api/admin/overview` and `/api/admin/activity` for real counts and recent activity.
  - Updated Admin page to show System Overview, collapsible Recent Assets/Recent Comments tables, and inline Delete actions for assets and comments.
- **Assets, comments, and ownership**
  - Ensured new uploads from designers/admins set `created_by_user_id` so Owner reflects the logged-in user (display name or email).
  - Wired comments to store `author_user_id` and display authors using `display_name`/email instead of the placeholder “Frontend User”.
  - Added an “Assign owner” control on the asset detail page so admins can reassign ownership (or unassign) directly from the UI.
- **Versioning**
  - Added an `asset_versions` table and migrated existing assets to have at least one version row.
  - Implemented `GET /api/assets/:id/versions` and wired the Versions tab to show real DB-backed version history.
  - Implemented `POST /api/assets/:id/versions` so designers/admins can create new versions; each new version:
    - Increments the version number.
    - Moves asset status back to **In Review**.
    - Updates `current_version` (e.g. `v2.0`) so Admin “Pending Review” stays in sync with the latest version.

**Challenges:**
- Keeping role enforcement, login state, and frontend behavior (Dashboard, Upload, Admin, Backend Test) consistent as we replaced mock/MSW flows with real APIs.
- Designing versioning to feel modern while staying within the course scope and existing DB schema.

**Next Steps:**
- Replace the shared test password + mock token with bcrypt-based password hashing and a JWT for authentication.
- Extend versioning to track per-version approval state and potentially add “revert to version” actions.
- Add real file storage for assets beyond the current metadata-only implementation.

**Reflections:**
- The system now feels much closer to a real SaaS admin experience: Admins can see live counts, recent activity, and manage users/assets/comments directly.  
- Designers and reviewers have clearer, role-based flows (upload vs review) and comments/versions are now tied to real users and database-backed history, which will make Sprint 1’s review much easier to demonstrate.

---

## Sprint 3 - Week 2 (Mar 10 - Mar 23, 2026)

### March 19, 2026

**Tasks Completed:**
- Implemented initial frontend components for dashboard views
- Integrated backend endpoints with the Dashboard page for live data
- Added MSW handlers for frontend testing of assets endpoints

**Next Steps:**
- Continue building UI components and tie permissions to role state

---

## Sprint 4 - Week 1 (Mar 24 - Apr 6, 2026)

### April 3, 2026

**Tasks Completed:**
- Completed asset detail page and comment UI
- Added server-side timing headers for diagnostics
- Prepared demo for Sprint 4 review

**Next Steps:**
- Address any feedback from Sprint 4 review, focus on polishing and tests

---

## Sprint 5 - Week 2 (Apr 7 - Apr 20, 2026)

### April 17, 2026

**Tasks Completed:**
- Fixed several frontend unit tests and updated mocks
- Implemented save/redirect flow on admin pages

**Next Steps:**
- Prepare final review materials and ensure all docs are up to date
---

## Sprint 2 - Week 1 (Mar 15 - Mar 21, 2026)

### March 15, 2026

**Tasks Completed:**
- Created feature branch `jj-sprint-2` from `main` and merged Landon’s latest Sprint 2 backend/frontend work (`lw-sprint-2`) into it.
- Helped align the backend database with the latest asset versioning schema by re-running the init script so columns like `original_file_name` exist and the admin dashboard can query without errors.
- Tightened frontend role-based access so the **Admin** navigation and page are completely hidden and inaccessible for non-admin users (dashboard, upload, and admin areas now fully respect role state).
- Renamed and reorganized sprint documentation folders so the original baseline lives under `sprint-0/`, the reimplementation work under `sprint-1/`, and created a new empty `sprint-2/` folder for this current sprint.
- Updated cross-references in the root README, doc versioning guide, project-management docs, and this personal journal so sprint numbers and paths match the new structure.
- Added a small “logged in as” pill in the header that shows the current user’s email so reviewers can immediately confirm which seeded account they’re using (designer, reviewer, or admin) during demos.

**Challenges:**
- Keeping the sprint renumbering consistent across many linked docs (root README, project-management files, and journals) without breaking any paths.
- Making sure the database migrations and asset versioning columns were applied correctly so existing admin queries didn’t fail in subtle ways.

**Next Steps:**
- Fill in `assets/docs/sprint-2/` with a clear Sprint 2 overview and any new technical docs created as we implement changes from the `jj-sprint-2` branch.
- Continue tightening permissions and UX on the admin and upload flows, and verify everything with end-to-end tests before the Sprint 2 review meeting.

**Reflections:**
- Today’s work cleaned up both **infrastructure** (DB schema alignment) and **experience** (role-based visibility and documentation), so the project feels more production-ready going into Sprint 2.
- Renaming the sprints to use a baseline `sprint-0/` and dedicated `sprint-1/` / `sprint-2/` folders makes the history of the project and the reimplementation phases much easier to explain at review time.

### March 15, 2026 (continued) — Filenames, version list redesign, admin guard

**Tasks Completed:**
- **Filename sanitization:** Fixed weird characters (e.g. `â¯`) in uploaded filenames (Unicode narrow no-break space / mojibake). Backend `upload.js` now sanitizes `originalFileName` before storing; frontend `format.ts` has `sanitizeFileName()` and we use it everywhere filenames are displayed (VersionList, AssetDetailPage “Current file”). Also added fallback replacement for the literal mojibake sequence so existing bad DB rows display correctly.
- **Version list redesign:** Restructured the version list into three clear zones with spacing: (1) Version info row — version number once, Current badge, status badge; (2) Lighter metadata line (e.g. “Mar 15, 2026 • Admin”) and a dedicated file row (filename as main content, no duplicate version); (3) Actions (Edit / Delete) isolated on the right. Improved vertical spacing between groups and removed the paper-clip emoji per preference.
- **Admin role fix and guard:** The seeded user `admin@vellum.test` had been changed to designer in the DB (likely via Admin User Management), so the Admin nav and edit/delete actions disappeared. Restored the row to ADMIN in the `vellum` database via SQL. Added a backend guard in `userService.updateUserRoleById` so the primary admin account cannot be demoted via the API (400 if attempted). Disabled the role dropdown in the Admin user table for `admin@vellum.test` so it can’t be changed from the UI again.

**Challenges:**
- Confirming the correct Postgres database name (`vellum` not `vellum_db`) and running the fix so the user didn’t need to run psql manually.
- Ensuring filename display is sanitized in every place (version history and asset detail “Current file”) so one fix covers all views.

**Next Steps:**
- Optional: add a one-time SQL script or doc note for cleaning existing mojibake in `asset_versions.original_file_name` and `assets.name` for other environments.
- Continue Sprint 2 work on `jj-sprint-2` and keep dev-jj in sync for demos.

**Reflections:**
- Small UX details (filename display, version list layout, and protecting the admin account) make the app feel more reliable and easier to use in demos.

### March 15, 2026 (continued) — Admin asset editing, comment delete, version attachments

**Tasks Completed:**
- **Edit whole asset (admin):** Added an “Edit asset” panel on the asset detail page (admin only) to edit title, description (notes), owner, and optionally replace the preview file. Replacing the preview file updates the current version’s file via `PATCH /api/assets/:id/versions/:versionId` so the card preview and “Current file” update without creating a new version. Backend: `updateAsset(assetId, { title?, description? })`, new route `PATCH /api/assets/:assetId` (admin).
- **Delete comments on the page:** CommentList now supports an optional “Delete” button per comment for admins; AssetDetailPage wires it to the existing `DELETE /api/assets/:assetId/comments/:commentId` and refreshes the list after delete.
- **Version edit: add/remove attachment:** In the Versions tab, when an admin edits a version they can replace the attachment (file input) or remove it (checkbox). Backend: `updateAssetVersion(assetId, versionId, { label?, notes?, file?, removeFile? })`, `deleteAssetVersionById`, `listVersionAudit`; new routes `PATCH` and `DELETE /api/assets/:assetId/versions/:versionId` and `GET /api/assets/:assetId/version-audit` (admin). Frontend: `patchAssetVersion` accepts optional `file` or `removeFile`; VersionList edit form includes file replace and “Remove attachment”; apiClient has `patchForm` for multipart PATCH.
- **Schema and API:** Added `asset_version_audit` table in `database/setup.sql` for version audit trail. Backend `getAssetById` and `listAssets` now return `current_version_id` and join to the current version’s file correctly; `createAssetVersion` sets `current_version_id` on the asset. Frontend Asset type and `toAsset` include `currentVersionId`; Version type and version API include `label`, `notes`, `createdBy`.

**Challenges:**
- Keeping PATCH version flexible for both JSON (metadata only) and multipart (file replace) and ensuring the frontend could send either.

**Next Steps:**
- Run `CREATE TABLE asset_version_audit` (from setup.sql) on existing DBs that don’t have it yet so version-audit endpoint works.
- Consider allowing multiple files per asset later with a designated “main” one for card preview.

---

### March 17, 2026 — Sprint 2 Architecture, Workflow, and Projects (Backend Focus)

**Tasks Completed:**
- **Sprint 2 product vision & docs**
  - Authored a comprehensive Sprint 2 spec under `assets/docs/sprint-2/`, including:
    - `vision-and-purpose.md` (single-tenant org → clients → projects, multi-role workflow).
    - `personas-and-roles.md` (Admin, Manager, Designer, Internal Reviewer, Client Reviewer).
    - `user-flows-and-sequences.md` (request → creation → internal review → client review → publish).
    - `information-architecture-and-entities.md` (Organization, Client, Project, Asset, Version, Workflow, Comment, ApprovalRecord).
    - Updated `functional-requirements.md` / `nonfunctional-requirements.md` aligned to the richer workflow.
    - Testing docs: `test-strategy.md`, `test-cases-functional.md`, `traceability-matrix.md`.
  - Added `asset-types-and-content.md` to define how assets can be files, links (Figma, Jira, GitHub, Discord, Salesforce, etc.), or pure notes using `asset_type` + `external_url`.
- **Backend internal workflow slice**
  - Extended `asset_status_lookup` with internal-only statuses: In Progress, Ready for Internal Review, In Internal Review, Changes Requested (Internal), Approved (Internal).
  - Implemented an internal workflow state machine in `assetService.updateAssetStatus` that:
    - Accepts normalized keys (`draft`, `in_progress`, `ready_for_internal_review`, `in_internal_review`, `changes_requested_internal`, `approved_internal`).
    - Enforces legal transitions (e.g., Draft → In Progress → Ready for Internal Review → In Internal Review → Approved (Internal)).
  - Updated `PATCH /api/assets/:assetId/status` to use the new keys and return detailed error reasons for illegal transitions.
- **Projects and clients**
  - Added `clients` and `projects` tables via migrations; linked `assets.project_id` to projects.
  - Implemented `/api/clients` (list + create) with `manager`/`admin` role checks.
  - Implemented `/api/projects` (list + create) and `GET /api/projects/:projectId` that returns a project plus a summary of its assets and statuses.
  - Verified the full flow by:
    - Creating a client and project.
    - Creating an asset attached to the project.
    - Walking the asset through the internal status pipeline and confirming the project view updates (`Approved (Internal)`).
- **Asset content model upgrades**
  - Added `asset_type` and `external_url` columns to `assets` plus wiring in `assetService` and `assets` routes.
  - Documented creative `asset_type` values (e.g., `figma`, `mockup`, `brief`, `ticket`, `repo`, `chat`, `crm`, `analytics`, `research`, `note`, `decision`, etc.) so the frontend can render different views and icons per type.

**Challenges:**
- Getting the status state machine and existing lookup data to line up so new assets starting in `Draft` could move cleanly through the internal workflow without breaking old statuses like `In Review`.
- Making sure cURL commands in zsh were correct (line continuations and quotes) so I could reliably exercise the new endpoints while iterating on the service logic.
- Keeping the growing Sprint 2 documentation coherent (vision → flows → entities → requirements → tests) while simultaneously updating the backend to match.

**Next Steps:**
- Add a simple “debug” or helper endpoint to surface an asset’s current status and allowed next transitions for easier manual testing and UI wiring.
- Begin wiring frontend dashboards to the new `/api/clients`, `/api/projects`, and project-scoped asset list, with role-specific views (Designer “My work”, Reviewer queue, Manager project overview).
- Extend the workflow to include client review stages and eventually multiple workflow templates, building on the internal slice implemented today.

**Reflections:**
- Today’s work took the system from “flat asset list with comments” to something much closer to a real project/asset workflow product: there are now clients, projects, asset types, and a governed internal review pipeline.
- Having a solid doc set for Sprint 2 (personas, flows, IA, requirements, tests) made the backend changes feel purposeful rather than ad hoc; it also sets up the frontend work for a cleaner, more story-driven demo in future sprints.
