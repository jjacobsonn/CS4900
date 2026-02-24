# Project Follow-up — Vellum

**Project:** Vellum - Digital Asset Review & Approval Platform  
**Course:** CS 4900 - Senior Capstone Project  
**Institution:** Utah Valley University  
**Term:** Spring 2026

---

## Current Date
**Date:** February 18, 2026  
**Sprint:** Sprint 1 Review

---

## Schedule Status

### Overall Project Timeline
- **Sprint 0:** Completed - Documentation and planning phase
- **Sprint 1:** In Progress - Initial implementation and database setup
- **Sprint 2:** Planned - Core API endpoints and authentication
- **Sprint 3:** Planned - Frontend implementation
- **Sprint 4:** Planned - Testing and refinement

### Current Sprint (Sprint 1) Status
- Project documentation completed
- Database schema designed and implemented
- API contracts defined
- Database setup script created and tested
- Backend server implemented and running
- Frontend project initialized and connected to backend
- Database connection working (PostgreSQL)
- Service → Database code examples implemented
- GUI → Service code examples implemented
- Unit test framework configured (Jest)

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
   - Example service → database connection demonstrated
   - Unit tests created with mocked database

3. **Frontend Implementation**
   - React/TypeScript application merged from teammate
   - Frontend reorganized into `frontend/` directory
   - Vite proxy configured to connect to backend
   - Login page updated to fetch roles from backend
   - GUI → Service invocation demonstrated
   - Frontend tests configured (Jest with MSW)

4. **Project Structure**
   - Repository initialized
   - Documentation organized in `assets/docs/` folder
   - Branch structure established (dev-jj, merged lw-dev)
   - Professional folder structure implemented

---

## Red Flags or Important Issues to Discuss

### Technical Concerns
1. **Testing**
   - Jest configuration needs minor adjustment for ES modules
   - Some tests may need updates after code changes
   - Integration tests not yet implemented

2. **Development Environment**
   - Environment variables configured and working
   - Team coordination on local development setup complete
   - File storage location to be configured in Sprint 2

3. **Future Enhancements**
   - Authentication system to be implemented in Sprint 2
   - Additional API endpoints needed for full functionality
   - File upload functionality pending

### Project Management
1. **Timeline**
   - Sprint 1 review deadline: Wednesday (this week)
   - Need to prioritize core functionality for demo
   - May need to adjust scope if implementation takes longer than expected

2. **Team Coordination**
   - Ensure all team members have access to repository
   - Coordinate on feature assignments
   - Establish code review process

---

## Code Review Notes

_To be filled during review meeting_

---

## Action Items to be Completed as a Result of Review

_To be filled during review meeting_

---

## Additional Notes or Suggestions Made by Review Group

_To be filled during review meeting_

---

## Meeting Cadence & Team Responsibilities

- **Follow-up cadence:** The project team will perform a documented project review every four weeks. Meetings are scheduled for the **3rd Wednesday** of each month (Sprint review) and once more on the date/time of the course final exam for the Final Review.
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
  - [x] Backend Health: `http://localhost:3000/health`
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

**Last Updated:** February 16, 2026
