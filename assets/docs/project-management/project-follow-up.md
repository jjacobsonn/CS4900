# Project Follow-up — Vellum

**Project:** Vellum - Digital Asset Review & Approval Platform  
**Course:** CS 4900 - Senior Capstone Project  
**Institution:** Utah Valley University  
**Term:** Spring 2026

---

## Current Date
**Date:** April 15, 2026  
**Sprint:** Sprint 3 - Frontend integration, project workflow, role-based UX, and review verification.

**Sprint 3 purpose:** Prepare a review-ready, end-to-end version of Vellum that demonstrates the real application workflow: login, role-based navigation, project setup, project-linked upload, dashboard/queue filtering, asset review actions, comments, password lifecycle, and organization/project-owner flows. Use the **[Sprint 3 verification guide](../sprint-3/VERIFICATION-GUIDE.md)** and **[backend runbook](../sprint-3/backend/backend-runbook.md)** as the main setup and sign-off references.

---

## Schedule Status

### Overall Project Timeline
- **Sprint 0:** Completed - Documentation and planning phase
- **Sprint 1:** Completed - Initial implementation and database setup
- **Sprint 2:** Completed/Review - Core API endpoints, authentication, admin dashboard, upload, versioning, and workflow foundations
- **Sprint 3:** In Progress/Review - Frontend integration, project workflow, role-based UX, organization/project-owner flow, and verification
- **Sprint 4:** Planned - Testing refinement, polish, and final hardening

### Current Sprint (Sprint 3) Status
- Backend and frontend are running end-to-end against PostgreSQL with JWT Bearer authentication.
- Database setup and migration flow were improved so `db:setup` and `db:deploy` consistently target the configured `DB_NAME`.
- Project and client workflows are now visible in the UI, including Admin project management, project-linked uploads, dashboard project filters, and linked asset lists.
- Workflow status actions are clearer in the UI and aligned with backend state transitions.
- Password set/reset flows were added to Admin and Organization user management.
- Project membership/assignment logic was added so managers can coordinate project teams without giving every user global admin access.
- Sprint 3 verification documentation now covers setup, automated tests, role matrix, and browser scenarios for real-world workflows.

---

## Items or Milestones Completed This Past Sprint

### Sprint 0 (Completed)
1. **Project Vision & Requirements**
   - Elevator pitch document created
   - Functional requirements documented
   - Non-functional requirements defined

2. **Design & Architecture**
   - System architecture documented
   - Database ERD created
   - API JSON contracts defined
   - Sequence diagrams created
   - Figma wireframes designed

3. **Planning Documents**
   - User personas defined
   - Use cases documented
   - Testing plans (whitebox and UAT) created

### Sprint 1 (Completed)
1. **Database Setup**
   - Database schema finalized and implemented
   - SQL setup script created and tested
   - PostgreSQL database initialized with normalized tables
   - Lookup tables created (user_roles, approval_statuses)
   - Default records inserted (3 roles, 3 statuses, 3 test users)
   - Indexes and triggers configured

2. **Backend Implementation**
   - Express.js server structure created
   - PostgreSQL connection module implemented
   - Database connection pool configured
   - User roles API endpoints created (`/api/user-roles`)
   - Service layer implemented (`userRoleService.js`)
   - Example service to database connection demonstrated
   - Unit tests created with mocked database

3. **Frontend Implementation**
   - React/TypeScript application merged from teammate
   - Frontend reorganized into `frontend/` directory
   - Vite proxy configured to connect to backend
   - Login page updated to fetch roles from backend
   - GUI to service invocation demonstrated
   - Frontend tests configured (Jest with MSW)

4. **Project Structure**
   - Repository initialized
   - Documentation organized in `assets/docs/` folder
   - Branch structure established (dev-jj, merged lw-dev)
   - Professional folder structure implemented

### Post-Sprint 1 (Feb 23, 2026) - Re-implementation Phase 0 & 1
- **Phase 0:** Archive `sprint-1-baseline` created; `sprint-2/` and reimplementation plan added; `DOC-VERSIONING.md` and `review-prep-and-cadence.md` for review cadence.
- **Phase 1:** Reviewer upload disabled in nav and route; Backend Test visible only to admin; Admin user table added with loading/error state.
- Personal journal (JJ) updated; changes pushed to `dev-jj`.

### Sprint 2 (through March 19, 2026) - Backend + Admin + Versioning
- **Authentication & roles**
  - Added `/api/auth/login` endpoint backed by real `users` and `user_roles` tables.
  - Frontend login calls the backend and stores a token plus user information.
  - Role-based route protection was added for assets, users, and admin endpoints.
- **User management and admin dashboard**
  - Implemented `/api/users` CRUD with admin-only access.
  - Added display names, deactivate/reactivate actions, overview counts, and recent activity.
  - Admin can clean up bad test data by deleting assets/comments where policy allows.
- **Assets, comments, ownership, and versioning**
  - Assets and comments now store real user attribution.
  - Admin can reassign asset ownership from the detail page.
  - `asset_versions` supports version history and new version creation.

### Sprint 3 (through April 15, 2026) - Frontend Integration + Project Workflow + Verification
- **Database setup and runbook**
  - Updated local database setup so schema and seed data are applied to the configured database instead of a hard-coded database name.
  - Added Sprint 3 backend runbook covering DB commands, JWT requirements, API surface, migration strategy, and common failure modes.
- **Dashboard, queue, and project filtering**
  - Dashboard supports project filtering and URL sync using `projectId`.
  - Queue behavior was cleaned up so review/rework states are easier to demo.
  - Asset cards and details expose project context where available.
- **Workflow UX**
  - Review action buttons were simplified so users see the next relevant action instead of long instructional copy.
  - Frontend workflow action mapping was aligned with backend status transition keys.
  - Internal/client approve and request-changes actions use clearer short labels.
- **Projects and clients**
  - Projects now have stronger backend and frontend support: list, create, detail, update, delete, asset counts, linked assets, and contributors.
  - Admin project management includes create/edit/delete, upload links, queue links, project detail, and linked asset navigation.
  - Client APIs support dropdowns and project relationships.
- **Organization and project ownership**
  - `project_owner` users can use organization/project-owner flows without full Admin access.
  - Project-owner workflows include scoped project visibility and teammate/team flows.
- **Password lifecycle**
  - Admin and Organization user flows include password set/reset support.
  - Verification guide includes a dedicated password lifecycle scenario.
- **Project team assignments**
  - Added `project_members` assignment model for project-level team membership.
  - Managers can manage assignments in their authorized scope while backend guards prevent inappropriate assignment of admin/org-owner users.
- **Sprint 3 verification**
  - Added a complete verification guide covering setup, automated tests, role matrix, manual browser scenarios, and final sign-off.
  - Manual demo paths cover admin setup, org lead setup, project ownership, upload, queue, review, password reset, and role restrictions.

---

## Test Coverage Status and Gaps

### Current automated coverage
- **Backend tests currently present**
  - `backend/src/__tests__/assetsApi.test.js`
  - `backend/src/__tests__/jwtService.test.js`
  - `backend/src/__tests__/projectsApi.test.js`
  - `backend/src/__tests__/userService.test.js`
  - `backend/src/__tests__/userRoleService.test.js`
- **Frontend tests currently present**
  - `frontend/src/pages/AdminPage.test.tsx`
  - `frontend/src/pages/UploadPage.test.tsx`
  - `frontend/src/pages/AssetDetailPage.test.tsx`
  - `frontend/src/pages/DashboardPage.test.tsx`
  - `frontend/src/pages/ProjectsPage.test.tsx`
  - `frontend/src/utils/permissions.test.ts`
  - `frontend/src/utils/workflowReview.test.ts`
  - `frontend/src/utils/assetStatus.test.ts`
  - `frontend/src/utils/format.test.ts`
- **Manual verification coverage**
  - Sprint 3 verification guide covers environment setup, `npm test`, `npm run build`, health check, role matrix, admin/project-owner setup, project upload/review flow, organization teammate flow, password set/reset, and basic edge cases.
- **Current command results (April 15, 2026)**
  - `npm test` passes: backend 5 suites / 31 tests; frontend 9 suites / 22 tests.
  - `npm run build` passes for the frontend production build.
  - Build warning to track: `src/api/client.ts` uses `eval`, which Vite flags as a security/minification risk.

### Where coverage is currently lacking
1. **Project membership and assignment tests**
   - Added initial backend tests for `GET/POST/DELETE /api/projects/:projectId/members`.
   - Added frontend manager team-view test covering hidden admin members, hidden organization-owner assignment targets, and allowed designer assignment.
   - Covered: assigned project member can view team, manager cannot assign platform admin, admin can assign an organization member, and designer cannot remove members.
   - Still needed: manager cannot assign organization owners, non-org users cannot be assigned, duplicate assignment idempotency, and manager scope across multiple projects/orgs.

2. **Password lifecycle tests**
   - Added backend tests for create-user password hashing, short-password rejection, and reset-password hashing.
   - Added frontend Admin create-user password confirmation mismatch test.
   - Need frontend tests for minimum length, reset success, and reset error handling.
   - Need at least one test proving old passwords stop working after reset.

3. **Organization/project-owner flow tests**
   - Need tests for `/api/owner` scope rules: project owner sees only owned/scoped projects and invited teammates.
   - Need frontend tests that Organization appears for `project_owner` but Admin does not.
   - Need duplicate invite and deactivated teammate edge-case tests.

4. **Project CRUD and dashboard filter tests**
   - Need backend tests for project create/update/delete, client validation, asset count, and linked assets.
   - Added frontend test for dashboard `?projectId=` filtering and project upload CTA.
   - Need tests for project-linked upload defaults and stale/invalid project IDs.

5. **Workflow transition tests**
   - Current tests cover some asset status cases, but the full state machine is not exhaustively covered.
   - Need matrix-style tests for legal and illegal transitions by role: designer, reviewer, manager, client reviewer, admin/super admin.
   - Need tests for client review stages if those are demoed.

6. **Comments/version audit tests**
   - Current backend tests cover comment creation with `asset_version_id` behavior.
   - Need tests for comment delete permissions, comment display metadata, version edit/delete audit trail, and version attachment replace/remove.

7. **End-to-end / integration tests**
   - Current automated tests are mostly unit/API-level with mocks.
   - Need at least one real browser or integration path covering login -> create project -> upload asset -> review action -> comment -> password reset.
   - If a full E2E framework is too much for Sprint 3, record manual execution results from `VERIFICATION-GUIDE.md` for review evidence.

### Recommended Sprint 3 test priorities
1. Add remaining frontend password reset tests: minimum length, reset success, and reset API error handling.
2. Add project-linked upload tests for URL defaults and stale/invalid project IDs.
3. Add remaining project membership edge cases: organization-owner assignment block, non-org user assignment, and cross-project manager scope.
4. Add workflow transition matrix tests because state-machine regressions are easy to introduce.
5. Record manual verification results for the end-to-end demo paths that are not automated yet.

---

## Red Flags or Important Issues to Discuss

### Technical Concerns
1. **Testing**
   - Automated tests exist for key backend assets/JWT/user-role behavior and several frontend pages/utilities.
   - Project membership, password lifecycle, project-owner scope, project CRUD, and dashboard project filtering need stronger automated coverage.
   - Full end-to-end browser tests are not implemented yet; Sprint 3 currently relies on the manual verification guide for full workflow sign-off.

2. **Development Environment**
   - `backend/.env` must include consistent `DB_*` values and `JWT_SECRET`.
   - `npm run db:setup` is for first-time local setup; `npm run db:deploy`/`db:migrate` is the standard migration path after pulls.
   - Teammates must run migrations so Sprint 3 schema additions such as `project_members` exist locally.

3. **Future Enhancements**
   - Add refresh tokens or session expiration handling beyond basic JWT.
   - Add first-login forced password change for invite-created users.
   - Add cloud/object storage for uploaded files.
   - Add assigned-member counts and "my assigned projects" filters.
   - Add broader integration/E2E test automation.

### Project Management
1. **Timeline**
   - Sprint 3 review prep is underway for mid-April 2026. Confirm the exact review date because some docs list April 16, while April 15 is the third Wednesday.
   - Sprint 4 should focus on testing refinement, polish, and final hardening rather than large new feature expansion.

2. **Team Coordination**
   - Keep personal journals, schedule, and this follow-up synchronized before review.
   - Agree which Sprint 3 manual verification scenarios each team member will run.
   - Track test gaps as explicit Sprint 4 work if they are not completed before review.

---

## Code Review Notes

- Review project membership authorization and confirm manager/project-owner/admin boundaries.
- Review password set/reset implementation and confirm bcrypt hashing is used consistently.
- Review workflow transition mapping between frontend buttons and backend status state machine.
- Review migration/runbook process and confirm teammates can reproduce setup locally.

---

## Action Items to be Completed as a Result of Review

- Run `npm run db:deploy`, `npm test`, and `npm run build`; record results in Sprint 3 verification notes.
- Run Sprint 3 manual scenarios 2, 3, 4 or 5, 7.1, and role-restriction edge cases from `VERIFICATION-GUIDE.md`.
- Add automated tests for password lifecycle and project membership/assignment.
- Update schedule and personal journals so Sprint 3 status matches the actual implementation.
- Decide what moves to Sprint 4: E2E tests, assigned-project filters, first-login password change, and cloud/object storage.

---

## Additional Notes or Suggestions Made by Review Group

_To be filled during or immediately after the Sprint 3 review meeting._

---

## Meeting Cadence & Team Responsibilities

- **Follow-up cadence:** The project team will perform a documented project review every four weeks. Meetings are scheduled for the **3rd Wednesday** of each month (Sprint review) and once more on the date/time of the course final exam for the Final Review. See **`review-prep-and-cadence.md`** for the full before-meeting checklist and sprint review requirements.
- **Who should update docs before a review:** Each team member is responsible for updating the following prior to the review meeting:
   - Personal Journal (your individual `assets/docs/personal/*` entry)
   - `assets/docs/project-management/schedule.md` to mark items completed
   - `assets/docs/project-management/project-follow-up.md` (this file) — add current date, schedule status, completed items, and red flags
   - Any sprint-specific follow-up document (e.g., `sprint1-review-summary.md`)
- **Meeting prep checklist for each individual:**
   - Update your Project Journal(s)
   - Update your Schedule to mark items completed
   - Update the 'Project Follow-up' document with current Date, Schedule Status, items completed this past sprint, and Red Flags to discuss

During the review meeting the group will capture:
- Code review notes
- Action items to be completed as a result of the review
- Any additional notes or suggestions

## Example Project Follow-up Entry (Final Review)

**PROJECT :  Final Project Review**  
**Name:** Nav L. Volcy (10611913)  
**Date:** 04-30-2026  
**Status:** Green Light

**What did I do ?**
- Implemented the Pharmacy Edit page, which users are directed to upon clicking the Edit button.
- Implemented the Save button functionality to confirm successful changes to the user, clear the input fields, and redirect back to the Pharmacy page.
- Updated the PharmacyViewModel to interact with the database by incorporating a database context and enabling saving of new pharmacy entries when the Save button is clicked.
- Fixed testing bugs:
   - PharmacyControllerTests
   - IRepository.cs
- Successfully connected to the localhost on port 5140

**What problems did I run into ?**
- The edit page’s name tag is not retrieving pharmacy names from the database for auto-fill and editing functionality.

---

## Links & GitHub

- Instructor GitHub account for project reviews: https://github.com/gregorymortensen-uvu


## Sprint 1 Review Checklist

### Setup & Installation
- [x] Tools downloaded and installed (Node.js, PostgreSQL, Git)
- [x] Dependencies installed (`npm install` in backend and frontend)
- [x] Environment variables configured (`.env` file)
- [x] Database created and initialized
- [x] Server components start correctly
- [x] Default URLs documented:
  - [x] Backend API URL: `http://localhost:3000/api`
  - [x] Backend Health: `http://localhost:3000/api/health`
  - [x] Frontend GUI URL: `http://localhost:5173`

### Code Review Preparation
- [x] Example code: Service → Database connection (`backend/src/services/userRoleService.js`)
- [x] Example code: GUI → Service invocation (`frontend/src/pages/LoginPage.tsx`)
- [x] Unit tests created:
  - [x] Class unit tests (`backend/src/__tests__/userRoleService.test.js`)
  - [x] Business logic tests (included in service tests)
  - [x] Mock DB for web service tests (Jest mocks)
  - [x] Mock web service for GUI tests (MSW in frontend)

### Demo Preparation
- [x] Newly functioning features demo-ready
- [x] Bug fixes documented (none required)
- [x] Known deficiencies listed (see below)
- [x] Status comparison (actual vs planned) - see below

---

## Demo Walkthrough

### 1. Database Setup
- Show `database/setup.sql` script
- Demonstrate running script: `psql -U postgres -d vellum -f database/setup.sql`
- Verify tables created: `\dt` in psql
- Show normalized lookup data: `SELECT * FROM user_roles;`

### 2. Backend Server
- Start backend: `cd backend && npm run dev`
- Show server running on port 3000
- Test health endpoint: `curl http://localhost:3000/health`
- Test user roles API: `curl http://localhost:3000/api/user-roles`

### 3. Frontend Connection
- Start frontend: `cd frontend && npm run dev`
- Show login page loading roles from backend
- Demonstrate role dropdown populated from database
- Show network tab confirming API calls

### 4. Code Examples
- **Service → Database:** `backend/src/services/userRoleService.js`
- **GUI → Service:** `frontend/src/pages/LoginPage.tsx` (useEffect fetching roles)
- **Database Connection:** `backend/src/config/database.js`

## Known Deficiencies

1. **Jest Configuration:** Minor ES module configuration issue (non-blocking)
2. **Authentication:** Not yet implemented (planned for Sprint 2)
3. **Additional Endpoints:** Only user roles endpoint implemented (foundation for Sprint 2)
4. **Error Handling:** Basic error handling implemented, can be enhanced

## Status Comparison

**Planned:** Database setup, basic backend structure, initial frontend  
**Actual:** Database setup complete, full backend with API endpoints, frontend connected to backend

**Assessment:** Better than planned - we have a working full-stack connection with database integration, which exceeds Sprint 1 requirements.

---

**Last Updated:** April 15, 2026
