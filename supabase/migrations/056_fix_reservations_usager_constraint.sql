-- Migration: Fix reservations usager_id constraint to reference usagers table instead of clients
-- Date: 2024-12-31
-- Description: Corrects the foreign key constraint for usager_id to properly reference the usagers table

-- Step 1: Drop the existing incorrect constraint
ALTER TABLE public.reservations 
DROP CONSTRAINT IF EXISTS reservations_usager_id_fkey;

-- Step 2: Add the correct constraint to reference usagers table
ALTER TABLE public.reservations 
ADD CONSTRAINT reservations_usager_id_fkey 
FOREIGN KEY (usager_id) REFERENCES public.usagers(id) ON DELETE RESTRICT;

-- Step 3: Add prescripteur_id column to directly reference the prescripteur (client)
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS prescripteur_id INTEGER REFERENCES public.clients(id);

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_usager_id ON public.reservations(usager_id);
CREATE INDEX IF NOT EXISTS idx_reservations_prescripteur_id ON public.reservations(prescripteur_id);

-- Step 5: Update existing reservations to populate prescripteur_id from usager's prescripteur
UPDATE public.reservations r
SET prescripteur_id = u.prescripteur_id
FROM public.usagers u
WHERE r.usager_id = u.id
AND r.prescripteur_id IS NULL;

-- Step 6: Add comment to clarify the relationships
COMMENT ON COLUMN public.reservations.usager_id IS 'Reference to the usager (beneficiary) who the reservation is for';
COMMENT ON COLUMN public.reservations.prescripteur_id IS 'Reference to the prescripteur (client/organization) who prescribed the accommodation';

-- Step 7: Verify the column duree exists (from migration 048)
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS duree INTEGER;
COMMENT ON COLUMN public.reservations.duree IS 'Duration of stay in days, calculated from arrival and departure dates';

-- Step 8: Update the reservation status enum if needed to be consistent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'reservation_status'
    ) THEN
        CREATE TYPE reservation_status AS ENUM (
            'pending', 'confirmed', 'cancelled', 'completed',
            'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'
        );
    END IF;
END
$$;

-- Step 9: Grant necessary permissions
GRANT ALL ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;