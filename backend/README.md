# Vellum Backend

Express.js RESTful API server for the Vellum digital asset review platform.

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js             # PostgreSQL connection pool
│   │   └── upload.js               # Multer upload config and file URL helpers
│   ├── routes/
│   │   ├── assets.js               # Assets API endpoints (CRUD, upload, status, comments, versions)
│   │   └── userRoles.js            # User roles API endpoints
│   ├── services/
│   │   ├── assetService.js         # Business logic for assets, file metadata, and workflows
│   │   └── userRoleService.js      # Business logic for user roles
│   ├── middleware/                 # Custom middleware (future)
│   ├── __tests__/
│   │   ├── assetsApi.test.js       # Assets API route tests (mocked DB)
│   │   └── userRoleService.test.js # User roles unit tests (mocked DB)
│   └── server.js                  # Express server entry point
├── .env.example                   # Environment variables template
├── package.json                   # Dependencies and scripts
└── jest.config.js                 # Jest test configuration
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and set JWT_SECRET (required).
   ```

3. **Ensure database is set up:**
   ```bash
   # From project root
   psql -U postgres -d vellum -f database/setup.sql
   ```

## Running

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start on `http://localhost:3000` (or PORT from .env)

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### User Roles (requires JWT)
- `GET /api/user-roles` - Get all user roles
- `GET /api/user-roles/:code` - Get role by code (DESIGNER, REVIEWER, ADMIN)
- `GET /api/user-roles/id/:id` - Get role by ID

### Authentication
- `POST /api/auth/login` — email/password; returns `{ token, user }`. Send `Authorization: Bearer <token>` on other `/api/*` routes (except `/api/health` and this login).
- Protected routes return `401` without a valid JWT, and `403` when the JWT role is not allowed for that action.

### Assets (JWT + role-protected)
- `GET /api/assets` - List all assets (requires valid JWT)
- `GET /api/assets/:id` - Get asset by ID
- `POST /api/assets` - Create asset (designer, manager, admin, or super_admin; multipart supported)
- `PATCH /api/assets/:id/status` - Update asset status (reviewer-capable roles)
- `POST /api/assets/:id/comments` - Add comment (actor is the authenticated user)
- `GET /api/assets/:id/comments` - List comments for asset
- `GET /api/assets/:id/versions` - List asset versions
- `POST /api/assets/:id/versions` - Create a new asset version (designer-capable roles; multipart supported)

### Uploaded Files
- `GET /uploads/:filename` - Serve uploaded asset files stored on the backend server

## Testing

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

Tests use mocked database connections, so no live database is required for unit tests. Upload route tests write to an isolated temporary directory during test runs.

- **assetsApi.test.js** – Mocks `config/database.js` and exercises assets routes (POST create, PATCH status, GET list, role checks, comments). Each test resets mocks and supplies the exact query sequence the service expects (e.g. createAsset: status lookup → insert asset → insert version → getAssetById).
- **userRoleService.test.js** – Unit tests for user role service (with mocked DB and error-path tests).

## Code Examples

### Service → Database Connection

The `userRoleService.js` demonstrates how services connect to the database:

```javascript
import { query } from '../config/database.js';

export async function getAllUserRoles() {
  const result = await query(
    'SELECT id, role_code, description FROM user_roles ORDER BY id'
  );
  return result.rows;
}
```

### Database Connection Module

The `database.js` module provides:
- Connection pooling for performance
- Parameterized queries (SQL injection prevention)
- Error handling and logging
- Connection testing utilities

## Environment Variables

See `.env.example` or `backend/.env` for required variables:
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (vellum)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `UPLOAD_DIR` - Relative or absolute upload directory used by multer/static file serving
