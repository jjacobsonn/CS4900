-- Link comments to an asset version (required for NOT NULL asset_version_id).
-- Safe to run on databases that already have this column.

ALTER TABLE asset_comments ADD COLUMN IF NOT EXISTS asset_version_id INTEGER REFERENCES asset_versions(id);

UPDATE asset_comments c
SET asset_version_id = sub.vid
FROM (
  SELECT c2.id AS cid,
         COALESCE(a.current_version_id, v.id) AS vid
  FROM asset_comments c2
  JOIN assets a ON a.id = c2.asset_id
  LEFT JOIN LATERAL (
    SELECT id FROM asset_versions WHERE asset_id = c2.asset_id ORDER BY version_number DESC LIMIT 1
  ) v ON true
  WHERE c2.asset_version_id IS NULL
) sub
WHERE c.id = sub.cid AND c.asset_version_id IS NULL AND sub.vid IS NOT NULL;
