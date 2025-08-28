-- Create usagers table with prescripteur relationship
-- This table stores beneficiaries (guests) who are funded by prescripteurs (clients)

-- Drop existing usagers table if it exists (in case it was created without proper structure)
DROP TABLE IF EXISTS usagers CASCADE;

-- Create usagers table with all necessary fields
CREATE TABLE usagers (
  id SERIAL PRIMARY KEY,
  numero_usager VARCHAR(50) UNIQUE NOT NULL, -- Unique identifier for usager
  prescripteur_id INTEGER NOT NULL, -- Foreign key to clients table (prescripteur)
  
  -- Personal information
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  date_naissance DATE,
  lieu_naissance VARCHAR(255),
  nationalite VARCHAR(100),
  
  -- Contact information
  adresse TEXT,
  ville VARCHAR(255),
  code_postal VARCHAR(10),
  telephone VARCHAR(20),
  email VARCHAR(255),
  
  -- Administrative information
  numero_secu VARCHAR(50),
  caf_number VARCHAR(50),
  
  -- Social situation
  situation_familiale VARCHAR(100) CHECK (situation_familiale IN ('Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'Pacsé(e)', 'Union libre')),
  nombre_enfants INTEGER DEFAULT 0 CHECK (nombre_enfants >= 0),
  
  -- Financial situation
  revenus DECIMAL(10,2),
  type_revenus VARCHAR(100), -- RSA, Salaire, Retraite, AAH, etc.
  prestations TEXT[], -- Array of social benefits
  
  -- Health and autonomy
  autonomie_level VARCHAR(50) CHECK (autonomie_level IN ('Autonome', 'Semi-autonome', 'Non-autonome')),
  observations TEXT, -- General notes about the usager
  
  -- Status
  statut VARCHAR(50) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'archive')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Foreign key constraint
  CONSTRAINT fk_prescripteur 
    FOREIGN KEY (prescripteur_id) 
    REFERENCES clients(id) 
    ON DELETE RESTRICT -- Prevent deletion of client if usagers exist
);

-- Create indexes for performance
CREATE INDEX idx_usagers_prescripteur ON usagers(prescripteur_id);
CREATE INDEX idx_usagers_nom ON usagers(nom, prenom);
CREATE INDEX idx_usagers_numero ON usagers(numero_usager);
CREATE INDEX idx_usagers_statut ON usagers(statut);
CREATE INDEX idx_usagers_created_at ON usagers(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_usagers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_usagers_updated_at
  BEFORE UPDATE ON usagers
  FOR EACH ROW
  EXECUTE FUNCTION update_usagers_updated_at();

-- Create function to generate unique usager number
CREATE OR REPLACE FUNCTION generate_usager_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate format: USG-YYYYMMDD-XXXX
    new_number := 'USG-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if number exists
    SELECT COUNT(*) INTO exists_count FROM usagers WHERE numero_usager = new_number;
    
    -- If unique, return it
    IF exists_count = 0 THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate usager number
CREATE OR REPLACE FUNCTION auto_generate_usager_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_usager IS NULL OR NEW.numero_usager = '' THEN
    NEW.numero_usager := generate_usager_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_usager_number
  BEFORE INSERT ON usagers
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_usager_number();

-- RLS Policies
ALTER TABLE usagers ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read usagers
CREATE POLICY "Authenticated users can read usagers"
  ON usagers FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can create usagers
CREATE POLICY "Users can create usagers"
  ON usagers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update usagers
CREATE POLICY "Users can update usagers"
  ON usagers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can delete usagers (restricted in app logic)
CREATE POLICY "Authenticated users can delete usagers"
  ON usagers FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Create view for usagers with prescripteur information
CREATE OR REPLACE VIEW usagers_with_prescripteur AS
SELECT 
  u.*,
  c.nom as prescripteur_nom,
  c.raison_sociale as prescripteur_raison_sociale,
  c.client_type as prescripteur_type,
  c.numero_client as prescripteur_numero,
  CASE 
    WHEN c.client_type = 'Particulier' THEN COALESCE(c.nom || ' ' || c.prenom, c.nom)
    ELSE COALESCE(c.raison_sociale, c.nom)
  END as prescripteur_display_name
FROM usagers u
LEFT JOIN clients c ON u.prescripteur_id = c.id;

-- Function to search usagers with filters
CREATE OR REPLACE FUNCTION search_usagers(
  search_term TEXT DEFAULT NULL,
  prescripteur_filter INTEGER DEFAULT NULL,
  statut_filter TEXT DEFAULT NULL,
  autonomie_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  numero_usager VARCHAR,
  prescripteur_id INTEGER,
  nom VARCHAR,
  prenom VARCHAR,
  date_naissance DATE,
  telephone VARCHAR,
  email VARCHAR,
  ville VARCHAR,
  situation_familiale VARCHAR,
  autonomie_level VARCHAR,
  statut VARCHAR,
  prescripteur_nom VARCHAR,
  prescripteur_raison_sociale VARCHAR,
  prescripteur_type client_category,
  prescripteur_display_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.numero_usager,
    u.prescripteur_id,
    u.nom,
    u.prenom,
    u.date_naissance,
    u.telephone,
    u.email,
    u.ville,
    u.situation_familiale,
    u.autonomie_level,
    u.statut,
    c.nom as prescripteur_nom,
    c.raison_sociale as prescripteur_raison_sociale,
    c.client_type as prescripteur_type,
    CASE 
      WHEN c.client_type = 'Particulier' THEN COALESCE(c.nom || ' ' || c.prenom, c.nom)
      ELSE COALESCE(c.raison_sociale, c.nom)
    END as prescripteur_display_name,
    u.created_at
  FROM usagers u
  LEFT JOIN clients c ON u.prescripteur_id = c.id
  WHERE
    (search_term IS NULL OR search_term = '' OR
     u.nom ILIKE '%' || search_term || '%' OR
     u.prenom ILIKE '%' || search_term || '%' OR
     u.numero_usager ILIKE '%' || search_term || '%' OR
     u.email ILIKE '%' || search_term || '%' OR
     u.telephone ILIKE '%' || search_term || '%')
    AND (prescripteur_filter IS NULL OR u.prescripteur_id = prescripteur_filter)
    AND (statut_filter IS NULL OR statut_filter = '' OR u.statut = statut_filter)
    AND (autonomie_filter IS NULL OR autonomie_filter = '' OR u.autonomie_level = autonomie_filter)
  ORDER BY u.created_at DESC;
END;
$$;

-- Function to get usager statistics
CREATE OR REPLACE FUNCTION get_usager_statistics()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'actifs', COUNT(*) FILTER (WHERE statut = 'actif'),
    'inactifs', COUNT(*) FILTER (WHERE statut = 'inactif'),
    'archives', COUNT(*) FILTER (WHERE statut = 'archive'),
    'autonomes', COUNT(*) FILTER (WHERE autonomie_level = 'Autonome'),
    'semi_autonomes', COUNT(*) FILTER (WHERE autonomie_level = 'Semi-autonome'),
    'non_autonomes', COUNT(*) FILTER (WHERE autonomie_level = 'Non-autonome'),
    'by_prescripteur_type', (
      SELECT json_object_agg(client_type, count)
      FROM (
        SELECT c.client_type, COUNT(u.id) as count
        FROM usagers u
        JOIN clients c ON u.prescripteur_id = c.id
        GROUP BY c.client_type
      ) prescripteur_counts
    )
  ) INTO result
  FROM usagers;
  
  RETURN result;
END;
$$;

-- Grant permissions to authenticated users
GRANT ALL ON usagers TO authenticated;
GRANT USAGE ON SEQUENCE usagers_id_seq TO authenticated;
GRANT SELECT ON usagers_with_prescripteur TO authenticated;
GRANT EXECUTE ON FUNCTION search_usagers TO authenticated;
GRANT EXECUTE ON FUNCTION get_usager_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION generate_usager_number TO authenticated;