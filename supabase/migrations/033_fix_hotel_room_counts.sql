-- Fix the chambres_total values in hotels table to match actual room counts
-- Update each hotel's chambres_total to reflect the actual number of rooms

-- Update chambres_total based on actual room count
UPDATE hotels h
SET chambres_total = (
  SELECT COUNT(*)
  FROM rooms r
  WHERE r.hotel_id = h.id
),
chambres_occupees = (
  SELECT COUNT(*)
  FROM rooms r
  WHERE r.hotel_id = h.id
  AND r.statut = 'occupee'
);

-- Recalculate taux_occupation
UPDATE hotels
SET taux_occupation = CASE 
  WHEN chambres_total > 0 THEN 
    ROUND((chambres_occupees::DECIMAL / chambres_total) * 100)
  ELSE 0
END;

-- Add comment for documentation
COMMENT ON COLUMN hotels.chambres_total IS 'Total number of rooms in the hotel (automatically updated based on rooms table)';
COMMENT ON COLUMN hotels.chambres_occupees IS 'Number of occupied rooms (automatically updated based on rooms table)';
COMMENT ON COLUMN hotels.taux_occupation IS 'Occupancy rate percentage (automatically calculated)';