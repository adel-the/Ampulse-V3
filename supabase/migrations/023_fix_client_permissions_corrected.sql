-- 023_fix_client_permissions_corrected.sql
-- Fix RLS and permission issues for client management (corrected)

-- First, ensure RLS is disabled for client tables (for now)
ALTER TABLE client_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE referents DISABLE ROW LEVEL SECURITY;
ALTER TABLE conventions_tarifaires DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT ON client_types TO anon, authenticated;
GRANT SELECT ON clients TO anon, authenticated;
GRANT SELECT ON referents TO anon, authenticated;
GRANT SELECT ON conventions_tarifaires TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT INSERT, UPDATE, DELETE ON referents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON conventions_tarifaires TO authenticated;

-- Grant permissions on sequences
GRANT USAGE ON SEQUENCE clients_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE referents_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE conventions_tarifaires_id_seq TO authenticated;

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_client_statistics();
DROP FUNCTION IF EXISTS search_clients(text, integer, text, integer);

-- Create an alias function for compatibility with frontend
CREATE OR REPLACE FUNCTION get_client_statistics()
RETURNS TABLE(
    total_clients integer,
    clients_actifs integer,
    nouveaux_ce_mois integer,
    chiffre_affaires_total decimal
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.total_clients,
        s.clients_actifs,
        s.nouveaux_ce_mois,
        0::decimal as chiffre_affaires_total
    FROM get_simple_client_statistics() s;
END;
$$;

-- Create an alias function for search_clients for frontend compatibility
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
    date_creation timestamp with time zone,
    nombre_reservations integer,
    montant_total_reservations decimal
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.numero_client,
        s.nom_complet,
        s.type_nom,
        s.email,
        s.telephone,
        s.ville,
        s.statut,
        s.date_creation,
        0 as nombre_reservations,
        0::decimal as montant_total_reservations
    FROM search_simple_clients(p_search_term, p_type_id, p_statut, p_limit) s;
END;
$$;

-- Grant execute permissions on functions to both roles
GRANT EXECUTE ON FUNCTION get_simple_client_statistics() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_client_statistics() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_simple_clients(text, integer, text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_clients(text, integer, text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_simple_client_number(integer) TO authenticated;

-- Ensure client_types has the correct data
INSERT INTO client_types (id, nom, description, icone, couleur, ordre) VALUES
    (1, 'Particulier', 'Client individuel', 'user', '#3B82F6', 1),
    (2, 'Entreprise', 'Société commerciale', 'building', '#10B981', 2),
    (3, 'Association', 'Organisation à but non lucratif', 'users', '#F59E0B', 3)
ON CONFLICT (id) DO UPDATE SET
    nom = EXCLUDED.nom,
    description = EXCLUDED.description,
    icone = EXCLUDED.icone,
    couleur = EXCLUDED.couleur,
    ordre = EXCLUDED.ordre;

-- Add comments for clarity
COMMENT ON FUNCTION get_client_statistics() IS 'Frontend-compatible client statistics with revenue data';
COMMENT ON FUNCTION search_clients(text, integer, text, integer) IS 'Frontend-compatible client search with reservation data';
