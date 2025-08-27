-- Fix type mismatches in the room availability function
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
  view_type TEXT,
  is_smoking BOOLEAN,
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
    r.view_type::TEXT,
    r.is_smoking,
    r.description::TEXT,
    r.equipment_ids,
    -- Check availability
    CASE 
      WHEN r.statut = 'maintenance' THEN FALSE
      WHEN v_date_debut IS NOT NULL AND v_date_fin IS NOT NULL THEN
        NOT EXISTS (
          SELECT 1 FROM reservations res
          WHERE res.chambre_id = r.id
            AND res.statut NOT IN ('cancelled')
            AND (
              (res.date_arrivee <= v_date_debut AND res.date_depart > v_date_debut)
              OR (res.date_arrivee < v_date_fin AND res.date_depart >= v_date_fin)
              OR (res.date_arrivee >= v_date_debut AND res.date_depart <= v_date_fin)
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
    -- Filter by characteristic (can be bed_type, view_type, or equipment)
    AND (
      p_characteristic IS NULL 
      OR p_characteristic = ''
      OR p_characteristic = 'all'
      OR r.bed_type = p_characteristic
      OR r.view_type = p_characteristic
    )
  ORDER BY r.numero;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_available_rooms_with_details TO anon;
GRANT EXECUTE ON FUNCTION get_available_rooms_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_rooms_with_details TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION get_available_rooms_with_details IS 'Get available rooms with full details - fixed type mismatches';