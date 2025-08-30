-- ============================================
-- FIX MAINTENANCE TASKS DATABASE ISSUES
-- ============================================
-- This script addresses potential 400 Bad Request issues
-- when creating maintenance tasks

-- ============================================
-- 1. VERIFY AND FIX TABLE STRUCTURE
-- ============================================

-- Check if table exists and has correct structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'maintenance_tasks') THEN
        RAISE EXCEPTION 'maintenance_tasks table does not exist. Run migration 053_create_maintenance_tasks.sql first';
    END IF;
END $$;

-- Verify all required columns exist
DO $$
BEGIN
    -- Check required columns
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'maintenance_tasks' AND column_name = 'titre') THEN
        ALTER TABLE public.maintenance_tasks ADD COLUMN titre TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'maintenance_tasks' AND column_name = 'room_id') THEN
        ALTER TABLE public.maintenance_tasks ADD COLUMN room_id INTEGER NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'maintenance_tasks' AND column_name = 'hotel_id') THEN
        ALTER TABLE public.maintenance_tasks ADD COLUMN hotel_id INTEGER NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'maintenance_tasks' AND column_name = 'user_owner_id') THEN
        ALTER TABLE public.maintenance_tasks ADD COLUMN user_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 2. FIX CONSTRAINTS AND VALIDATION
-- ============================================

-- Drop and recreate constraints to ensure they're correct
ALTER TABLE public.maintenance_tasks DROP CONSTRAINT IF EXISTS maintenance_tasks_priorite_check;
ALTER TABLE public.maintenance_tasks ADD CONSTRAINT maintenance_tasks_priorite_check 
    CHECK (priorite IN ('faible', 'moyenne', 'haute', 'urgente'));

ALTER TABLE public.maintenance_tasks DROP CONSTRAINT IF EXISTS maintenance_tasks_statut_check;
ALTER TABLE public.maintenance_tasks ADD CONSTRAINT maintenance_tasks_statut_check 
    CHECK (statut IN ('en_attente', 'en_cours', 'terminee', 'annulee'));

-- Ensure NOT NULL constraints on critical fields
ALTER TABLE public.maintenance_tasks ALTER COLUMN titre SET NOT NULL;
ALTER TABLE public.maintenance_tasks ALTER COLUMN room_id SET NOT NULL;
ALTER TABLE public.maintenance_tasks ALTER COLUMN hotel_id SET NOT NULL;
ALTER TABLE public.maintenance_tasks ALTER COLUMN user_owner_id SET NOT NULL;

-- ============================================
-- 3. FIX ROW LEVEL SECURITY POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "maintenance_tasks_tenant_isolation" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "maintenance_tasks_insert_policy" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "maintenance_tasks_select_policy" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "maintenance_tasks_update_policy" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "maintenance_tasks_delete_policy" ON public.maintenance_tasks;

-- Enable RLS
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "maintenance_tasks_select_policy" ON public.maintenance_tasks
    FOR SELECT 
    TO authenticated
    USING (user_owner_id = auth.uid());

CREATE POLICY "maintenance_tasks_insert_policy" ON public.maintenance_tasks
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        user_owner_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM public.rooms 
            WHERE id = room_id AND EXISTS (
                SELECT 1 FROM public.hotels 
                WHERE id = rooms.hotel_id AND user_owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "maintenance_tasks_update_policy" ON public.maintenance_tasks
    FOR UPDATE 
    TO authenticated
    USING (user_owner_id = auth.uid())
    WITH CHECK (user_owner_id = auth.uid());

CREATE POLICY "maintenance_tasks_delete_policy" ON public.maintenance_tasks
    FOR DELETE 
    TO authenticated
    USING (user_owner_id = auth.uid());

-- ============================================
-- 4. GRANT NECESSARY PERMISSIONS
-- ============================================

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_tasks TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.maintenance_tasks_id_seq TO authenticated;

-- Ensure users can read related tables for joins
GRANT SELECT ON public.rooms TO authenticated;
GRANT SELECT ON public.hotels TO authenticated;

-- ============================================
-- 5. FIX TRIGGER FUNCTIONS
-- ============================================

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Recreate triggers
DROP TRIGGER IF EXISTS update_maintenance_tasks_updated_at ON public.maintenance_tasks;
CREATE TRIGGER update_maintenance_tasks_updated_at 
    BEFORE UPDATE ON public.maintenance_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure completed_at function exists and works correctly
DROP TRIGGER IF EXISTS maintenance_tasks_set_completed_at ON public.maintenance_tasks;
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'terminee' AND (OLD.statut IS NULL OR OLD.statut != 'terminee') THEN
        NEW.completed_at = NOW();
    ELSIF NEW.statut != 'terminee' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER maintenance_tasks_set_completed_at
    BEFORE INSERT OR UPDATE ON public.maintenance_tasks
    FOR EACH ROW EXECUTE FUNCTION set_completed_at();

-- ============================================
-- 6. VERIFY FOREIGN KEY RELATIONSHIPS
-- ============================================

-- Check that all rooms and hotels exist with proper ownership
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    -- Check for tasks with invalid room references
    SELECT COUNT(*) INTO orphan_count
    FROM public.maintenance_tasks mt
    LEFT JOIN public.rooms r ON mt.room_id = r.id
    WHERE r.id IS NULL;
    
    IF orphan_count > 0 THEN
        RAISE WARNING 'Found % maintenance tasks with invalid room references', orphan_count;
        -- Optionally delete orphaned tasks
        -- DELETE FROM public.maintenance_tasks WHERE room_id NOT IN (SELECT id FROM public.rooms);
    END IF;
    
    -- Check for tasks with mismatched hotel ownership
    SELECT COUNT(*) INTO orphan_count
    FROM public.maintenance_tasks mt
    JOIN public.rooms r ON mt.room_id = r.id
    JOIN public.hotels h ON r.hotel_id = h.id
    WHERE mt.hotel_id != h.id OR mt.user_owner_id != h.user_owner_id;
    
    IF orphan_count > 0 THEN
        RAISE WARNING 'Found % maintenance tasks with mismatched hotel ownership', orphan_count;
    END IF;
END $$;

-- ============================================
-- 7. CREATE HELPFUL VIEWS (OPTIONAL)
-- ============================================

-- Drop and recreate a view for easier task management
DROP VIEW IF EXISTS maintenance_tasks_with_details;
CREATE VIEW maintenance_tasks_with_details AS
SELECT 
    mt.*,
    r.numero as room_numero,
    r.type as room_type,
    h.nom as hotel_nom,
    h.ville as hotel_ville
FROM public.maintenance_tasks mt
JOIN public.rooms r ON mt.room_id = r.id
JOIN public.hotels h ON mt.hotel_id = h.id;

-- Grant access to the view
GRANT SELECT ON maintenance_tasks_with_details TO authenticated;

-- ============================================
-- 8. CREATE DEBUG FUNCTION
-- ============================================

-- Function to help debug insertion issues
CREATE OR REPLACE FUNCTION debug_maintenance_task_insert(
    p_user_id UUID,
    p_hotel_id INTEGER,
    p_room_id INTEGER
) 
RETURNS TABLE (
    check_name TEXT,
    status BOOLEAN,
    message TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if user exists
    RETURN QUERY
    SELECT 
        'user_exists'::TEXT,
        EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id),
        CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) 
             THEN 'User exists' 
             ELSE 'User does not exist' 
        END::TEXT;
    
    -- Check if hotel exists and belongs to user
    RETURN QUERY
    SELECT 
        'hotel_ownership'::TEXT,
        EXISTS(SELECT 1 FROM public.hotels WHERE id = p_hotel_id AND user_owner_id = p_user_id),
        CASE WHEN EXISTS(SELECT 1 FROM public.hotels WHERE id = p_hotel_id AND user_owner_id = p_user_id)
             THEN 'Hotel exists and belongs to user'
             ELSE 'Hotel does not exist or does not belong to user'
        END::TEXT;
    
    -- Check if room exists and belongs to hotel
    RETURN QUERY
    SELECT 
        'room_hotel_match'::TEXT,
        EXISTS(SELECT 1 FROM public.rooms WHERE id = p_room_id AND hotel_id = p_hotel_id),
        CASE WHEN EXISTS(SELECT 1 FROM public.rooms WHERE id = p_room_id AND hotel_id = p_hotel_id)
             THEN 'Room exists and belongs to hotel'
             ELSE 'Room does not exist or does not belong to hotel'
        END::TEXT;
    
    -- Check table permissions
    RETURN QUERY
    SELECT 
        'table_permissions'::TEXT,
        has_table_privilege(p_user_id, 'public.maintenance_tasks', 'INSERT'),
        CASE WHEN has_table_privilege(p_user_id, 'public.maintenance_tasks', 'INSERT')
             THEN 'User has INSERT permissions'
             ELSE 'User lacks INSERT permissions'
        END::TEXT;
END;
$$;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$ 
BEGIN
    RAISE NOTICE '✅ Maintenance tasks database fixes completed successfully!';
    RAISE NOTICE 'Run the following query to debug specific insertion issues:';
    RAISE NOTICE 'SELECT * FROM debug_maintenance_task_insert(''your-user-id'', hotel_id, room_id);';
END $$;