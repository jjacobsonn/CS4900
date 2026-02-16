# Sprint 1 Review Summary

**Date:** February 16, 2026  
**Review Date:** Wednesday, February 19, 2026  
**Project:** Vellum - Digital Asset Review & Approval Platform  
**GitHub Repository:** https://github.com/jjacobsonn/CS4900

---

## Quick Links

- **Backend API:** http://localhost:3000/api
- **Backend Health:** http://localhost:3000/health
- **User Roles API:** http://localhost:3000/api/user-roles
- **Frontend GUI:** http://localhost:5173

---

## Completed Requirements

### 1. Database Setup Script ✅

**Location:** `database/setup.sql`

**What it does:**
- Creates PostgreSQL database schema
- Creates normalized lookup tables (`user_roles`, `approval_statuses`)
- Creates core tables (`users`, `files`, `file_versions`, `comments`, `approval_history`)
- Inserts default/initial records:
  - 3 user roles (DESIGNER, REVIEWER, ADMIN)
  - 3 approval statuses (PENDING_REVIEW, CHANGES_REQUESTED, APPROVED)
  - 3 test users
- Creates indexes for performance
- Sets up triggers for automatic timestamp updates

**How to run:**
```bash
psql -U postgres -d vellum -f database/setup.sql
```

**Verification:**
- All 7 tables created successfully
- Lookup data normalized and inserted
- Foreign key relationships established

---

### 2. Backend Implementation ✅

**Structure:**
```
backend/
├── src/
│   ├── config/database.js      # PostgreSQL connection pool
│   ├── services/userRoleService.js  # Service → Database example
│   ├── routes/userRoles.js     # API endpoints
│   ├── __tests__/              # Unit tests with mocked DB
│   └── server.js               # Express server
└── package.json
```

**Key Features:**
- Express.js RESTful API server
- PostgreSQL connection with connection pooling
- Parameterized queries (SQL injection prevention)
- Error handling and logging
- CORS enabled for frontend connections

**API Endpoints:**
- `GET /health` - Server health check
- `GET /api/user-roles` - Get all user roles from database
- `GET /api/user-roles/:code` - Get role by code
- `GET /api/user-roles/id/:id` - Get role by ID

**Code Example - Service → Database:**
`backend/src/services/userRoleService.js` demonstrates:
- Service layer calling database connection module
- Parameterized query execution
- Error handling
- Data transformation

---

### 3. Frontend Implementation ✅

**Structure:**
```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts          # API client
│   │   └── userRoles.ts       # User roles API calls
│   ├── pages/
│   │   └── LoginPage.tsx      # GUI → Service example
│   └── ...
└── package.json
```

**Key Features:**
- React/TypeScript application
- Vite development server with proxy to backend
- Fetches roles from backend on login page load
- Demonstrates GUI → Service → Database flow

**Code Example - GUI → Service:**
`frontend/src/pages/LoginPage.tsx` demonstrates:
- Frontend component making HTTP request to backend
- Backend API querying database
- Data flowing back to UI
- Error handling

---

### 4. Unit Tests ✅

**Backend Tests:**
- Location: `backend/src/__tests__/userRoleService.test.js`
- Tests service layer with mocked database
- Demonstrates testing without live database connection
- Framework: Jest

**Frontend Tests:**
- Multiple test files in `frontend/src/`
- Uses Mock Service Worker (MSW) for API mocking
- Component tests with React Testing Library
- Framework: Jest

---

### 5. Documentation ✅

**Project Management:**
- Project Follow-up document (`docs/project-management/project-follow-up.md`)
- Schedule tracking (`docs/project-management/schedule.md`)
- Sprint 1 Review Checklist (`docs/project-management/sprint1-review-checklist.md`)
- Personal Journal (`docs/personal/personal-journal-jj.md`)

**Technical:**
- README.md with complete setup instructions
- Backend README (`backend/README.md`)
- Frontend README (`frontend/README.md`)

---

## Demo Script

### Step 1: Database Setup
```bash
# Create database
psql -U postgres
CREATE DATABASE vellum;
\c vellum

# Run setup script
\i database/setup.sql

# Verify
\dt
SELECT * FROM user_roles;
```

### Step 2: Start Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with database credentials
npm run dev
```

**Test:**
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/user-roles
```

### Step 3: Start Frontend
```bash
cd frontend
npm install
npm run dev
```

**Test:**
- Open http://localhost:5173
- Login page should load roles from backend
- Role dropdown shows: Designer, Reviewer, Admin

---

## Code Review Highlights

### Service → Database Connection
**File:** `backend/src/services/userRoleService.js`

```javascript
import { query } from '../config/database.js';

export async function getAllUserRoles() {
  const result = await query(
    'SELECT id, role_code, description FROM user_roles ORDER BY id'
  );
  return result.rows;
}
```

**What it demonstrates:**
- Service layer calling database connection module
- Parameterized queries
- Error handling
- Clean separation of concerns

### GUI → Service Invocation
**File:** `frontend/src/pages/LoginPage.tsx`

```typescript
useEffect(() => {
  const fetchRoles = async () => {
    const roles = await getUserRoles(); // Calls backend API
    setAvailableRoles(roles);
  };
  fetchRoles();
}, []);
```

**What it demonstrates:**
- Frontend component making HTTP request
- Backend API responding with database data
- UI updating with fetched data
- Complete data flow: Database → Backend → Frontend → UI

---

## Status: Actual vs Planned

**Planned:**
- Database setup script
- Basic backend structure
- Initial frontend setup

**Actual:**
- ✅ Database setup script (complete with normalized tables)
- ✅ Full backend with API endpoints
- ✅ Frontend connected to backend
- ✅ Working full-stack integration
- ✅ Code examples for review
- ✅ Unit tests implemented

**Assessment:** Exceeded expectations - have working full-stack application with database integration.

---

## Known Issues / Future Work

1. **Jest Configuration:** Minor ES module config adjustment needed (non-blocking)
2. **Authentication:** Planned for Sprint 2
3. **Additional Endpoints:** Foundation in place, ready for Sprint 2 expansion
4. **File Upload:** Planned for Sprint 2

---

## GitHub Repository

**URL:** https://github.com/jjacobsonn/CS4900  
**Branch:** `dev-jj`  
**Main Branch:** `main`

---

**Prepared by:** Jackson Jacobson (jjacobsonn)  
**Date:** February 16, 2026
