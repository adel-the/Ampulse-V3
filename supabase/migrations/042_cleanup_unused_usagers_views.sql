-- Cleanup unused views related to usagers
-- These views are not used in the application and can be safely removed

-- Drop the test summary view (only used during migration for display)
DROP VIEW IF EXISTS usager_test_summary;

-- Drop the prescripteur join view (application uses direct joins instead)
DROP VIEW IF EXISTS usagers_with_prescripteur;

-- Verify what remains
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  -- Count remaining usager-related objects
  SELECT COUNT(*) INTO remaining_count
  FROM information_schema.tables
  WHERE table_schema = 'public' 
  AND table_name LIKE '%usager%';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  USAGERS CLEANUP COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  ✅ Removed: usager_test_summary view';
  RAISE NOTICE '  ✅ Removed: usagers_with_prescripteur view';
  RAISE NOTICE '  ✅ Kept: usagers table (main table)';
  RAISE NOTICE '';
  RAISE NOTICE '  Remaining usager objects: %', remaining_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '  The application continues to work normally';
  RAISE NOTICE '  as it uses direct joins instead of views';
  RAISE NOTICE '========================================';
END $$;