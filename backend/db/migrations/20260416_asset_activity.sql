CREATE TABLE IF NOT EXISTS asset_activity (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  from_status VARCHAR(100),
  to_status VARCHAR(100),
  asset_version_id INTEGER REFERENCES asset_versions(id) ON DELETE SET NULL,
  actor_user_id INTEGER REFERENCES users(id),
  detail TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_activity_asset_created
  ON asset_activity (asset_id, created_at DESC);
