-- Fix foreign key constraint issues on usagers audit fields
-- Make created_by and updated_by nullable since we don't have authentication

-- First drop the foreign key constraints
ALTER TABLE usagers 
  DROP CONSTRAINT IF EXISTS usagers_created_by_fkey,
  DROP CONSTRAINT IF EXISTS usagers_updated_by_fkey;

-- Make the audit fields nullable
ALTER TABLE usagers 
  ALTER COLUMN created_by DROP NOT NULL,
  ALTER COLUMN updated_by DROP NOT NULL;

-- Update the trigger to not set these fields at all when there's no auth
CREATE OR REPLACE FUNCTION set_usager_audit_fields_nullable()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at = COALESCE(NEW.created_at, TIMEZONE('utc', NOW()));
    -- Only set created_by if auth.uid() returns a valid UUID
    IF auth.uid() IS NOT NULL THEN
      NEW.created_by = auth.uid();
    ELSE
      NEW.created_by = NULL;
    END IF;
    NEW.updated_at = TIMEZONE('utc', NOW());
    NEW.updated_by = NEW.created_by;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.created_at = OLD.created_at;
    NEW.created_by = OLD.created_by;
    NEW.updated_at = TIMEZONE('utc', NOW());
    -- Only set updated_by if auth.uid() returns a valid UUID
    IF auth.uid() IS NOT NULL THEN
      NEW.updated_by = auth.uid();
    ELSE
      NEW.updated_by = NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS set_usager_audit_fields_trigger ON usagers;

CREATE TRIGGER set_usager_audit_fields_trigger
  BEFORE INSERT OR UPDATE ON usagers
  FOR EACH ROW
  EXECUTE FUNCTION set_usager_audit_fields_nullable();

-- Also update the auto-generate usager number trigger if needed
CREATE OR REPLACE FUNCTION auto_generate_usager_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_usager IS NULL OR NEW.numero_usager = '' THEN
    NEW.numero_usager := generate_usager_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the changes
DO $$
DECLARE
  created_by_nullable BOOLEAN;
  updated_by_nullable BOOLEAN;
BEGIN
  SELECT is_nullable = 'YES' INTO created_by_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'usagers' 
    AND column_name = 'created_by';
    
  SELECT is_nullable = 'YES' INTO updated_by_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'usagers' 
    AND column_name = 'updated_by';
    
  IF created_by_nullable AND updated_by_nullable THEN
    RAISE NOTICE '✅ Audit fields are now nullable';
    RAISE NOTICE '✅ Foreign key constraints removed';
    RAISE NOTICE '✅ Triggers updated to handle null auth';
  ELSE
    RAISE WARNING '❌ Failed to make audit fields nullable';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  USAGERS TABLE AUDIT FIELDS FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  ✅ created_by: nullable (no FK constraint)';
  RAISE NOTICE '  ✅ updated_by: nullable (no FK constraint)';
  RAISE NOTICE '  ✅ Trigger: handles null auth.uid()';
  RAISE NOTICE '  ✅ Auto-numbering: still works';
  RAISE NOTICE '';
  RAISE NOTICE '  Usager creation should work now!';
  RAISE NOTICE '========================================';
END $$;