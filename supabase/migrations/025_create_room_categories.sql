-- Create room_categories table
CREATE TABLE IF NOT EXISTS room_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 20),
  surface DECIMAL(10, 2) CHECK (surface > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add category_id to rooms table
ALTER TABLE rooms
ADD COLUMN category_id INTEGER REFERENCES room_categories(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_rooms_category_id ON rooms(category_id);
CREATE INDEX idx_room_categories_name ON room_categories(name);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_room_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER room_categories_updated_at_trigger
BEFORE UPDATE ON room_categories
FOR EACH ROW
EXECUTE FUNCTION update_room_categories_updated_at();

-- Insert default room categories based on French standards
INSERT INTO room_categories (name, capacity, surface) VALUES
  ('Studio', 2, 18.00),
  ('F1 (T2)', 3, 25.00),
  ('F2 (T3)', 4, 35.00),
  ('F3 (T4)', 6, 50.00),
  ('F4 (T5)', 8, 65.00),
  ('Chambre simple', 1, 12.00),
  ('Chambre double', 2, 16.00),
  ('Chambre twin', 2, 18.00),
  ('Suite', 2, 35.00),
  ('Chambre familiale', 4, 28.00),
  ('Chambre PMR', 2, 20.00),
  ('Duplex', 4, 45.00),
  ('Loft', 3, 40.00)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON room_categories TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE room_categories_id_seq TO authenticated;

-- Grant permissions for anon users (read-only)
GRANT SELECT ON room_categories TO anon;

-- Create RLS policies
ALTER TABLE room_categories ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage categories
CREATE POLICY "Authenticated users can manage room categories"
  ON room_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anon users to read categories
CREATE POLICY "Anonymous users can view room categories"
  ON room_categories
  FOR SELECT
  TO anon
  USING (true);

-- Update existing rooms to assign categories based on their current type
UPDATE rooms r
SET category_id = rc.id
FROM room_categories rc
WHERE LOWER(r.type) = LOWER(rc.name)
  OR (r.type = 'Simple' AND rc.name = 'Chambre simple')
  OR (r.type = 'Double' AND rc.name = 'Chambre double')
  OR (r.type = 'Twin' AND rc.name = 'Chambre twin')
  OR (r.type = 'Familiale' AND rc.name = 'Chambre familiale')
  OR (r.type = 'PMR' AND rc.name = 'Chambre PMR');

-- Add comment for documentation
COMMENT ON TABLE room_categories IS 'Stores room categories/typologies with capacity and surface information';
COMMENT ON COLUMN room_categories.name IS 'Category name (e.g., Studio, F1, F2, etc.)';
COMMENT ON COLUMN room_categories.capacity IS 'Maximum number of people that can occupy this room type';
COMMENT ON COLUMN room_categories.surface IS 'Surface area in square meters';
COMMENT ON COLUMN rooms.category_id IS 'Reference to room category/typology';