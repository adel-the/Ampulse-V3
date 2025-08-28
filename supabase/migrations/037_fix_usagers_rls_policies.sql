-- Fix RLS policies for usagers table to allow proper INSERT operations
-- This migration updates the RLS policies to be more permissive for authenticated users

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create usagers" ON usagers;

-- Create new INSERT policy that's more permissive
CREATE POLICY "Authenticated users can create usagers"
  ON usagers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also update the trigger to handle created_by automatically
CREATE OR REPLACE FUNCTION set_usager_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at = COALESCE(NEW.created_at, TIMEZONE('utc', NOW()));
    NEW.created_by = auth.uid();
    NEW.updated_at = TIMEZONE('utc', NOW());
    NEW.updated_by = auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.created_at = OLD.created_at;
    NEW.created_by = OLD.created_by;
    NEW.updated_at = TIMEZONE('utc', NOW());
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_usager_audit_fields_trigger ON usagers;

-- Create trigger for audit fields
CREATE TRIGGER set_usager_audit_fields_trigger
  BEFORE INSERT OR UPDATE ON usagers
  FOR EACH ROW
  EXECUTE FUNCTION set_usager_audit_fields();

-- Ensure all authenticated users can perform CRUD operations
DROP POLICY IF EXISTS "Authenticated users can read usagers" ON usagers;
DROP POLICY IF EXISTS "Users can update usagers" ON usagers;
DROP POLICY IF EXISTS "Authenticated users can update usagers" ON usagers;
DROP POLICY IF EXISTS "Authenticated users can delete usagers" ON usagers;

-- Create simplified RLS policies
CREATE POLICY "Enable read access for authenticated users"
  ON usagers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON usagers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON usagers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON usagers FOR DELETE
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT ALL ON usagers TO authenticated;
GRANT USAGE ON SEQUENCE usagers_id_seq TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE usagers IS 'Fixed RLS policies in migration 037_fix_usagers_rls_policies.sql to allow proper CRUD operations for authenticated users';

-- Verify the policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'usagers';
  
  RAISE NOTICE 'Number of RLS policies on usagers table: %', policy_count;
  
  IF policy_count = 4 THEN
    RAISE NOTICE '✅ RLS policies successfully updated for usagers table';
  ELSE
    RAISE WARNING '⚠️ Unexpected number of policies. Expected 4, found %', policy_count;
  END IF;
END $$;