-- 010_enhance_clients_table.sql
-- Add missing fields to clients table for comprehensive client management

-- First, add the missing columns to the clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS raison_sociale text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS siret text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS siren text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tva_intracommunautaire text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS telephone_mobile text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fax text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS site_web text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS complement_adresse text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pays text DEFAULT 'France';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS statut text DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'prospect', 'archive'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type_id integer DEFAULT 1; -- 1=Particulier, 2=Entreprise, 3=Association
ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero_client text UNIQUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_creation date DEFAULT CURRENT_DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source_acquisition text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS conditions_paiement text DEFAULT '30 jours';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS limite_credit numeric(10,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS commercial_id uuid REFERENCES auth.users(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS secteur_activite text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS taille_entreprise text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS chiffre_affaires numeric(12,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nombre_employes integer;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero_agrement text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_agrement date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS domaine_action text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nombre_adherents integer;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lieu_naissance text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nationalite text DEFAULT 'Française';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS employeur text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS solde_compte numeric(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nombre_reservations integer DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS montant_total_reservations numeric(12,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_derniere_reservation timestamp with time zone;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Convention tarifaire fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS convention_tarifaire jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS convention_active boolean DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS convention_date_debut date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS convention_date_fin date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS convention_conditions text;

-- Référent fields 
ALTER TABLE clients ADD COLUMN IF NOT EXISTS referent_nom text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS referent_prenom text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS referent_telephone text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS referent_email text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS referent_fonction text;

-- Facturation fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facturation_adresse text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facturation_code_postal text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facturation_ville text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facturation_pays text DEFAULT 'France';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facturation_mode_paiement text DEFAULT 'virement';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facturation_rib text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facturation_iban text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facturation_bic text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facturation_titulaire_compte text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facturation_delai_paiement integer DEFAULT 30;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facturation_tva_applicable boolean DEFAULT true;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facturation_remise_default numeric(5,2) DEFAULT 0;

-- Create client_types table if not exists
CREATE TABLE IF NOT EXISTS client_types (
    id serial PRIMARY KEY,
    nom text NOT NULL UNIQUE,
    description text,
    icone text,
    couleur text,
    ordre integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Insert default client types
INSERT INTO client_types (id, nom, description, icone, couleur, ordre) 
VALUES 
    (1, 'Particulier', 'Client individuel', 'user', '#3B82F6', 1),
    (2, 'Entreprise', 'Société commerciale', 'building', '#10B981', 2),
    (3, 'Association', 'Organisation à but non lucratif', 'users', '#F59E0B', 3)
ON CONFLICT (id) DO NOTHING;

-- Create client_contacts table for additional contacts
CREATE TABLE IF NOT EXISTS client_contacts (
    id serial PRIMARY KEY,
    client_id integer REFERENCES clients(id) ON DELETE CASCADE,
    nom text NOT NULL,
    prenom text,
    fonction text,
    email text,
    telephone text,
    telephone_mobile text,
    principal boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Create client_interactions table for interaction history
CREATE TABLE IF NOT EXISTS client_interactions (
    id serial PRIMARY KEY,
    client_id integer REFERENCES clients(id) ON DELETE CASCADE,
    type_interaction text NOT NULL,
    sujet text,
    description text,
    date_interaction timestamp with time zone DEFAULT NOW(),
    statut text DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'annule')),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Create client_notes table for notes
CREATE TABLE IF NOT EXISTS client_notes (
    id serial PRIMARY KEY,
    client_id integer REFERENCES clients(id) ON DELETE CASCADE,
    titre text,
    contenu text NOT NULL,
    type_note text DEFAULT 'generale' CHECK (type_note IN ('generale', 'commercial', 'technique', 'juridique')),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Create client_documents table for document management
CREATE TABLE IF NOT EXISTS client_documents (
    id serial PRIMARY KEY,
    client_id integer REFERENCES clients(id) ON DELETE CASCADE,
    nom text NOT NULL,
    type_document text NOT NULL,
    fichier_url text,
    taille_fichier integer,
    mime_type text,
    description text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Add foreign key constraint to link clients to client_types
ALTER TABLE clients ADD CONSTRAINT fk_clients_type_id 
    FOREIGN KEY (type_id) REFERENCES client_types(id);

-- Generate unique client numbers for existing clients if they don't have one
UPDATE clients 
SET numero_client = CASE 
    WHEN type_id = 1 THEN 'PAR' || LPAD(id::text, 4, '0')
    WHEN type_id = 2 THEN 'ENT' || LPAD(id::text, 4, '0')
    WHEN type_id = 3 THEN 'ASS' || LPAD(id::text, 4, '0')
    ELSE 'CLI' || LPAD(id::text, 4, '0')
END
WHERE numero_client IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_type_id ON clients(type_id);
CREATE INDEX IF NOT EXISTS idx_clients_numero_client ON clients(numero_client);
CREATE INDEX IF NOT EXISTS idx_clients_statut ON clients(statut);
CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_interactions_client_id ON client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id);

-- Create function to generate next client number
CREATE OR REPLACE FUNCTION generate_client_number(p_type_id integer)
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

-- Create function to search clients with advanced filtering
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
    date_creation date
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
        COALESCE(c.nombre_reservations, 0) as nombre_reservations,
        COALESCE(c.montant_total_reservations, 0) as montant_total_reservations,
        c.date_creation
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

-- Create function to get client statistics
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
        COUNT(*) FILTER (WHERE date_creation >= DATE_TRUNC('month', CURRENT_DATE))::integer as nouveaux_ce_mois,
        COALESCE(SUM(montant_total_reservations), 0) as chiffre_affaires_total
    FROM clients;
END;
$$;

-- Add trigger to auto-generate client number on insert
CREATE OR REPLACE FUNCTION set_client_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.numero_client IS NULL THEN
        NEW.numero_client := generate_client_number(NEW.type_id);
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_client_numero
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION set_client_numero();

-- Add comment to the migration
COMMENT ON TABLE clients IS 'Enhanced clients table with comprehensive client management features';
COMMENT ON TABLE client_types IS 'Client types: Particulier, Entreprise, Association';
COMMENT ON TABLE client_contacts IS 'Additional contacts for clients';
COMMENT ON TABLE client_interactions IS 'Client interaction history';
COMMENT ON TABLE client_notes IS 'Client notes and comments';
COMMENT ON TABLE client_documents IS 'Client document management';