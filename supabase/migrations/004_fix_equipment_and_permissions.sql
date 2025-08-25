-- ============================================
-- Fix equipment column references and permissions
-- ============================================

-- 1. Ensure ordre_affichage exists (it should already exist, but let's be safe)
ALTER TABLE public.equipments 
ADD COLUMN IF NOT EXISTS ordre_affichage INTEGER DEFAULT 0;

-- 2. Create a function to get a test user ID
CREATE OR REPLACE FUNCTION public.get_test_user_id()
RETURNS UUID AS $$
BEGIN
    -- Return a static UUID for testing purposes
    RETURN '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Make user_owner_id nullable temporarily for testing
ALTER TABLE public.hotels 
ALTER COLUMN user_owner_id DROP NOT NULL;

-- 4. Set a default value for user_owner_id
ALTER TABLE public.hotels 
ALTER COLUMN user_owner_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::UUID;

-- 5. Update any NULL user_owner_id values
UPDATE public.hotels 
SET user_owner_id = '00000000-0000-0000-0000-000000000000'::UUID
WHERE user_owner_id IS NULL;

-- 6. Create more lenient RLS policies for development
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own hotels" ON public.hotels;
DROP POLICY IF EXISTS "Users can create their own hotels" ON public.hotels;
DROP POLICY IF EXISTS "Users can update their own hotels" ON public.hotels;
DROP POLICY IF EXISTS "Users can delete their own hotels" ON public.hotels;

-- Create new policies that allow all access (for testing)
CREATE POLICY "Allow read access to hotels" 
ON public.hotels FOR SELECT 
USING (true);

CREATE POLICY "Allow insert access to hotels" 
ON public.hotels FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update access to hotels" 
ON public.hotels FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete access to hotels" 
ON public.hotels FOR DELETE 
USING (true);

-- 7. Similarly update policies for rooms
DROP POLICY IF EXISTS "Users can view rooms of their hotels" ON public.rooms;
DROP POLICY IF EXISTS "Users can manage rooms of their hotels" ON public.rooms;

CREATE POLICY "Allow all operations on rooms" 
ON public.rooms FOR ALL 
USING (true)
WITH CHECK (true);

-- 8. Update policies for equipments
DROP POLICY IF EXISTS "Everyone can view active equipments" ON public.equipments;
DROP POLICY IF EXISTS "Users can manage equipments" ON public.equipments;

CREATE POLICY "Allow all operations on equipments" 
ON public.equipments FOR ALL 
USING (true)
WITH CHECK (true);

-- 9. Update policies for hotel_equipments
DROP POLICY IF EXISTS "Users can view hotel equipments" ON public.hotel_equipments;
DROP POLICY IF EXISTS "Users can manage their hotel equipments" ON public.hotel_equipments;

CREATE POLICY "Allow all operations on hotel_equipments" 
ON public.hotel_equipments FOR ALL 
USING (true)
WITH CHECK (true);

-- 10. Update policies for room_equipments
DROP POLICY IF EXISTS "Users can view room equipments" ON public.room_equipments;
DROP POLICY IF EXISTS "Users can manage room equipments" ON public.room_equipments;

CREATE POLICY "Allow all operations on room_equipments" 
ON public.room_equipments FOR ALL 
USING (true)
WITH CHECK (true);

-- 11. Grant permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;