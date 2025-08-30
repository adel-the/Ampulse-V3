-- =============================================
-- Migration: Create individus table
-- Description: Table pour stocker les individus liés aux usagers
-- Date: 2024-08-30
-- =============================================

-- Create the individus table
CREATE TABLE IF NOT EXISTS individus (
    id BIGSERIAL PRIMARY KEY,
    usager_id BIGINT NOT NULL REFERENCES usagers(id) ON DELETE CASCADE,
    
    -- Informations personnelles
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE,
    lieu_naissance VARCHAR(100),
    sexe VARCHAR(10) CHECK (sexe IN ('M', 'F', 'Autre')),
    
    -- Informations de contact
    telephone VARCHAR(20),
    email VARCHAR(100),
    
    -- Relation à l'usager
    relation VARCHAR(50) CHECK (relation IN (
        'Conjoint', 'Enfant', 'Parent', 'Frère/Sœur', 
        'Grand-parent', 'Petit-enfant', 'Autre'
    )),
    
    -- Statut (pour identifier le chef de famille si différent de l'usager principal)
    is_chef_famille BOOLEAN DEFAULT FALSE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Indexes pour optimiser les performances
CREATE INDEX idx_individus_usager_id ON individus(usager_id);
CREATE INDEX idx_individus_nom ON individus(nom);
CREATE INDEX idx_individus_prenom ON individus(prenom);
CREATE INDEX idx_individus_relation ON individus(relation);
CREATE INDEX idx_individus_chef_famille ON individus(is_chef_famille) WHERE is_chef_famille = true;

-- Trigger pour update automatique de updated_at
CREATE OR REPLACE FUNCTION update_individus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER individus_updated_at_trigger
    BEFORE UPDATE ON individus
    FOR EACH ROW
    EXECUTE FUNCTION update_individus_updated_at();

-- RLS Policies (Row Level Security)
ALTER TABLE individus ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir tous les individus
CREATE POLICY "Allow read access for all authenticated users" ON individus
    FOR SELECT TO authenticated
    USING (true);

-- Policy: Les utilisateurs peuvent créer des individus
CREATE POLICY "Allow insert for authenticated users" ON individus
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Policy: Les utilisateurs peuvent modifier des individus
CREATE POLICY "Allow update for authenticated users" ON individus
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Les utilisateurs peuvent supprimer des individus
CREATE POLICY "Allow delete for authenticated users" ON individus
    FOR DELETE TO authenticated
    USING (true);

-- Contraintes business
-- Un seul chef de famille par usager (si différent de l'usager principal)
CREATE UNIQUE INDEX idx_individus_unique_chef_famille 
ON individus(usager_id) 
WHERE is_chef_famille = true;

-- Fonction pour obtenir les individus d'un usager avec statistiques
CREATE OR REPLACE FUNCTION get_usager_individus(usager_id_param BIGINT)
RETURNS TABLE (
    id BIGINT,
    nom VARCHAR,
    prenom VARCHAR,
    date_naissance DATE,
    lieu_naissance VARCHAR,
    sexe VARCHAR,
    telephone VARCHAR,
    email VARCHAR,
    relation VARCHAR,
    is_chef_famille BOOLEAN,
    age_years INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.nom,
        i.prenom,
        i.date_naissance,
        i.lieu_naissance,
        i.sexe,
        i.telephone,
        i.email,
        i.relation,
        i.is_chef_famille,
        CASE 
            WHEN i.date_naissance IS NOT NULL 
            THEN EXTRACT(YEAR FROM age(CURRENT_DATE, i.date_naissance))::INTEGER
            ELSE NULL
        END as age_years,
        i.created_at,
        i.updated_at
    FROM individus i
    WHERE i.usager_id = usager_id_param
    ORDER BY 
        i.is_chef_famille DESC,
        i.created_at ASC;
END;
$$;

-- Fonction pour obtenir des statistiques sur les individus d'un usager
CREATE OR REPLACE FUNCTION get_usager_individus_stats(usager_id_param BIGINT)
RETURNS TABLE (
    total_count INTEGER,
    adults_count INTEGER,
    children_count INTEGER,
    has_chef_famille BOOLEAN,
    relations_summary JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*)::INTEGER as total,
            COUNT(CASE WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, date_naissance)) >= 18 THEN 1 END)::INTEGER as adults,
            COUNT(CASE WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, date_naissance)) < 18 THEN 1 END)::INTEGER as children,
            COUNT(CASE WHEN is_chef_famille = true THEN 1 END) > 0 as has_chef,
            jsonb_object_agg(
                COALESCE(relation, 'Non spécifié'), 
                COUNT(relation)
            ) as relations
        FROM individus 
        WHERE usager_id = usager_id_param
    )
    SELECT 
        total,
        adults,
        children,
        has_chef,
        relations
    FROM stats;
END;
$$;

-- Commentaires pour documentation
COMMENT ON TABLE individus IS 'Table pour stocker les individus liés aux usagers du système';
COMMENT ON COLUMN individus.usager_id IS 'Référence vers l''usager principal';
COMMENT ON COLUMN individus.is_chef_famille IS 'Indique si cet individu est le chef de famille (si différent de l''usager principal)';
COMMENT ON COLUMN individus.relation IS 'Relation de cet individu avec l''usager principal';

-- Grant des permissions
GRANT ALL ON individus TO authenticated;
GRANT ALL ON individus TO service_role;
GRANT USAGE, SELECT ON SEQUENCE individus_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE individus_id_seq TO service_role;