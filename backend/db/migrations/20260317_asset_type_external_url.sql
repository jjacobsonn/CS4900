-- Sprint 2: asset_type and external_url support

BEGIN;

-- 1) Add asset_type and external_url to assets (high-level classification + link)
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS asset_type TEXT,
  ADD COLUMN IF NOT EXISTS external_url TEXT;

COMMIT;

