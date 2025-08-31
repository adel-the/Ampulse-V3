-- Temporarily disable RLS on individus table for development
-- This is similar to what was done for usagers table to avoid authentication issues
-- RLS will be re-enabled once authentication flow is properly configured

ALTER TABLE individus DISABLE ROW LEVEL SECURITY;

-- Note: RLS policies remain defined but inactive
-- They can be re-enabled with: ALTER TABLE individus ENABLE ROW LEVEL SECURITY;