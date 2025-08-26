-- 012_fix_database_functions_column_references.sql
-- Fix database function column references to use correct existing column names
-- This migration fixes functions that reference non-existing columns

-- Drop and recreate the get_client_statistics function to use correct column names
DROP FUNCTION IF EXISTS get_client_statistics();

-- Drop the old get_simple_client_statistics function too as we need to fix it
DROP FUNCTION IF EXISTS get_simple_client_statistics();

-- Create the corrected get_client_statistics function (used by frontend)
CREATE OR REPLACE FUNCTION get_client_statistics()
RETURNS TABLE(
    total_clients integer,
    clients_actifs integer,
    nouveaux_ce_mois integer,
    chiffre_affaires_total numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::integer as total_clients,
        COUNT(*) FILTER (WHERE statut = 'actif')::integer as clients_actifs,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::integer as nouveaux_ce_mois,
        COALESCE(0, 0)::numeric as chiffre_affaires_total  -- Placeholder since we don't have montant_total_reservations
    FROM clients;
END;
$$;

-- Also create the get_simple_client_statistics function (for consistency)
CREATE OR REPLACE FUNCTION get_simple_client_statistics()
RETURNS TABLE(
    total_clients integer,
    clients_actifs integer,
    nouveaux_ce_mois integer
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::integer as total_clients,
        COUNT(*) FILTER (WHERE statut = 'actif')::integer as clients_actifs,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::integer as nouveaux_ce_mois
    FROM clients;
END;
$$;

-- Check if search_simple_clients function exists and has correct column references
DROP FUNCTION IF EXISTS search_simple_clients(text, integer, text, integer);

-- Recreate the search_simple_clients function with correct column references
CREATE OR REPLACE FUNCTION search_simple_clients(
    p_search_term text DEFAULT '',
    p_type_id integer DEFAULT NULL,
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
            WHEN c.type_id = 1 THEN TRIM(c.nom || ' ' || COALESCE(c.prenom, ''))
            ELSE COALESCE(c.raison_sociale, c.nom)
        END as nom_complet,
        COALESCE(ct.nom, 'Client') as type_nom,
        c.email,
        c.telephone,
        c.ville,
        c.statut,
        c.created_at as date_creation
    FROM clients c
    LEFT JOIN client_types ct ON c.type_id = ct.id
    WHERE (
        p_search_term = '' OR 
        c.nom ILIKE '%' || p_search_term || '%' OR
        c.prenom ILIKE '%' || p_search_term || '%' OR
        c.raison_sociale ILIKE '%' || p_search_term || '%' OR
        c.email ILIKE '%' || p_search_term || '%' OR
        c.numero_client ILIKE '%' || p_search_term || '%'
    )
    AND (p_type_id IS NULL OR c.type_id = p_type_id)
    AND (p_statut IS NULL OR c.statut = p_statut)
    ORDER BY 
        CASE WHEN c.type_id = 1 THEN c.nom ELSE COALESCE(c.raison_sociale, c.nom) END
    LIMIT p_limit;
END;
$$;

-- Make sure the search_clients function also exists (remove the old one first)
DROP FUNCTION IF EXISTS search_clients(text, integer, text, integer);

-- Create search_clients function as well for backward compatibility
CREATE OR REPLACE FUNCTION search_clients(
    p_search_term text DEFAULT '',
    p_type_id integer DEFAULT NULL,
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
    nombre_reservations integer,
    montant_total_reservations numeric,
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
            WHEN c.type_id = 1 THEN TRIM(c.nom || ' ' || COALESCE(c.prenom, ''))
            ELSE COALESCE(c.raison_sociale, c.nom)
        END as nom_complet,
        COALESCE(ct.nom, 'Client') as type_nom,
        c.email,
        c.telephone,
        c.ville,
        c.statut,
        0::integer as nombre_reservations,  -- Placeholder since we don't have this field
        0::numeric as montant_total_reservations, -- Placeholder since we don't have this field
        c.created_at as date_creation
    FROM clients c
    LEFT JOIN client_types ct ON c.type_id = ct.id
    WHERE (
        p_search_term = '' OR 
        c.nom ILIKE '%' || p_search_term || '%' OR
        c.prenom ILIKE '%' || p_search_term || '%' OR
        c.raison_sociale ILIKE '%' || p_search_term || '%' OR
        c.email ILIKE '%' || p_search_term || '%' OR
        c.numero_client ILIKE '%' || p_search_term || '%'
    )
    AND (p_type_id IS NULL OR c.type_id = p_type_id)
    AND (p_statut IS NULL OR c.statut = p_statut)
    ORDER BY 
        CASE WHEN c.type_id = 1 THEN c.nom ELSE COALESCE(c.raison_sociale, c.nom) END
    LIMIT p_limit;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION get_client_statistics() IS 'Returns client statistics with correct column references';
COMMENT ON FUNCTION get_simple_client_statistics() IS 'Returns simple client statistics with correct column references';
COMMENT ON FUNCTION search_simple_clients(text, integer, text, integer) IS 'Search clients with simple result set and correct column references';
COMMENT ON FUNCTION search_clients(text, integer, text, integer) IS 'Search clients with full result set and correct column references';

-- Log the migration completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully fixed database functions with correct column references at %', NOW();
  RAISE NOTICE 'Migration 012_fix_database_functions_column_references.sql completed';
END $$;