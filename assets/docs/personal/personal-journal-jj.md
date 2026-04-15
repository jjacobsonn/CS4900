# Personal Journal — Jackson Jacobson

**Project:** Vellum - Digital Asset Review & Approval Platform  
**Course:** CS 4900 - Senior Capstone Project  
**Student:** Jackson Jacobson (jjacobsonn)

---

## Sprint 1 - Week 1 (February 10-16, 2026)

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
- Updated all documentation for Sprint 1 Review

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
- Prepare for Sprint 1 Review presentation
- Address any feedback from review team
- Plan Sprint 2 features (authentication, additional endpoints)

**Reflections:**
Successfully transitioned from planning to implementation. We have a working full-stack application with database integration that exceeds Sprint 1 requirements. The foundation is solid for building out additional features in Sprint 2.

---

## Sprint 1 - Individual Tasks

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
- [x] Sprint 1 Review preparation

---

## Notes & Observations

- The project uses PostgreSQL as the database (per architecture doc)
- Need to create normalized lookup tables for roles and approval statuses
- Team coordination will be important as we start implementing features
- Testing infrastructure needs to be set up early to support TDD approach

---

**Last Updated:** February 16, 2026

---

## Sprint 2 - Week 1 (Feb 24 - Mar 2, 2026)

### February 27, 2026

**Tasks Completed:**
- Implemented additional backend API scaffolding and started authentication planning
- Wrote unit tests for `userRoleService` and fixed minor edge cases
- Reviewed teammate code for frontend routing and merged small fixes

**Challenges:**
- Authentication design decisions to finalize in Sprint 2 planning

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

### March 19, 2026 — Sprint 2 Review Prep (Backend, Admin, Versioning)

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
- Designers and reviewers have clearer, role-based flows (upload vs review) and comments/versions are now tied to real users and database-backed history, which will make Sprint 2’s review much easier to demonstrate.

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

## Final Prep

### April 30, 2026

**Tasks Completed:**
- Finalized demo walkthrough
- Added final notes to `assets/docs/project-management/project-follow-up.md`

**Reflections:**
- The project reached a stable state ready for final review; main items remaining are deployment notes and final polish.

**Last Updated:** February 23, 2026
