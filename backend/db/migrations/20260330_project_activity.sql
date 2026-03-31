-- Append-only project timeline for GET /api/projects/:id/activity

BEGIN;

CREATE TABLE IF NOT EXISTS project_activity (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  details TEXT,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_activity_project_created
  ON project_activity (project_id, created_at DESC);

COMMIT;
