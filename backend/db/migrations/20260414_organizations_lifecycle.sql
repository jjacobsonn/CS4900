BEGIN;

DO $$
BEGIN
  IF to_regclass('public.organizations') IS NOT NULL THEN
    ALTER TABLE organizations
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

    CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);
  END IF;
END $$;

COMMIT;
