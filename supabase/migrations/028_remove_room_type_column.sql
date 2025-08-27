-- Remove type column from rooms table
-- This column is replaced by category_id which references room_categories

-- Drop the type column
ALTER TABLE rooms DROP COLUMN IF EXISTS type;

-- Ensure all rooms have a valid category_id
-- Update rooms without category to use a default category
UPDATE rooms 
SET category_id = (
    SELECT id FROM room_categories WHERE name = 'Chambre simple' LIMIT 1
)
WHERE category_id IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN rooms.category_id IS 'Reference to room category defining room type and specifications';