-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can manage room categories" ON room_categories;
DROP POLICY IF EXISTS "Anonymous users can view room categories" ON room_categories;

-- Disable RLS temporarily to allow service role access
ALTER TABLE room_categories DISABLE ROW LEVEL SECURITY;

-- Grant proper permissions
GRANT ALL ON room_categories TO service_role;
GRANT ALL ON room_categories TO authenticated;
GRANT SELECT ON room_categories TO anon;

-- Re-enable RLS with proper policies
ALTER TABLE room_categories ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies for development
CREATE POLICY "Service role has full access to room categories"
  ON room_categories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage room categories"
  ON room_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can view room categories"
  ON room_categories
  FOR SELECT
  TO anon
  USING (true);

-- Ensure sequence permissions
GRANT USAGE, SELECT ON SEQUENCE room_categories_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE room_categories_id_seq TO anon;