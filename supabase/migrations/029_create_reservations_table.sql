-- Create reservations table for simplified reservation system
-- Uses French naming conventions to match existing codebase

-- Create sequence for reservation numbers
CREATE SEQUENCE IF NOT EXISTS reservation_number_seq START WITH 1;

-- Create reservation status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
    CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
  END IF;
END $$;

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  -- Primary key
  id SERIAL PRIMARY KEY,
  
  -- Unique reservation number (auto-generated)
  reservation_number VARCHAR(50) UNIQUE,
  
  -- Foreign keys to existing tables
  hotel_id INTEGER REFERENCES hotels(id) NOT NULL,
  chambre_id INTEGER REFERENCES rooms(id) NOT NULL,
  usager_id INTEGER REFERENCES clients(id),
  
  -- Dates
  date_arrivee DATE NOT NULL,
  date_depart DATE NOT NULL,
  
  -- Guest counts
  adults_count INTEGER NOT NULL DEFAULT 1 CHECK (adults_count > 0),
  children_count INTEGER DEFAULT 0 CHECK (children_count >= 0),
  
  -- Status
  statut reservation_status DEFAULT 'pending' NOT NULL,
  
  -- Pricing
  room_rate DECIMAL(10,2) NOT NULL CHECK (room_rate >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  
  -- Additional information
  special_requests TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_hotel_id ON reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_chambre_id ON reservations(chambre_id);
CREATE INDEX IF NOT EXISTS idx_reservations_usager_id ON reservations(usager_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(date_arrivee, date_depart);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON reservations(statut);
CREATE INDEX IF NOT EXISTS idx_reservations_number ON reservations(reservation_number);

-- Add constraint to ensure checkout is after checkin
ALTER TABLE reservations 
  ADD CONSTRAINT check_dates CHECK (date_depart > date_arrivee);

-- Function to generate reservation number
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reservation_number IS NULL THEN
    NEW.reservation_number := 'RES-' || 
      EXTRACT(YEAR FROM NOW()) || '-' || 
      LPAD(NEXTVAL('reservation_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate reservation number
DROP TRIGGER IF EXISTS set_reservation_number ON reservations;
CREATE TRIGGER set_reservation_number
  BEFORE INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION generate_reservation_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reservation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservation_updated_at();

-- Function to check room availability
CREATE OR REPLACE FUNCTION check_room_availability(
  p_room_id INTEGER,
  p_check_in DATE,
  p_check_out DATE,
  p_exclude_reservation_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM reservations
    WHERE chambre_id = p_room_id
      AND statut NOT IN ('cancelled')
      AND (p_exclude_reservation_id IS NULL OR id != p_exclude_reservation_id)
      AND (
        (date_arrivee <= p_check_in AND date_depart > p_check_in)
        OR (date_arrivee < p_check_out AND date_depart >= p_check_out)
        OR (date_arrivee >= p_check_in AND date_depart <= p_check_out)
      )
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON reservations TO authenticated;
GRANT ALL ON reservations TO service_role;
GRANT SELECT ON reservations TO anon;

GRANT USAGE, SELECT ON SEQUENCE reservations_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE reservations_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE reservation_number_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE reservation_number_seq TO service_role;

-- Add RLS policies
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Policy for service role (full access)
CREATE POLICY "Service role has full access to reservations"
  ON reservations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy for authenticated users (full access for now, can be restricted later)
CREATE POLICY "Authenticated users can manage reservations"
  ON reservations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for anonymous users (read only)
CREATE POLICY "Anonymous users can view reservations"
  ON reservations
  FOR SELECT
  TO anon
  USING (true);

-- Add comments for documentation
COMMENT ON TABLE reservations IS 'Stores hotel room reservations';
COMMENT ON COLUMN reservations.reservation_number IS 'Unique reservation number in format RES-YYYY-NNNNNN';
COMMENT ON COLUMN reservations.chambre_id IS 'Reference to the reserved room';
COMMENT ON COLUMN reservations.usager_id IS 'Reference to the client making the reservation';
COMMENT ON COLUMN reservations.statut IS 'Current status of the reservation';
COMMENT ON COLUMN reservations.room_rate IS 'Nightly rate for the room';
COMMENT ON COLUMN reservations.total_amount IS 'Total amount for the entire stay';