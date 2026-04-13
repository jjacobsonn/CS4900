-- Organizations, per-org membership, and project scoping.
-- Global platform admins stay on users.role_id = ADMIN; org roles live in organization_members.

BEGIN;

INSERT INTO user_roles (role_code, description)
VALUES ('MANAGER', 'Manager — can manage projects and teams within an organization')
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO user_roles (role_code, description)
VALUES ('OWNER', 'Organization owner — full control of org, projects, and membership')
ON CONFLICT (role_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  details TEXT,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at DESC);

CREATE TABLE IF NOT EXISTS organization_members (
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'DESIGNER', 'REVIEWER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;

-- Default org + backfill projects
INSERT INTO organizations (name, description, details, created_by_user_id)
SELECT 'Default organization',
       'Auto-created when enabling multi-tenant organizations.',
       NULL,
       (SELECT id FROM users WHERE is_active = TRUE ORDER BY id LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);

UPDATE projects p
SET organization_id = (SELECT id FROM organizations ORDER BY id LIMIT 1)
WHERE p.organization_id IS NULL;

UPDATE clients c
SET organization_id = (SELECT id FROM organizations ORDER BY id LIMIT 1)
WHERE c.organization_id IS NULL;

-- One membership row per active user in the default org (maps global role → org role)
INSERT INTO organization_members (organization_id, user_id, role)
SELECT o.id, u.id,
       CASE LOWER(r.role_code)
         WHEN 'admin' THEN 'OWNER'::varchar
         WHEN 'manager' THEN 'MANAGER'::varchar
         WHEN 'designer' THEN 'DESIGNER'::varchar
         WHEN 'reviewer' THEN 'REVIEWER'::varchar
         ELSE 'DESIGNER'::varchar
       END
FROM users u
JOIN user_roles r ON r.id = u.role_id
CROSS JOIN (SELECT id FROM organizations ORDER BY id LIMIT 1) o
WHERE COALESCE(u.is_active, TRUE) = TRUE
ON CONFLICT (organization_id, user_id) DO NOTHING;

COMMIT;
