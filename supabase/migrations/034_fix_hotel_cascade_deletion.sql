-- Simplified cascade deletion constraints for hotel-related tables
-- This migration ensures proper cascade deletion when hotels are deleted
-- Based on actual database structure analysis

-- 1. Fix reservations table to RESTRICT deletion if reservations exist
-- This prevents orphaned reservations and enforces business logic
ALTER TABLE reservations 
DROP CONSTRAINT IF EXISTS reservations_hotel_id_fkey;

ALTER TABLE reservations 
ADD CONSTRAINT reservations_hotel_id_fkey 
FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE RESTRICT;

-- 2. Ensure rooms table has proper CASCADE DELETE (should already exist)
-- This ensures all hotel rooms are deleted when hotel is deleted
ALTER TABLE rooms 
DROP CONSTRAINT IF EXISTS rooms_hotel_id_fkey;

ALTER TABLE rooms 
ADD CONSTRAINT rooms_hotel_id_fkey 
FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE;

-- 3. Create a function to safely delete hotels with validation
CREATE OR REPLACE FUNCTION safe_delete_hotel(p_hotel_id INTEGER)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  affected_rooms INTEGER,
  blocked_reservations INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_room_count INTEGER;
  v_reservation_count INTEGER;
  v_hotel_name TEXT;
BEGIN
  -- Get hotel name for messages
  SELECT nom INTO v_hotel_name FROM hotels WHERE id = p_hotel_id;
  
  IF v_hotel_name IS NULL THEN
    RETURN QUERY SELECT false, 'Hôtel non trouvé'::TEXT, 0, 0;
    RETURN;
  END IF;
  
  -- Count related records
  SELECT COUNT(*) INTO v_room_count FROM rooms WHERE hotel_id = p_hotel_id;
  SELECT COUNT(*) INTO v_reservation_count FROM reservations WHERE hotel_id = p_hotel_id AND statut NOT IN ('cancelled');
  
  -- Check for active reservations (blocking condition)
  IF v_reservation_count > 0 THEN
    RETURN QUERY SELECT 
      false, 
      format('Impossible de supprimer l''hôtel "%s" : %s réservation(s) active(s) trouvée(s). Veuillez d''abord annuler ou terminer ces réservations.', v_hotel_name, v_reservation_count)::TEXT,
      v_room_count,
      v_reservation_count;
    RETURN;
  END IF;
  
  -- Proceed with deletion (cascade will handle rooms)
  DELETE FROM hotels WHERE id = p_hotel_id;
  
  RETURN QUERY SELECT 
    true,
    format('Hôtel "%s" supprimé avec succès. %s chambre(s) supprimée(s) automatiquement.', v_hotel_name, v_room_count)::TEXT,
    v_room_count,
    0; -- No blocked reservations
END;
$$;

-- 4. Create a function to check what would be deleted before deletion
CREATE OR REPLACE FUNCTION preview_hotel_deletion(p_hotel_id INTEGER)
RETURNS TABLE (
  hotel_name TEXT,
  rooms_count INTEGER,
  active_reservations_count INTEGER,
  can_delete BOOLEAN,
  deletion_preview TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_hotel_name TEXT;
  v_room_count INTEGER;
  v_reservation_count INTEGER;
BEGIN
  -- Get hotel details
  SELECT nom INTO v_hotel_name FROM hotels WHERE id = p_hotel_id;
  
  IF v_hotel_name IS NULL THEN
    RETURN QUERY SELECT NULL, 0, 0, false, 'Hôtel non trouvé'::TEXT;
    RETURN;
  END IF;
  
  -- Count related records
  SELECT COUNT(*) INTO v_room_count FROM rooms WHERE hotel_id = p_hotel_id;
  SELECT COUNT(*) INTO v_reservation_count FROM reservations WHERE hotel_id = p_hotel_id AND statut NOT IN ('cancelled');
  
  -- Generate preview message
  RETURN QUERY SELECT 
    v_hotel_name,
    v_room_count,
    v_reservation_count,
    v_reservation_count = 0, -- Can delete if no active reservations
    CASE 
      WHEN v_reservation_count > 0 THEN 
        format('❌ Suppression impossible : %s réservation(s) active(s). %s chambre(s) seraient supprimées.', v_reservation_count, v_room_count)
      ELSE 
        format('✅ Suppression possible : %s chambre(s) seront supprimées automatiquement.', v_room_count)
    END;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION safe_delete_hotel TO authenticated;
GRANT EXECUTE ON FUNCTION safe_delete_hotel TO service_role;
GRANT EXECUTE ON FUNCTION preview_hotel_deletion TO authenticated;
GRANT EXECUTE ON FUNCTION preview_hotel_deletion TO service_role;

-- Add comments for documentation
COMMENT ON CONSTRAINT reservations_hotel_id_fkey ON reservations IS 
  'Prevents hotel deletion if active reservations exist (RESTRICT) - maintains referential integrity';
  
COMMENT ON CONSTRAINT rooms_hotel_id_fkey ON rooms IS 
  'Automatically deletes all hotel rooms when hotel is deleted (CASCADE)';

COMMENT ON FUNCTION safe_delete_hotel IS 
  'Safely deletes a hotel with validation and cascade deletion of rooms. Prevents deletion if active reservations exist.';

COMMENT ON FUNCTION preview_hotel_deletion IS 
  'Previews what would be deleted when removing a hotel, helps users understand the impact before deletion.';