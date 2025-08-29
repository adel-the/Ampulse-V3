-- Migration: Add missing columns to reservations table
-- These columns are referenced in the TypeScript types but were missing from the database

-- Step 1: Add prescripteur column (required field)
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS prescripteur VARCHAR(255);

-- Populate existing records with a default value
UPDATE public.reservations
SET prescripteur = 'System'
WHERE prescripteur IS NULL;

-- Make it NOT NULL after populating
ALTER TABLE public.reservations 
ALTER COLUMN prescripteur SET NOT NULL;

-- Step 2: Add prix column (legacy field for compatibility)
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS prix DECIMAL(10,2);

-- Populate prix from room_rate for existing records
UPDATE public.reservations
SET prix = room_rate
WHERE prix IS NULL;

-- Make it NOT NULL after populating
ALTER TABLE public.reservations 
ALTER COLUMN prix SET NOT NULL;

-- Step 3: Add operateur_id column (optional field, no FK constraint as table doesn't exist)
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS operateur_id INTEGER;

-- Step 4: Add notes column (optional field)
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN public.reservations.prescripteur IS 'Prescripteur who created or referred the reservation';
COMMENT ON COLUMN public.reservations.prix IS 'Legacy price field for compatibility (usually same as room_rate)';
COMMENT ON COLUMN public.reservations.operateur_id IS 'Optional reference to social operator';
COMMENT ON COLUMN public.reservations.notes IS 'Additional notes about the reservation';

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_prescripteur ON public.reservations(prescripteur);
CREATE INDEX IF NOT EXISTS idx_reservations_operateur_id ON public.reservations(operateur_id);

-- Grant permissions
GRANT ALL ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;

-- Add comment documenting the change
COMMENT ON TABLE public.reservations IS 'Hotel reservations with complete fields including prescripteur, prix, duree, operateur_id, and notes';