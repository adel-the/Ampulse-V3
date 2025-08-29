-- Migration: Prevent double-booking of rooms
-- This migration adds database-level constraints to prevent overlapping reservations for the same room

-- Step 1: Enable required extension for date range exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Step 2: Create a function to check if a reservation would cause a conflict
CREATE OR REPLACE FUNCTION validate_reservation_no_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there are any conflicting reservations
  IF EXISTS (
    SELECT 1 
    FROM reservations 
    WHERE chambre_id = NEW.chambre_id
      AND id != COALESCE(NEW.id, -1)  -- Exclude current reservation when updating
      AND statut NOT IN ('cancelled', 'completed')  -- Ignore cancelled and completed reservations
      AND (
        -- Check for any date overlap
        (NEW.date_arrivee < date_depart AND NEW.date_depart > date_arrivee)
      )
  ) THEN
    RAISE EXCEPTION 'La chambre % n''est pas disponible du % au %. Une réservation existe déjà pour ces dates.', 
      NEW.chambre_id, NEW.date_arrivee, NEW.date_depart
      USING HINT = 'Vérifiez les réservations existantes pour cette chambre.',
      ERRCODE = 'check_violation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create trigger to validate reservations before insert or update
DROP TRIGGER IF EXISTS check_reservation_no_overlap ON reservations;
CREATE TRIGGER check_reservation_no_overlap
  BEFORE INSERT OR UPDATE OF chambre_id, date_arrivee, date_depart, statut
  ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION validate_reservation_no_overlap();

-- Step 4: Update the check_room_availability function to be more accurate
CREATE OR REPLACE FUNCTION check_room_availability(
  p_room_id INTEGER,
  p_check_in DATE,
  p_check_out DATE,
  p_exclude_reservation_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_available BOOLEAN;
BEGIN
  -- Check if room exists and is not in maintenance
  IF EXISTS (
    SELECT 1 FROM rooms 
    WHERE id = p_room_id 
    AND statut = 'maintenance'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Check for conflicting reservations
  SELECT NOT EXISTS (
    SELECT 1 
    FROM reservations 
    WHERE chambre_id = p_room_id
      AND id != COALESCE(p_exclude_reservation_id, -1)
      AND statut NOT IN ('cancelled', 'completed')
      AND (
        -- Any overlap between the dates
        (p_check_in < date_depart AND p_check_out > date_arrivee)
      )
  ) INTO v_is_available;
  
  RETURN v_is_available;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Fix the get_available_rooms_with_details function to properly check reservations
DROP FUNCTION IF EXISTS get_available_rooms_with_details;

CREATE OR REPLACE FUNCTION get_available_rooms_with_details(
  p_date_debut TEXT DEFAULT NULL,
  p_date_fin TEXT DEFAULT NULL,
  p_hotel_id INTEGER DEFAULT NULL,
  p_room_type TEXT DEFAULT NULL,
  p_capacity INTEGER DEFAULT NULL,
  p_characteristic TEXT DEFAULT NULL,
  p_room_number TEXT DEFAULT NULL,
  p_rental_mode TEXT DEFAULT 'night'
)
RETURNS TABLE (
  id INTEGER,
  numero TEXT,
  hotel_id INTEGER,
  hotel_nom TEXT,
  category_id INTEGER,
  category_name TEXT,
  capacity INTEGER,
  surface DECIMAL,
  prix DECIMAL,
  statut TEXT,
  floor INTEGER,
  room_size DECIMAL,
  bed_type TEXT,
  description TEXT,
  equipment_ids INTEGER[],
  is_available BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_date_debut DATE;
  v_date_fin DATE;
BEGIN
  -- Convert text dates to DATE type, handle nulls
  v_date_debut := CASE 
    WHEN p_date_debut IS NULL OR p_date_debut = '' THEN NULL 
    ELSE p_date_debut::DATE 
  END;
  
  v_date_fin := CASE 
    WHEN p_date_fin IS NULL OR p_date_fin = '' THEN NULL 
    ELSE p_date_fin::DATE 
  END;

  RETURN QUERY
  SELECT DISTINCT
    r.id::INTEGER,
    r.numero::TEXT,
    r.hotel_id::INTEGER,
    h.nom::TEXT AS hotel_nom,
    r.category_id::INTEGER,
    COALESCE(rc.name, 'Standard')::TEXT AS category_name,
    COALESCE(rc.capacity, 2)::INTEGER AS capacity,
    rc.surface::DECIMAL,
    r.prix::DECIMAL,
    r.statut::TEXT,
    r.floor::INTEGER,
    r.room_size::DECIMAL,
    r.bed_type::TEXT,
    r.description::TEXT,
    r.equipment_ids,
    -- Check availability properly
    CASE 
      WHEN r.statut = 'maintenance' THEN FALSE
      WHEN v_date_debut IS NOT NULL AND v_date_fin IS NOT NULL THEN
        NOT EXISTS (
          SELECT 1 FROM reservations res
          WHERE res.chambre_id = r.id
            AND res.statut IN ('confirmed', 'pending')  -- Active statuses
            AND (
              -- Check for any date overlap
              (res.date_arrivee < v_date_fin AND res.date_depart > v_date_debut)
            )
        )
      ELSE r.statut = 'disponible'
    END AS is_available
  FROM 
    rooms r
    LEFT JOIN hotels h ON r.hotel_id = h.id
    LEFT JOIN room_categories rc ON r.category_id = rc.id
  WHERE 
    -- Filter by hotel
    (p_hotel_id IS NULL OR p_hotel_id = 0 OR r.hotel_id = p_hotel_id)
    -- Filter by room number
    AND (p_room_number IS NULL OR p_room_number = '' OR r.numero ILIKE '%' || p_room_number || '%')
    -- Filter by capacity
    AND (p_capacity IS NULL OR p_capacity = 0 OR COALESCE(rc.capacity, 2) >= p_capacity)
    -- Filter by room type/category
    AND (p_room_type IS NULL OR p_room_type = '' OR p_room_type = 'all' OR rc.name = p_room_type)
    -- Filter by characteristic
    AND (
      p_characteristic IS NULL 
      OR p_characteristic = ''
      OR p_characteristic = 'all'
      OR r.bed_type = p_characteristic
    )
  ORDER BY r.numero;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_available_rooms_with_details TO anon;
GRANT EXECUTE ON FUNCTION get_available_rooms_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_rooms_with_details TO service_role;

GRANT EXECUTE ON FUNCTION check_room_availability TO anon;
GRANT EXECUTE ON FUNCTION check_room_availability TO authenticated;
GRANT EXECUTE ON FUNCTION check_room_availability TO service_role;

-- Step 6: Add indexes to improve performance of overlap queries
CREATE INDEX IF NOT EXISTS idx_reservations_date_overlap 
ON reservations (chambre_id, date_arrivee, date_depart) 
WHERE statut NOT IN ('cancelled', 'completed');

-- Step 7: Add comment for documentation
COMMENT ON FUNCTION validate_reservation_no_overlap IS 'Prevents double-booking by checking for overlapping reservations on the same room';
COMMENT ON TRIGGER check_reservation_no_overlap ON reservations IS 'Validates that new/updated reservations do not overlap with existing ones';
COMMENT ON FUNCTION check_room_availability IS 'Checks if a room is available for a given date range, excluding cancelled reservations';
COMMENT ON FUNCTION get_available_rooms_with_details IS 'Returns rooms with availability status based on actual reservations, not just room status';