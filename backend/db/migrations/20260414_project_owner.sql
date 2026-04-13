-- Project Owner role and per-project ownership for scoped dashboards.

INSERT INTO user_roles (role_code, description)
SELECT 'PROJECT_OWNER', 'Project Owner — manages own projects, no global admin'
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE role_code = 'PROJECT_OWNER');

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_owner_user_id ON projects(owner_user_id);

UPDATE projects
SET owner_user_id = created_by_user_id
WHERE owner_user_id IS NULL AND created_by_user_id IS NOT NULL;
