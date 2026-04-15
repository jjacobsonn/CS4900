-- Add missing assets.current_version_id expected by backend queries.
-- Safe for existing databases and backfills from current_version/latest version.

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS current_version_id INTEGER REFERENCES asset_versions(id);

CREATE INDEX IF NOT EXISTS idx_assets_current_version_id ON assets(current_version_id);

WITH picked_versions AS (
  SELECT
    a.id AS asset_id,
    pick.id AS version_id
  FROM assets a
  LEFT JOIN LATERAL (
    SELECT v.id
    FROM asset_versions v
    WHERE v.asset_id = a.id
    ORDER BY
      CASE
        WHEN (
          CASE
            WHEN a.current_version ~ '^[vV]?[0-9]+' THEN
              CAST(SPLIT_PART(regexp_replace(a.current_version, '^[vV]', ''), '.', 1) AS INTEGER)
            ELSE NULL
          END
        ) = v.version_number THEN 0
        ELSE 1
      END,
      v.version_number DESC
    LIMIT 1
  ) pick ON true
  WHERE a.current_version_id IS NULL
)
UPDATE assets a
SET current_version_id = p.version_id
FROM picked_versions p
WHERE a.id = p.asset_id
  AND a.current_version_id IS NULL
  AND p.version_id IS NOT NULL;
