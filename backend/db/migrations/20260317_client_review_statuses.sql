-- Sprint 2: client review statuses for Model B workflow

BEGIN;

INSERT INTO asset_status_lookup (status_name)
SELECT 'Ready for Client Review'
WHERE NOT EXISTS (
  SELECT 1 FROM asset_status_lookup WHERE status_name = 'Ready for Client Review'
);

INSERT INTO asset_status_lookup (status_name)
SELECT 'In Client Review'
WHERE NOT EXISTS (
  SELECT 1 FROM asset_status_lookup WHERE status_name = 'In Client Review'
);

INSERT INTO asset_status_lookup (status_name)
SELECT 'Client Changes Requested'
WHERE NOT EXISTS (
  SELECT 1 FROM asset_status_lookup WHERE status_name = 'Client Changes Requested'
);

INSERT INTO asset_status_lookup (status_name)
SELECT 'Approved (Client)'
WHERE NOT EXISTS (
  SELECT 1 FROM asset_status_lookup WHERE status_name = 'Approved (Client)'
);

COMMIT;

