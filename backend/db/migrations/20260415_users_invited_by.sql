-- Track who invited a user so organization (project) owners can manage their teammates.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS invited_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_invited_by_user_id ON users(invited_by_user_id);
