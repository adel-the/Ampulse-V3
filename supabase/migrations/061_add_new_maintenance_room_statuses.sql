-- ============================================
-- Migration 061: Add New Maintenance Room Statuses
-- ============================================
-- This migration adds two new room statuses for enhanced maintenance management:
-- - "En maintenance disponible": Room under maintenance but still available for booking
-- - "En maintenance hors d'usage": Room under maintenance and completely out of service

-- Update the CHECK constraint on rooms table to include new statuses
ALTER TABLE public.rooms 
DROP CONSTRAINT IF EXISTS rooms_statut_check;

ALTER TABLE public.rooms 
ADD CONSTRAINT rooms_statut_check 
CHECK (statut IN (
    'disponible', 
    'occupee', 
    'maintenance',
    'en_maintenance_disponible',
    'en_maintenance_hors_usage'
));

-- Add comment to document the new statuses
COMMENT ON COLUMN public.rooms.statut IS 'Room status: disponible, occupee, maintenance, en_maintenance_disponible (maintenance but bookable), en_maintenance_hors_usage (maintenance and out of service)';

-- Create an index for the new statuses for performance
CREATE INDEX IF NOT EXISTS idx_rooms_maintenance_statuses 
ON public.rooms(statut) 
WHERE statut IN ('en_maintenance_disponible', 'en_maintenance_hors_usage');

-- Update any existing views or functions that might reference room statuses
-- (This is a placeholder - adjust if there are specific views/functions to update)

-- Optional: Add a function to get room statistics including new statuses
CREATE OR REPLACE FUNCTION get_room_status_statistics(hotel_id_param INTEGER)
RETURNS TABLE(
    status_name TEXT,
    count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.statut as status_name,
        COUNT(*) as count
    FROM public.rooms r
    WHERE r.hotel_id = hotel_id_param
    GROUP BY r.statut
    ORDER BY r.statut;
END;
$$;

COMMENT ON FUNCTION get_room_status_statistics(INTEGER) IS 'Returns room status counts for a given hotel, including new maintenance statuses';