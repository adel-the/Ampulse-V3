-- Drop all existing policies
DROP POLICY IF EXISTS "Service role has full access to room categories" ON room_categories;
DROP POLICY IF EXISTS "Authenticated users can manage room categories" ON room_categories;
DROP POLICY IF EXISTS "Anonymous users can view room categories" ON room_categories;

-- Disable RLS completely for room_categories
ALTER TABLE room_categories DISABLE ROW LEVEL SECURITY;

-- Ensure all roles have proper permissions
GRANT ALL ON room_categories TO anon;
GRANT ALL ON room_categories TO authenticated;
GRANT ALL ON room_categories TO service_role;
GRANT USAGE, SELECT ON SEQUENCE room_categories_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE room_categories_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE room_categories_id_seq TO service_role;