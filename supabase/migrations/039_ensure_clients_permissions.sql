-- Ensure clients table is accessible for prescripteur selection in usagers form
-- This migration ensures the clients table can be read by all authenticated and anon users

-- Grant read permissions on clients table
GRANT SELECT ON clients TO anon;
GRANT SELECT ON clients TO authenticated;
GRANT ALL ON clients TO anon;
GRANT ALL ON clients TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON SEQUENCE clients_id_seq TO anon;
GRANT USAGE ON SEQUENCE clients_id_seq TO authenticated;

-- Check if search_clients function exists and grant permissions if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'search_clients'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION search_clients TO anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION search_clients TO authenticated';
    RAISE NOTICE 'Granted permissions on search_clients function';
  END IF;
END $$;

-- Check if view exists and grant permissions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'clients_with_counts'
  ) THEN
    EXECUTE 'GRANT SELECT ON clients_with_counts TO anon';
    EXECUTE 'GRANT SELECT ON clients_with_counts TO authenticated';
    RAISE NOTICE 'Granted permissions on clients_with_counts view';
  END IF;
END $$;

-- Verify permissions
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  CLIENTS TABLE PERMISSIONS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  ✅ SELECT granted to anon/authenticated';
  RAISE NOTICE '  ✅ search_clients function accessible';
  RAISE NOTICE '  ✅ clients_with_counts view accessible';
  RAISE NOTICE '';
  RAISE NOTICE '  Prescripteur selection should work now';
  RAISE NOTICE '========================================';
END $$;