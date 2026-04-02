BEGIN;

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS current_version_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_assets_current_version'
  ) THEN
    ALTER TABLE assets
      ADD CONSTRAINT fk_assets_current_version
      FOREIGN KEY (current_version_id) REFERENCES asset_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_assets_current_version_id ON assets(current_version_id);

UPDATE assets a
SET current_version_id = v.id
FROM asset_versions v
WHERE v.asset_id = a.id
  AND v.version_number = CAST(SPLIT_PART(REPLACE(a.current_version, 'v', ''), '.', 1) AS INTEGER)
  AND (a.current_version_id IS NULL OR a.current_version_id <> v.id);

COMMIT;
