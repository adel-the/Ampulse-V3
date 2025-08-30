-- Remove unused Contact, Social, and Administratif columns from usagers table
-- Migration: 052_remove_unused_usager_columns.sql
-- Date: 2025-08-30
-- Description: Clean up usagers table by removing Contact, Social, and Administratif fields

BEGIN;

-- First, check if any views or functions reference these columns
-- and drop them if they exist

-- Drop any indexes on columns we're about to remove
DROP INDEX IF EXISTS idx_usagers_ville;
DROP INDEX IF EXISTS idx_usagers_code_postal;
DROP INDEX IF EXISTS idx_usagers_situation_familiale;
DROP INDEX IF EXISTS idx_usagers_numero_secu;

-- Remove constraints if any exist on these columns
ALTER TABLE usagers DROP CONSTRAINT IF EXISTS chk_situation_familiale;
ALTER TABLE usagers DROP CONSTRAINT IF EXISTS chk_type_revenus;
ALTER TABLE usagers DROP CONSTRAINT IF EXISTS chk_autonomie_level;

-- Remove Contact section columns
ALTER TABLE usagers DROP COLUMN IF EXISTS adresse;
ALTER TABLE usagers DROP COLUMN IF EXISTS ville;
ALTER TABLE usagers DROP COLUMN IF EXISTS code_postal;

-- Remove Social section columns  
ALTER TABLE usagers DROP COLUMN IF EXISTS situation_familiale;
ALTER TABLE usagers DROP COLUMN IF EXISTS nombre_enfants;
ALTER TABLE usagers DROP COLUMN IF EXISTS revenus;
ALTER TABLE usagers DROP COLUMN IF EXISTS type_revenus;
ALTER TABLE usagers DROP COLUMN IF EXISTS prestations;

-- Remove Administratif section columns
ALTER TABLE usagers DROP COLUMN IF EXISTS numero_secu;
ALTER TABLE usagers DROP COLUMN IF EXISTS caf_number;
ALTER TABLE usagers DROP COLUMN IF EXISTS observations;

-- Keep autonomie_level as it has operational significance
-- (This was identified during analysis as still being used)

-- Update any existing RLS policies if needed
-- (Most policies should still work as they typically filter on id, prescripteur_id, etc.)

-- Add comment to document the cleanup
COMMENT ON TABLE usagers IS 'Usagers table - simplified schema after removing Contact, Social, and Administratif sections (2025-08-30)';

COMMIT;

-- Verify the cleanup by showing remaining columns
-- \d usagers;