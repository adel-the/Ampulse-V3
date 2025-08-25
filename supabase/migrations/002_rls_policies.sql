-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS and create policies for multi-tenant data isolation

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_equipments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. HOTELS POLICIES
-- ============================================
-- Users can only see and manage their own hotels

CREATE POLICY "Users can view their own hotels" 
ON public.hotels
FOR SELECT 
USING (user_owner_id = auth.uid());

CREATE POLICY "Users can insert their own hotels" 
ON public.hotels
FOR INSERT 
WITH CHECK (user_owner_id = auth.uid());

CREATE POLICY "Users can update their own hotels" 
ON public.hotels
FOR UPDATE 
USING (user_owner_id = auth.uid())
WITH CHECK (user_owner_id = auth.uid());

CREATE POLICY "Users can delete their own hotels" 
ON public.hotels
FOR DELETE 
USING (user_owner_id = auth.uid());

-- ============================================
-- 3. ROOMS POLICIES
-- ============================================
-- Users can manage rooms in their hotels

CREATE POLICY "Users can view rooms in their hotels" 
ON public.rooms
FOR SELECT 
USING (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
);

CREATE POLICY "Users can insert rooms in their hotels" 
ON public.rooms
FOR INSERT 
WITH CHECK (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
);

CREATE POLICY "Users can update rooms in their hotels" 
ON public.rooms
FOR UPDATE 
USING (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
)
WITH CHECK (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
);

CREATE POLICY "Users can delete rooms in their hotels" 
ON public.rooms
FOR DELETE 
USING (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
);

-- ============================================
-- 4. ROOM CATEGORIES POLICIES
-- ============================================
-- Users can manage categories in their hotels

CREATE POLICY "Users can view categories in their hotels" 
ON public.room_categories
FOR SELECT 
USING (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
);

CREATE POLICY "Users can insert categories in their hotels" 
ON public.room_categories
FOR INSERT 
WITH CHECK (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
);

CREATE POLICY "Users can update categories in their hotels" 
ON public.room_categories
FOR UPDATE 
USING (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
)
WITH CHECK (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
);

CREATE POLICY "Users can delete categories in their hotels" 
ON public.room_categories
FOR DELETE 
USING (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
);

-- ============================================
-- 5. EQUIPMENT MASTER TABLE POLICIES
-- ============================================
-- Equipment catalog is readable by all authenticated users
-- Only admins can modify the master equipment list

CREATE POLICY "All authenticated users can view equipment" 
ON public.equipments
FOR SELECT 
TO authenticated 
USING (true);

-- Admin-only policies for equipment management
-- (You can adjust this based on your requirements)
CREATE POLICY "Only admins can insert equipment" 
ON public.equipments
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_app_meta_data->>'role' = 'admin'
    )
);

CREATE POLICY "Only admins can update equipment" 
ON public.equipments
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_app_meta_data->>'role' = 'admin'
    )
);

CREATE POLICY "Only admins can delete equipment" 
ON public.equipments
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_app_meta_data->>'role' = 'admin'
    )
);

-- ============================================
-- 6. HOTEL EQUIPMENT POLICIES
-- ============================================
-- Users can manage equipment associations for their hotels

CREATE POLICY "Users can view equipment in their hotels" 
ON public.hotel_equipments
FOR SELECT 
USING (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
);

CREATE POLICY "Users can add equipment to their hotels" 
ON public.hotel_equipments
FOR INSERT 
WITH CHECK (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
);

CREATE POLICY "Users can update equipment in their hotels" 
ON public.hotel_equipments
FOR UPDATE 
USING (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
)
WITH CHECK (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
);

CREATE POLICY "Users can remove equipment from their hotels" 
ON public.hotel_equipments
FOR DELETE 
USING (
    hotel_id IN (
        SELECT id FROM public.hotels WHERE user_owner_id = auth.uid()
    )
);

-- ============================================
-- 7. ROOM EQUIPMENT POLICIES
-- ============================================
-- Users can manage equipment in rooms of their hotels

CREATE POLICY "Users can view room equipment in their hotels" 
ON public.room_equipments
FOR SELECT 
USING (
    room_id IN (
        SELECT r.id FROM public.rooms r
        JOIN public.hotels h ON r.hotel_id = h.id
        WHERE h.user_owner_id = auth.uid()
    )
);

CREATE POLICY "Users can add equipment to rooms in their hotels" 
ON public.room_equipments
FOR INSERT 
WITH CHECK (
    room_id IN (
        SELECT r.id FROM public.rooms r
        JOIN public.hotels h ON r.hotel_id = h.id
        WHERE h.user_owner_id = auth.uid()
    )
);

CREATE POLICY "Users can update room equipment in their hotels" 
ON public.room_equipments
FOR UPDATE 
USING (
    room_id IN (
        SELECT r.id FROM public.rooms r
        JOIN public.hotels h ON r.hotel_id = h.id
        WHERE h.user_owner_id = auth.uid()
    )
)
WITH CHECK (
    room_id IN (
        SELECT r.id FROM public.rooms r
        JOIN public.hotels h ON r.hotel_id = h.id
        WHERE h.user_owner_id = auth.uid()
    )
);

CREATE POLICY "Users can remove equipment from rooms in their hotels" 
ON public.room_equipments
FOR DELETE 
USING (
    room_id IN (
        SELECT r.id FROM public.rooms r
        JOIN public.hotels h ON r.hotel_id = h.id
        WHERE h.user_owner_id = auth.uid()
    )
);

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
-- Grant necessary permissions to authenticated users

GRANT ALL ON public.hotels TO authenticated;
GRANT ALL ON public.rooms TO authenticated;
GRANT ALL ON public.room_categories TO authenticated;
GRANT SELECT ON public.equipments TO authenticated;
GRANT ALL ON public.hotel_equipments TO authenticated;
GRANT ALL ON public.room_equipments TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- 9. FUNCTION FOR SIMPLIFIED EQUIPMENT POLICY
-- ============================================
-- Alternative: Create a simpler policy for equipment if all users can manage equipment

-- Drop admin-only policies if you want all users to manage equipment
-- DROP POLICY IF EXISTS "Only admins can insert equipment" ON public.equipments;
-- DROP POLICY IF EXISTS "Only admins can update equipment" ON public.equipments;
-- DROP POLICY IF EXISTS "Only admins can delete equipment" ON public.equipments;

-- Alternative policies for all authenticated users
-- CREATE POLICY "Authenticated users can insert equipment" 
-- ON public.equipments
-- FOR INSERT 
-- TO authenticated
-- WITH CHECK (true);

-- CREATE POLICY "Authenticated users can update equipment" 
-- ON public.equipments
-- FOR UPDATE 
-- TO authenticated
-- USING (true);

-- CREATE POLICY "Authenticated users can delete equipment" 
-- ON public.equipments
-- FOR DELETE 
-- TO authenticated
-- USING (true);