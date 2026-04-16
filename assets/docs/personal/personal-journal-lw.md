# Personal Journal - Landon Whitney

**Project:** Vellum - Digital Asset Review & Approval Platform  
**Course:** CS 4900 - Senior Capstone Project  
**Student:** Landon Whitney(LandonW385)

---

## Sprint 1 (February 18, 2026)

**Tasks Completed:**
- Built and iterated the Sprint 1 frontend screens:
  - Login page (seeded account workflow)
  - Dashboard/asset list page
  - Asset detail page (comments + version history)
  - Upload page
  - Admin page
- Implemented frontend API client/service layer for assets, comments, versions, and status updates
- Added backend asset support pieces for database-backed frontend flows:
  - Asset-related service/API wiring updates used by the UI
  - Database setup updates so seeded assets exist for dashboard/detail testing
- Added and updated mock webservice support (MSW) for GUI and test workflows
- Added frontend unit tests for key UI flows and helpers
- Emphasized responsive mobile layout
- Removed temporary role-toggle UI and aligned login flow to seeded user accounts
- Helped align frontend behavior with backend/database integration as endpoints stabilized

**Challenges:**
- Early frontend work was built before backend contracts fully stabilized
- Handling differences between mock data shape and database-backed API responses
- Balancing wireframe layout with solid responsive behavior across mobile and desktop

**Accomplishments:**
- Delivered a demo-ready Sprint 1 frontend workflow end-to-end
- Helped move asset workflows from mock-only behavior to database-backed behavior
- Established clean service-layer integration points so UI is backend-ready
- Improved mobile and desktop usability while preserving wireframe mobile-first intent

**Next Steps:**
- Continue tightening frontend/backend contract consistency
- Expand tests for edge states and API error handling
- Polish UI details and accessibility in Sprint 2
- Implement asset upload via UI

**Reflections:**
Sprint 1 frontend goals were met with a runnable GUI, tested UI flows, and clear API integration structure. The app now supports both mock-driven development and database-backed behavior, which sets up smoother feature delivery for Sprint 2.

---

## Sprint 1 - Individual Tasks

### Completed Tasks
- [x] Frontend scaffold and routing updates
- [x] Login, Dashboard, Asset Detail, Upload, and Admin pages
- [x] API client/service-layer implementation
- [x] Backend asset integration updates for frontend data flows
- [x] Database seeding/setup updates for assets used in UI testing
- [x] Mock service updates for realistic frontend testing
- [x] Frontend unit tests for core user flows
- [x] Wireframe-aligned visual polish
- [x] Seeded-account login flow alignment
- [x] Frontend documentation and README adjustments
- [x] Sprint 1 review/demo readiness support

---

## Notes & Observations

- Keeping a stable frontend service layer reduced rework as backend endpoints evolved
- MSW-based mocks remain useful for fast UI iteration and predictable tests
- Responsive QA surfaced important usability issues early in development(spacing, overlap, sizing)
- Documentation consistency across setup/testing/review artifacts helped sprint readiness

---

## Sprint 2 (March 12, 2026)

**Tasks Completed:**
- Implemented real asset upload flow across frontend and backend:
  - Frontend upload now sends multipart `FormData`
  - Backend accepts uploads with `multer`
  - Uploaded files are stored on the backend server and linked to asset versions
- Added upload validation and restrictions:
  - Limited uploads to image and PDF files
  - Added file-size/type validation in the UI
- Improved asset detail experience:
  - Replaced placeholder preview with real image/PDF preview behavior
  - Added open-full-file behavior and image lightbox-style enlargement
  - Displayed upload notes in the asset detail view
- Improved dashboard behavior and clarity:
  - Converted dashboard into a clearer review queue
  - Default queue now focuses on `In Review` and `Changes Requested`
  - Added queue summary metrics and a stronger filter layout
- Improved responsive/admin UX:
  - Added mobile hamburger navigation for smaller screens
  - Removed the Backend Test page from user-facing navigation
  - Reworked Admin page layout to behave better on mobile
- Fixed backend/frontend integration issues:
  - Preserved file preview data after status changes
  - Fixed dev proxy behavior for uploaded files
  - Isolated upload-related backend tests so real uploads are not deleted
- Updated documentation to match the implemented system state

**Challenges:**
- Real upload support touched multiple layers at once: database schema, backend routes, frontend forms, and previews
- File-link behavior in local development required Vite proxy fixes so uploaded files resolved correctly
- Some UI improvements looked acceptable in code but needed browser iteration to actually feel better in layout
- Test behavior briefly overlapped with real uploaded files before upload directories were isolated

**Accomplishments:**
- Moved asset upload from metadata-only behavior to a real working MVP with stored files
- Improved the product feel of the asset detail page with real previews instead of placeholder-only UI
- Made the dashboard more workflow-oriented and easier to understand as a review tool
- Helped reduce confusing or overly developer-facing UI by removing Backend Test from the main experience
- Brought top-level documentation closer to the actual implemented state of the application

**Next Steps:**
- Continue polishing the review queue cards and overall dashboard readability
- Add a more complete revised-version upload flow from the asset detail page
- Consider moving file storage from local disk to cloud/object storage later
- Keep tightening admin UX and documentation for sprint review readiness

**Reflections:**
Sprint 2 work made the app feel substantially more real. The biggest improvement was shifting uploads from placeholder/metadata behavior into a usable end-to-end flow with stored files and previews. The UI also became more intentional by focusing the dashboard on review work and removing or reducing screens that felt like development artifacts rather than product features.

---

## Sprint 2 - Individual Tasks

### Completed Tasks
- [x] Real frontend-to-backend asset upload flow
- [x] Backend multipart upload handling and file storage
- [x] Upload validation for supported file types and size
- [x] Asset detail preview improvements for images and PDFs
- [x] Upload notes surfaced in asset detail page
- [x] Dashboard redesign toward review queue workflow
- [x] Mobile hamburger navigation
- [x] Admin mobile responsiveness improvements
- [x] Removal of Backend Test from user-facing navigation
- [x] Upload/file-link bug fixes and test isolation improvements
- [x] README documentation updates

---

## Notes & Observations

- Real file upload required more coordination work than a typical frontend-only feature because route behavior, file serving, database metadata, and local dev setup all had to agree
- Small layout decisions had a big impact on perceived quality, especially on the dashboard and asset detail page
- Mobile-specific navigation and admin table behavior needed dedicated handling rather than relying on desktop layouts to scale down automatically
- Documentation drift happens quickly once implementation moves beyond the original sprint plan, so keeping readmes current matters for demos and reviews
- Next sprint focus or Jackson focus should probably be multi-tennant and getting permissions properly alligned

---

## Sprint 3 (April 15, 2026)

**Tasks Completed:**
- Continued frontend implementation and integration work for the Sprint 3 branch:
  - Helped refine dashboard behavior around project filters and review queues
  - Kept asset cards and asset detail views aligned with the latest backend asset/project fields
  - Supported clearer workflow action buttons for review states instead of long instructional UI copy
- Improved project-related frontend flows:
  - Helped verify project-linked upload behavior from project rows and dashboard filters
  - Reviewed how projects, linked assets, contributors, and queue links appear in the Admin/Projects experience
  - Checked that project-specific navigation stayed understandable for demo use
- Continued polishing upload and asset detail usability:
  - Verified drag-and-drop/click upload behavior after backend and UI updates
  - Checked that uploaded files still resolve through the local dev proxy
  - Continued focusing on preview/open-file behavior so different asset types remain usable
- Helped with role-based UI verification:
  - Checked navigation and page access for admin, designer, reviewer, manager, and project owner roles
  - Verified that restricted actions are hidden or blocked where appropriate
  - Confirmed that the UI reflects backend permission changes instead of relying only on frontend assumptions
- Supported Sprint 3 verification and review readiness:
  - Reviewed the Sprint 3 verification guide and user-flow checklist
  - Helped identify manual demo paths for admin setup, project ownership, upload, queue, review, and password reset
  - Continued updating documentation expectations so sprint review materials match the implemented app

**Challenges:**
- Sprint 3 touched many connected frontend areas at the same time: dashboard filters, project screens, asset detail, upload, workflow actions, and role-based navigation
- Keeping the UI simple while the backend workflow became more detailed required several rounds of review and polish, especially with a full overhaul
- Project ownership and assignment behavior needed careful checking so users only see the work they should see
- Documentation and implementation continued to drift quickly as the branch changed, so review prep required extra attention

**Accomplishments:**
- Helped move the frontend from a mostly asset-centered MVP toward a project-centered workflow
- Improved demo readiness by making common user paths easier to explain and verify
- Helped confirm that role-specific navigation and workflow actions behave consistently across the app
- Kept frontend polish focused on practical review scenarios instead of adding unnecessary screens
- Supported the Sprint 3 sign-off process with manual user-flow verification and documentation review

**Next Steps:**
- Run through the full Sprint 3 verification guide before review
- Add or expand frontend tests for password validation, reset errors, project filters, and role-specific visibility
- Continue polishing project/team assignment flows for manager, designer, and reviewer users
- Keep the schedule, project follow-up, and personal journals updated so they match the current Sprint 3 implementation

**Reflections:**
Sprint 3 was less about creating isolated screens and more about making the application work like a connected product. The frontend now has to respect projects, roles, workflow status, uploads, comments, and admin controls all at once. The biggest lesson was that small UI decisions, like what buttons appear for each workflow state or which role can see a page, have a large impact on whether the app feels reliable during a demo.

---

## Sprint 3 - Individual Tasks

### Completed Tasks
- [x] Dashboard review queue and project-filter verification
- [x] Project-linked upload flow review
- [x] Asset detail and workflow action UI checks
- [x] Admin/Projects frontend layout and usability review
- [x] Role-based navigation and access verification
- [x] Upload/dropzone behavior verification
- [x] Sprint 3 user-flow and verification guide review
- [x] Manual demo-path preparation for review
- [x] Documentation alignment support for Sprint 3

---

## Notes & Observations

- Project filters and project-linked uploads are important for explaining the app as a real workflow tool instead of just an asset list
- Role-based UI work needs backend enforcement behind it; frontend-only hiding is not enough for permissions
- The dashboard, upload page, and asset detail page are still the most important demo surfaces because they show the full asset lifecycle
- Sprint 3 documentation should clearly separate what has been implemented from what remains as polish, testing, or future hardening

---

**Last Updated:** April 15, 2026
