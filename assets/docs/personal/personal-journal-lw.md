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

**Last Updated:** February 18, 2026
