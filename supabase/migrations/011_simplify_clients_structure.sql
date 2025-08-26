-- 011_simplify_clients_structure.sql
-- Simplify client database structure to only 2-3 tables maximum

-- First, drop the extra tables that won't be needed
DROP TABLE IF EXISTS client_documents CASCADE;
DROP TABLE IF EXISTS client_notes CASCADE;
DROP TABLE IF EXISTS client_interactions CASCADE;
DROP TABLE IF EXISTS client_contacts CASCADE;

-- Keep the client_types table and update it if needed
-- This table is useful for managing the 3 types: Particulier, Entreprise, Association

-- Remove most fields from clients table, keeping only essential ones
-- First, let's save important data that might exist
CREATE TEMP TABLE clients_backup AS 
SELECT id, nom, prenom, email, telephone, adresse, ville, code_postal, 
       type_id, statut, raison_sociale, siret, numero_client,
       referent_nom, referent_prenom, referent_telephone, referent_email, referent_fonction,
       convention_active, convention_date_debut, convention_date_fin, convention_conditions
FROM clients;

-- Recreate a simplified clients table
DROP TABLE IF EXISTS clients CASCADE;

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    
    -- Basic info (essential only)
    nom TEXT NOT NULL,
    prenom TEXT,
    email TEXT,
    telephone TEXT,
    adresse TEXT,
    ville TEXT,
    code_postal TEXT,
    
    -- Type and status
    type_id INTEGER REFERENCES client_types(id) DEFAULT 1,
    statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'prospect')),
    numero_client TEXT UNIQUE,
    
    -- For Entreprise and Association only
    raison_sociale TEXT,
    siret TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the referents table (separate table for contacts)
CREATE TABLE referents (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    prenom TEXT,
    fonction TEXT,
    telephone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the conventions_tarifaires table (only for Entreprise and Association)
CREATE TABLE conventions_tarifaires (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    date_debut DATE,
    date_fin DATE,
    reduction_pourcentage DECIMAL(5,2),
    forfait_mensuel DECIMAL(10,2),
    conditions TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to prevent conventions for Particulier clients
CREATE OR REPLACE FUNCTION check_convention_client_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    client_type_id INTEGER;
BEGIN
    SELECT type_id INTO client_type_id FROM clients WHERE id = NEW.client_id;
    IF client_type_id = 1 THEN
        RAISE EXCEPTION 'Conventions tarifaires ne sont disponibles que pour les entreprises et associations';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_convention_not_particulier
    BEFORE INSERT OR UPDATE ON conventions_tarifaires
    FOR EACH ROW
    EXECUTE FUNCTION check_convention_client_type();

-- Restore the essential data (convert statut to lowercase)
INSERT INTO clients (id, nom, prenom, email, telephone, adresse, ville, code_postal, 
                    type_id, statut, raison_sociale, siret, numero_client, created_at)
SELECT id, nom, prenom, email, telephone, adresse, ville, code_postal,
       type_id, LOWER(statut), raison_sociale, siret, numero_client, NOW()
FROM clients_backup;

-- Restore referents data where it exists
INSERT INTO referents (client_id, nom, prenom, telephone, email)
SELECT id, referent_nom, referent_prenom, referent_telephone, referent_email
FROM clients_backup 
WHERE referent_nom IS NOT NULL;

-- Restore convention data where it exists and for non-Particulier types only
INSERT INTO conventions_tarifaires (client_id, date_debut, date_fin, conditions, active)
SELECT id, convention_date_debut, convention_date_fin, convention_conditions, convention_active
FROM clients_backup 
WHERE convention_active = true AND type_id != 1; -- Only for Entreprise and Association

-- Update sequence to continue from current max id
SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));
SELECT setval('referents_id_seq', (SELECT COALESCE(MAX(id), 1) FROM referents));
SELECT setval('conventions_tarifaires_id_seq', (SELECT COALESCE(MAX(id), 1) FROM conventions_tarifaires));

-- Create indexes for performance
CREATE INDEX idx_clients_type_id ON clients(type_id);
CREATE INDEX idx_clients_numero_client ON clients(numero_client);
CREATE INDEX idx_clients_statut ON clients(statut);
CREATE INDEX idx_clients_nom ON clients(nom);
CREATE INDEX idx_referents_client_id ON referents(client_id);
CREATE INDEX idx_conventions_client_id ON conventions_tarifaires(client_id);
CREATE INDEX idx_conventions_active ON conventions_tarifaires(active);

-- Create function to generate client numbers (simplified)
CREATE OR REPLACE FUNCTION generate_simple_client_number(p_type_id integer)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    type_code text;
    next_number integer;
    client_number text;
BEGIN
    -- Determine type code
    type_code := CASE p_type_id
        WHEN 1 THEN 'PAR'
        WHEN 2 THEN 'ENT'
        WHEN 3 THEN 'ASS'
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

-- Create function to search clients (simplified)
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
        ct.nom as type_nom,
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
        CASE WHEN c.type_id = 1 THEN c.nom ELSE c.raison_sociale END
    LIMIT p_limit;
END;
$$;

-- Create function to get simple client statistics
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

-- Add trigger to auto-generate client number on insert
CREATE OR REPLACE FUNCTION set_simple_client_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.numero_client IS NULL THEN
        NEW.numero_client := generate_simple_client_number(NEW.type_id);
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_simple_client_numero
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION set_simple_client_numero();

-- Add trigger for updated_at on referents
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_referents_updated_at
    BEFORE UPDATE ON referents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_conventions_updated_at
    BEFORE UPDATE ON conventions_tarifaires
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Drop temp table
DROP TABLE clients_backup;

-- Generate missing client numbers
UPDATE clients 
SET numero_client = generate_simple_client_number(type_id)
WHERE numero_client IS NULL;

-- Add comments
COMMENT ON TABLE clients IS 'Simplified clients table with essential information only';
COMMENT ON TABLE referents IS 'Contact persons for clients (linked to clients)';
COMMENT ON TABLE conventions_tarifaires IS 'Pricing agreements only for Entreprise and Association types';
COMMENT ON TABLE client_types IS 'Client types: Particulier, Entreprise, Association';