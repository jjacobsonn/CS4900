-- Sprint 3: remove Draft from the active asset workflow.
-- Existing Draft assets should enter the review queue instead of keeping a dead status.
UPDATE assets
SET status_id = (SELECT id FROM asset_status_lookup WHERE status_name = 'Ready for Internal Review')
WHERE status_id = (SELECT id FROM asset_status_lookup WHERE status_name = 'Draft')
  AND EXISTS (
    SELECT 1 FROM asset_status_lookup WHERE status_name = 'Ready for Internal Review'
  );
