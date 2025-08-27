-- ============================================================================
-- Migration: Simplify client_types structure to ENUM
-- Date: 2025-08-27
-- Description: 
--   Convert client_types table to an ENUM type called 'client_category'
--   This simplifies the database structure and improves performance
--   Values: 'Particulier', 'Entreprise', 'Association'
-- ============================================================================

-- Begin transaction for atomic operation
BEGIN;

-- ============================================================================
-- STEP 1: Create the client_category ENUM type
-- ============================================================================

-- Create the ENUM type
CREATE TYPE client_category AS ENUM ('Particulier', 'Entreprise', 'Association');

COMMENT ON TYPE client_category IS 'Client category types: Particulier, Entreprise, Association';

-- ============================================================================
-- STEP 2: Add new client_type column to clients table
-- ============================================================================

-- Add the new ENUM column (nullable initially for migration)
ALTER TABLE clients ADD COLUMN client_type client_category;

COMMENT ON COLUMN clients.client_type IS 'Client type using ENUM (replaces type_id)';

-- ============================================================================
-- STEP 3: Migrate existing data from type_id to client_type
-- ============================================================================

-- Map existing type_id values to ENUM values
-- 1 = Particulier, 2 = Entreprise, 3 = Association
UPDATE clients 
SET client_type = CASE 
    WHEN type_id = 1 THEN 'Particulier'::client_category
    WHEN type_id = 2 THEN 'Entreprise'::client_category
    WHEN type_id = 3 THEN 'Association'::client_category
    ELSE 'Particulier'::client_category  -- Default fallback
END;

-- Verify all records have been updated
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM clients WHERE client_type IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % clients still have NULL client_type', null_count;
    END IF;
    RAISE NOTICE 'Successfully migrated client types for all % clients', (SELECT COUNT(*) FROM clients);
END $$;

-- ============================================================================
-- STEP 4: Update the generate_simple_client_number function
-- ============================================================================

-- Drop the old function
DROP FUNCTION IF EXISTS generate_simple_client_number(integer);

-- Create new function using ENUM
CREATE OR REPLACE FUNCTION generate_simple_client_number(p_client_type client_category)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    type_code text;
    next_number integer;
    client_number text;
BEGIN
    -- Determine type code based on ENUM value
    type_code := CASE p_client_type
        WHEN 'Particulier' THEN 'PAR'
        WHEN 'Entreprise' THEN 'ENT'
        WHEN 'Association' THEN 'ASS'
        ELSE 'CLI'
    END;
    
    -- Get next number for this type
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_client FROM '\d+') AS integer)), 0) + 1
    INTO next_number
    FROM clients 
    WHERE numero_client LIKE type_code || '%';
    
    -- Format client number
    client_number := type_code || LPAD(next_number::text, 4, '0');
    
    RETURN client_number;
END;
$$;

COMMENT ON FUNCTION generate_simple_client_number IS 'Generate unique client number based on client_type ENUM';

-- ============================================================================
-- STEP 5: Update the search_simple_clients function
-- ============================================================================

-- Drop the old function
DROP FUNCTION IF EXISTS search_simple_clients(text, integer, text, integer);

-- Create new function without JOIN (using ENUM directly)
CREATE OR REPLACE FUNCTION search_simple_clients(
    p_search_term text DEFAULT '',
    p_client_type client_category DEFAULT NULL,
    p_statut text DEFAULT NULL,
    p_limit integer DEFAULT 50
)
RETURNS TABLE(
    id integer,
    numero_client text,
    nom_complet text,
    type_nom text,
    email text,
    telephone text,
    ville text,
    statut text,
    date_creation timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.numero_client,
        CASE 
            WHEN c.client_type = 'Particulier' THEN TRIM(c.nom || ' ' || COALESCE(c.prenom, ''))
            ELSE COALESCE(c.raison_sociale, c.nom)
        END as nom_complet,
        c.client_type::text as type_nom,  -- Direct ENUM to text conversion
        c.email,
        c.telephone,
        c.ville,
        c.statut,
        c.created_at as date_creation
    FROM clients c
    WHERE (
        p_search_term = '' OR 
        c.nom ILIKE '%' || p_search_term || '%' OR
        c.prenom ILIKE '%' || p_search_term || '%' OR
        c.raison_sociale ILIKE '%' || p_search_term || '%' OR
        c.email ILIKE '%' || p_search_term || '%' OR
        c.numero_client ILIKE '%' || p_search_term || '%'
    )
    AND (p_client_type IS NULL OR c.client_type = p_client_type)
    AND (p_statut IS NULL OR c.statut = p_statut)
    ORDER BY 
        CASE WHEN c.client_type = 'Particulier' THEN c.nom ELSE c.raison_sociale END
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION search_simple_clients IS 'Search clients with ENUM-based filtering (no JOIN required)';

-- ============================================================================
-- STEP 6: Update the search_clients function (from migration 023)
-- ============================================================================

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS search_clients(text, integer, text, integer);

-- Create new function using ENUM
CREATE OR REPLACE FUNCTION search_clients(
    p_search_term text DEFAULT '',
    p_client_type client_category DEFAULT NULL,
    p_statut text DEFAULT NULL,
    p_limit integer DEFAULT 50
)
RETURNS TABLE(
    id integer,
    numero_client text,
    nom_complet text,
    type_nom text,
    email text,
    telephone text,
    ville text,
    statut text,
    date_creation timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.numero_client,
        CASE 
            WHEN c.client_type = 'Particulier' THEN TRIM(c.nom || ' ' || COALESCE(c.prenom, ''))
            ELSE COALESCE(c.raison_sociale, c.nom)
        END as nom_complet,
        c.client_type::text as type_nom,
        c.email,
        c.telephone,
        c.ville,
        c.statut,
        c.created_at as date_creation
    FROM clients c
    WHERE (
        p_search_term = '' OR 
        c.nom ILIKE '%' || p_search_term || '%' OR
        c.prenom ILIKE '%' || p_search_term || '%' OR
        c.raison_sociale ILIKE '%' || p_search_term || '%' OR
        c.email ILIKE '%' || p_search_term || '%' OR
        c.numero_client ILIKE '%' || p_search_term || '%'
    )
    AND (p_client_type IS NULL OR c.client_type = p_client_type)
    AND (p_statut IS NULL OR c.statut = p_statut)
    ORDER BY 
        CASE WHEN c.client_type = 'Particulier' THEN c.nom ELSE COALESCE(c.raison_sociale, c.nom) END
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION search_clients IS 'Search clients with ENUM-based filtering';

-- ============================================================================
-- STEP 7: Update the trigger function
-- ============================================================================

-- Drop the trigger first (if it exists)
DROP TRIGGER IF EXISTS trigger_set_simple_client_numero ON clients;

-- Drop the old trigger function
DROP FUNCTION IF EXISTS set_simple_client_numero();

-- Create new trigger function using ENUM
CREATE OR REPLACE FUNCTION set_simple_client_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Set default client_type if NULL
    IF NEW.client_type IS NULL THEN
        NEW.client_type := 'Particulier'::client_category;
    END IF;
    
    -- Generate client number if NULL
    IF NEW.numero_client IS NULL THEN
        NEW.numero_client := generate_simple_client_number(NEW.client_type);
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_simple_client_numero IS 'Trigger function for client number generation using ENUM';

-- Recreate the trigger
CREATE TRIGGER trigger_set_simple_client_numero
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION set_simple_client_numero();

-- ============================================================================
-- STEP 8: Update convention constraint to use ENUM
-- ============================================================================

-- Drop any trigger using the constraint function (if it exists)
DROP TRIGGER IF EXISTS check_convention_client_type_trigger ON conventions_tarifaires;
DROP TRIGGER IF EXISTS ensure_convention_not_particulier ON conventions_tarifaires;

-- Drop the old constraint function
DROP FUNCTION IF EXISTS check_convention_client_type();

-- Create new constraint function using ENUM
CREATE OR REPLACE FUNCTION check_convention_client_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    client_type_value client_category;
BEGIN
    SELECT client_type INTO client_type_value FROM clients WHERE id = NEW.client_id;
    IF client_type_value = 'Particulier' THEN
        RAISE EXCEPTION 'Conventions tarifaires ne sont disponibles que pour les entreprises et associations';
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION check_convention_client_type IS 'Prevent conventions for Particulier clients (ENUM version)';

-- Recreate the trigger with the correct name
CREATE TRIGGER ensure_convention_not_particulier
    BEFORE INSERT OR UPDATE ON conventions_tarifaires
    FOR EACH ROW
    EXECUTE FUNCTION check_convention_client_type();

-- ============================================================================
-- STEP 9: Make client_type column NOT NULL and set default
-- ============================================================================

-- Make the new column NOT NULL with default value
ALTER TABLE clients ALTER COLUMN client_type SET NOT NULL;
ALTER TABLE clients ALTER COLUMN client_type SET DEFAULT 'Particulier'::client_category;

-- ============================================================================
-- STEP 10: Create new index on client_type ENUM
-- ============================================================================

-- Create index on the new ENUM column
CREATE INDEX idx_clients_client_type ON clients(client_type);

COMMENT ON INDEX idx_clients_client_type IS 'Index on client_type ENUM for fast filtering';

-- ============================================================================
-- STEP 11: Drop old structures
-- ============================================================================

-- Drop the old index on type_id
DROP INDEX IF EXISTS idx_clients_type_id;

-- Drop the foreign key constraint
ALTER TABLE clients DROP CONSTRAINT IF EXISTS fk_clients_type_id;

-- Drop the old type_id column
ALTER TABLE clients DROP COLUMN IF EXISTS type_id;

-- Drop the client_types table (no longer needed)
DROP TABLE IF EXISTS client_types CASCADE;

-- ============================================================================
-- STEP 12: Update existing client numbers if needed
-- ============================================================================

-- Generate missing client numbers using the new function
UPDATE clients 
SET numero_client = generate_simple_client_number(client_type)
WHERE numero_client IS NULL;

-- ============================================================================
-- STEP 13: Update table comments
-- ============================================================================

COMMENT ON TABLE clients IS 'Simplified clients table using client_category ENUM instead of client_types table';
COMMENT ON TABLE referents IS 'Contact persons for clients (linked to clients)';
COMMENT ON TABLE conventions_tarifaires IS 'Pricing agreements only for Entreprise and Association types';

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Verify the migration
DO $$
DECLARE
    client_count INTEGER;
    enum_count INTEGER;
    particulier_count INTEGER;
    entreprise_count INTEGER;
    association_count INTEGER;
BEGIN
    -- Count total clients
    SELECT COUNT(*) INTO client_count FROM clients;
    
    -- Count clients with ENUM values
    SELECT COUNT(*) INTO enum_count FROM clients WHERE client_type IS NOT NULL;
    
    -- Count by type
    SELECT COUNT(*) INTO particulier_count FROM clients WHERE client_type = 'Particulier';
    SELECT COUNT(*) INTO entreprise_count FROM clients WHERE client_type = 'Entreprise';
    SELECT COUNT(*) INTO association_count FROM clients WHERE client_type = 'Association';
    
    -- Verification
    IF client_count != enum_count THEN
        RAISE EXCEPTION 'Migration verification failed: client count mismatch';
    END IF;
    
    -- Report results
    RAISE NOTICE '=== Migration 024 Verification ===';
    RAISE NOTICE 'Total clients: %', client_count;
    RAISE NOTICE 'Particulier: %', particulier_count;
    RAISE NOTICE 'Entreprise: %', entreprise_count;
    RAISE NOTICE 'Association: %', association_count;
    RAISE NOTICE 'client_types table: DROPPED';
    RAISE NOTICE 'type_id column: DROPPED';
    RAISE NOTICE 'client_type ENUM: CREATED';
    RAISE NOTICE 'All functions updated to use ENUM';
    RAISE NOTICE '=== Migration completed successfully ===';
END $$;

-- Commit the transaction
COMMIT;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (for reference)
-- ============================================================================
/*
-- To rollback this migration, you would need to:

BEGIN;

-- 1. Recreate client_types table
CREATE TABLE client_types (
    id serial PRIMARY KEY,
    nom text NOT NULL UNIQUE,
    description text,
    icone text,
    couleur text,
    ordre integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- 2. Insert default values
INSERT INTO client_types (id, nom, description, icone, couleur, ordre) VALUES
    (1, 'Particulier', 'Client individuel', 'user', '#3B82F6', 1),
    (2, 'Entreprise', 'Société commerciale', 'building', '#10B981', 2),
    (3, 'Association', 'Organisation à but non lucratif', 'users', '#F59E0B', 3);

-- 3. Add type_id column back
ALTER TABLE clients ADD COLUMN type_id INTEGER REFERENCES client_types(id) DEFAULT 1;

-- 4. Migrate data back
UPDATE clients SET type_id = CASE 
    WHEN client_type = 'Particulier' THEN 1
    WHEN client_type = 'Entreprise' THEN 2  
    WHEN client_type = 'Association' THEN 3
    ELSE 1
END;

-- 5. Drop ENUM column and type
ALTER TABLE clients DROP COLUMN client_type;
DROP TYPE client_category;

-- 6. Recreate old functions with type_id parameter
-- (Restore original function definitions from previous migrations)

COMMIT;
*/