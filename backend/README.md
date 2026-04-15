# Vellum Backend

Express.js RESTful API server for the Vellum digital asset review platform.

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js             # PostgreSQL connection pool
│   ├── routes/
│   │   ├── assets.js               # Assets API endpoints (CRUD, status, comments)
│   │   └── userRoles.js            # User roles API endpoints
│   ├── services/
│   │   ├── assetService.js         # Business logic for assets and workflows
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
   # Edit .env with your database credentials
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
- `GET /health` - Server health status

### User Roles
- `GET /api/user-roles` - Get all user roles
- `GET /api/user-roles/:code` - Get role by code (DESIGNER, REVIEWER, ADMIN)
- `GET /api/user-roles/id/:id` - Get role by ID

### Assets (role-protected)
- `GET /api/assets` - List all assets (any authenticated role)
- `GET /api/assets/:id` - Get asset by ID
- `POST /api/assets` - Create asset (designer or admin; requires `X-Vellum-Role`)
- `PATCH /api/assets/:id/status` - Update asset status (reviewer or admin)
- `POST /api/assets/:id/comments` - Add comment to asset
- `GET /api/assets/:id/comments` - List comments for asset

## Testing

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

Tests use mocked database connections, so no live database is required for unit tests.

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

See `.env.example` for required variables:
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (vellum)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
