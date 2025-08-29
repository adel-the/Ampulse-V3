-- Migration: Add duree column to reservations table
-- This column stores the duration of stay in days (calculated from date_arrivee and date_depart)

-- Step 1: Add the duree column to reservations table
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS duree INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN public.reservations.duree IS 'Duration of the stay in days (calculated from date_depart - date_arrivee)';

-- Step 2: Update existing reservations to populate duree based on existing dates
UPDATE public.reservations
SET duree = DATE_PART('day', date_depart::timestamp - date_arrivee::timestamp)
WHERE duree IS NULL;

-- Step 3: Add NOT NULL constraint after populating existing data
ALTER TABLE public.reservations 
ALTER COLUMN duree SET NOT NULL;

-- Step 4: Add CHECK constraint to ensure duree is positive
ALTER TABLE public.reservations 
ADD CONSTRAINT check_duree_positive CHECK (duree > 0);

-- Step 5: Create or replace function to automatically calculate duree on insert/update
CREATE OR REPLACE FUNCTION calculate_reservation_duree()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate duree from dates if not explicitly provided
  IF NEW.duree IS NULL OR NEW.duree = 0 THEN
    NEW.duree := DATE_PART('day', NEW.date_depart::timestamp - NEW.date_arrivee::timestamp);
    -- Ensure minimum 1 day duration
    IF NEW.duree < 1 THEN
      NEW.duree := 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to automatically calculate duree
DROP TRIGGER IF EXISTS calculate_duree_trigger ON public.reservations;
CREATE TRIGGER calculate_duree_trigger
  BEFORE INSERT OR UPDATE OF date_arrivee, date_depart
  ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_reservation_duree();

-- Step 7: Update the get_available_rooms_with_details function if it references reservations
-- (No changes needed as this function doesn't use duree)

-- Step 8: Grant necessary permissions
GRANT ALL ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;

-- Add comment documenting the change
COMMENT ON TABLE public.reservations IS 'Hotel reservations with duree column for storing duration in days';