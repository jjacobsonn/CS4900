-- Sprint 2: basic clients, projects, and internal status seeds

BEGIN;

-- 1) Clients table (simple grouping by customer)
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER, -- reserved for future multi-org support
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2) Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  priority TEXT,
  due_date DATE,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3) Link assets to projects
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

-- 4) Seed internal-only workflow statuses used by the service
-- These assume asset_status_lookup(status_name) is unique.
INSERT INTO asset_status_lookup (status_name)
SELECT 'In Progress'
WHERE NOT EXISTS (
  SELECT 1 FROM asset_status_lookup WHERE status_name = 'In Progress'
);

INSERT INTO asset_status_lookup (status_name)
SELECT 'Ready for Internal Review'
WHERE NOT EXISTS (
  SELECT 1 FROM asset_status_lookup WHERE status_name = 'Ready for Internal Review'
);

INSERT INTO asset_status_lookup (status_name)
SELECT 'In Internal Review'
WHERE NOT EXISTS (
  SELECT 1 FROM asset_status_lookup WHERE status_name = 'In Internal Review'
);

INSERT INTO asset_status_lookup (status_name)
SELECT 'Changes Requested (Internal)'
WHERE NOT EXISTS (
  SELECT 1 FROM asset_status_lookup WHERE status_name = 'Changes Requested (Internal)'
);

INSERT INTO asset_status_lookup (status_name)
SELECT 'Approved (Internal)'
WHERE NOT EXISTS (
  SELECT 1 FROM asset_status_lookup WHERE status_name = 'Approved (Internal)'
);

COMMIT;

