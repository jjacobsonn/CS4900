# Sprint 1 Review Checklist

**Date:** February 16, 2026  
**Review Date:** Wednesday, February 19, 2026 (3rd Wednesday)  
**Project:** Vellum - Digital Asset Review & Approval Platform

---

## Documentation Completed

- [x] **Project Follow-up Document** - Created (`docs/project-management/project-follow-up.md`)
- [x] **Personal Journal** - Created (`docs/personal/personal-journal-jj.md`)
- [x] **Schedule** - Created (`docs/project-management/schedule.md`)
- [x] **Database Setup Script** - Created (`database/setup.sql`)
- [x] **README Updated** - Detailed setup instructions added

---

## Sprint 1 Review Requirements Checklist

### Pre-Meeting Preparation

#### Documentation Updates
- [x] Update Project Journal(s)
- [x] Update Schedule to mark items completed
- [x] Update Project Follow-up document
  - [x] Current Date
  - [x] Schedule Status
  - [x] Items/milestones completed
  - [x] Red Flags/Important Issues

---

### Sprint 1 Review Items

#### 1. Setup & Installation

- [ ] **Download and install necessary tools**
  - [ ] Node.js installed
  - [ ] PostgreSQL installed
  - [ ] Git installed
  - [ ] Code editor (VS Code recommended)

- [ ] **Download and install dependencies**
  - [ ] Backend: `cd backend && npm install`
  - [ ] Frontend: `cd frontend && npm install`

- [ ] **Start server components in correct order**
  - [ ] PostgreSQL database started
  - [ ] Backend server started (`npm run dev` in backend/)
  - [ ] Frontend server started (`npm start` in frontend/)

- [ ] **Database Setup Script**
  - [x] SQL script created (`database/setup.sql`)
  - [ ] Script tested and verified
  - [ ] Database created successfully
  - [ ] Tables created successfully
  - [ ] Default/initial records inserted:
    - [x] User roles (DESIGNER, REVIEWER, ADMIN)
    - [x] Approval statuses (PENDING_REVIEW, CHANGES_REQUESTED, APPROVED)
  - [ ] Normalized lookup tables verified

- [ ] **Default URLs**
  - [ ] Backend API URL: `http://localhost:3000/api`
  - [ ] Frontend GUI URL: `http://localhost:3001`

#### 2. Code Review Preparation

- [ ] **Example code: Service → Database connection**
  - [ ] Database connection module
  - [ ] Example service using database
  - [ ] Code comments explaining connection

- [ ] **Example code: GUI → Service invocation**
  - [ ] API client/service in frontend
  - [ ] Example component calling API
  - [ ] Code comments explaining invocation

#### 3. Unit Tests

- [ ] **Class unit tests**
  - [ ] Test files created
  - [ ] Example class tests written

- [ ] **Business logic tests**
  - [ ] Business logic functions tested
  - [ ] Edge cases covered

- [ ] **Mock DB for web service tests**
  - [ ] Mock database setup
  - [ ] Service tests using mocks

- [ ] **Mock web service for GUI tests**
  - [ ] Mock API setup
  - [ ] Frontend tests using mocks

#### 4. Demo Preparation

- [ ] **Newly functioning facets**
  - [ ] List features implemented this sprint
  - [ ] Prepare demo walkthrough

- [ ] **Bug fixes**
  - [ ] Document any bugs fixed
  - [ ] Show before/after if applicable

- [ ] **Known deficiencies/bugs**
  - [ ] List known issues
  - [ ] Explain workarounds if any

- [ ] **Status comparison**
  - [ ] Actual status vs planned status
  - [ ] Explanation of differences
  - [ ] Whether better or worse, and why

---

## Critical Items Still Needed

### High Priority (Before Review)

1. **Backend Project Structure**
   - [ ] Initialize Node.js/Express project
   - [ ] Set up basic server
   - [ ] Database connection module
   - [ ] Environment configuration

2. **Frontend Project Structure**
   - [ ] Initialize React project
   - [ ] Set up basic routing
   - [ ] API client setup

3. **Database Connection**
   - [ ] Test database connection from application
   - [ ] Verify setup script works end-to-end

4. **Basic Code Examples**
   - [ ] At least one service connecting to database
   - [ ] At least one frontend component calling API

5. **Unit Test Framework**
   - [ ] Jest installed and configured
   - [ ] At least one example test

### Medium Priority

- [ ] Authentication setup (basic structure)
- [ ] File upload structure (directories)
- [ ] Error handling examples

---

## Notes for Review Meeting

### What We Have
- Complete project documentation
- Database schema designed and scripted
- Setup instructions documented
- Project structure planned

### What We Need
- Actual code implementation
- Working database connection
- Basic API endpoints
- Frontend structure
- Unit tests

### Questions for Review Team
- Timeline expectations for Sprint 1 vs Sprint 2
- Priority of features for demo
- Testing requirements clarification

---

## Quick Start Commands

```bash
# 1. Clone repository (if not already done)
git clone https://github.com/jjacobsonn/CS4900.git
cd CS4900

# 2. Set up database
psql -U postgres
CREATE DATABASE vellum;
\c vellum
\i database/setup.sql

# 3. Install dependencies (when backend/frontend exist)
cd backend && npm install
cd ../frontend && npm install

# 4. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# 5. Start servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm start
```

---

## GitHub Repository

**Repository URL:** https://github.com/jjacobsonn/CS4900

**Current Branch:** `dev-jj` (development branch)

**Main Branch:** `main`

---

**Last Updated:** February 16, 2026
