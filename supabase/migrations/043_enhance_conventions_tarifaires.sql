-- Migration pour améliorer la table conventions_tarifaires
-- Ajoute le support des prix par catégorie de chambre et par mois

-- Ajouter les nouvelles colonnes pour gérer les prix par catégorie et par mois
ALTER TABLE conventions_tarifaires 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES room_categories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS prix_defaut DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_janvier DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_fevrier DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_mars DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_avril DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_mai DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_juin DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_juillet DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_aout DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_septembre DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_octobre DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_novembre DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS prix_decembre DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_conventions_tarifaires_client_category 
ON conventions_tarifaires(client_id, category_id);

CREATE INDEX IF NOT EXISTS idx_conventions_tarifaires_dates 
ON conventions_tarifaires(date_debut, date_fin);

CREATE INDEX IF NOT EXISTS idx_conventions_tarifaires_active 
ON conventions_tarifaires(active) WHERE active = true;

-- Fonction pour récupérer le prix applicable pour une date et catégorie données
CREATE OR REPLACE FUNCTION get_convention_price(
    p_client_id INTEGER,
    p_category_id INTEGER,
    p_date DATE,
    p_month INTEGER DEFAULT NULL
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_price DECIMAL(10,2);
    v_month INTEGER;
    v_month_column TEXT;
BEGIN
    -- Déterminer le mois à utiliser
    v_month := COALESCE(p_month, EXTRACT(MONTH FROM p_date));
    
    -- Construire le nom de la colonne du mois
    v_month_column := CASE v_month
        WHEN 1 THEN 'prix_janvier'
        WHEN 2 THEN 'prix_fevrier'
        WHEN 3 THEN 'prix_mars'
        WHEN 4 THEN 'prix_avril'
        WHEN 5 THEN 'prix_mai'
        WHEN 6 THEN 'prix_juin'
        WHEN 7 THEN 'prix_juillet'
        WHEN 8 THEN 'prix_aout'
        WHEN 9 THEN 'prix_septembre'
        WHEN 10 THEN 'prix_octobre'
        WHEN 11 THEN 'prix_novembre'
        WHEN 12 THEN 'prix_decembre'
    END;
    
    -- Récupérer le prix pour le mois spécifique ou le prix par défaut
    EXECUTE format('
        SELECT COALESCE(%I, prix_defaut)
        FROM conventions_tarifaires
        WHERE client_id = $1
        AND category_id = $2
        AND active = true
        AND ($3 >= date_debut OR date_debut IS NULL)
        AND ($3 <= date_fin OR date_fin IS NULL)
        ORDER BY created_at DESC
        LIMIT 1
    ', v_month_column)
    INTO v_price
    USING p_client_id, p_category_id, p_date;
    
    RETURN v_price;
END;
$$;

-- Fonction pour vérifier les chevauchements de périodes
CREATE OR REPLACE FUNCTION check_convention_overlap(
    p_client_id INTEGER,
    p_category_id INTEGER,
    p_date_debut DATE,
    p_date_fin DATE,
    p_exclude_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_overlap_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_overlap_count
    FROM conventions_tarifaires
    WHERE client_id = p_client_id
    AND category_id = p_category_id
    AND active = true
    AND (id != p_exclude_id OR p_exclude_id IS NULL)
    AND (
        (p_date_debut BETWEEN date_debut AND COALESCE(date_fin, '9999-12-31'))
        OR (p_date_fin BETWEEN date_debut AND COALESCE(date_fin, '9999-12-31'))
        OR (date_debut BETWEEN p_date_debut AND COALESCE(p_date_fin, '9999-12-31'))
    );
    
    RETURN v_overlap_count > 0;
END;
$$;

-- Fonction pour créer ou mettre à jour une convention avec validation
CREATE OR REPLACE FUNCTION upsert_convention_tarifaire(
    p_client_id INTEGER,
    p_category_id INTEGER,
    p_hotel_id INTEGER,
    p_date_debut DATE,
    p_date_fin DATE,
    p_prix_defaut DECIMAL(10,2),
    p_prix_mensuel JSONB DEFAULT NULL,
    p_reduction_pourcentage DECIMAL(5,2) DEFAULT NULL,
    p_forfait_mensuel DECIMAL(10,2) DEFAULT NULL,
    p_conditions TEXT DEFAULT NULL,
    p_active BOOLEAN DEFAULT true,
    p_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    convention_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_convention_id INTEGER;
    v_has_overlap BOOLEAN;
BEGIN
    -- Vérifier les chevauchements
    v_has_overlap := check_convention_overlap(
        p_client_id, 
        p_category_id, 
        p_date_debut, 
        p_date_fin, 
        p_id
    );
    
    IF v_has_overlap AND p_active THEN
        RETURN QUERY SELECT 
            false::BOOLEAN,
            'Une convention active existe déjà pour cette période et catégorie'::TEXT,
            NULL::INTEGER;
        RETURN;
    END IF;
    
    -- Insérer ou mettre à jour
    IF p_id IS NULL THEN
        -- Insertion
        INSERT INTO conventions_tarifaires (
            client_id, category_id, hotel_id, date_debut, date_fin,
            prix_defaut,
            prix_janvier, prix_fevrier, prix_mars, prix_avril,
            prix_mai, prix_juin, prix_juillet, prix_aout,
            prix_septembre, prix_octobre, prix_novembre, prix_decembre,
            reduction_pourcentage, forfait_mensuel, conditions, active
        ) VALUES (
            p_client_id, p_category_id, p_hotel_id, p_date_debut, p_date_fin,
            p_prix_defaut,
            COALESCE((p_prix_mensuel->>'janvier')::DECIMAL, NULL),
            COALESCE((p_prix_mensuel->>'fevrier')::DECIMAL, NULL),
            COALESCE((p_prix_mensuel->>'mars')::DECIMAL, NULL),
            COALESCE((p_prix_mensuel->>'avril')::DECIMAL, NULL),
            COALESCE((p_prix_mensuel->>'mai')::DECIMAL, NULL),
            COALESCE((p_prix_mensuel->>'juin')::DECIMAL, NULL),
            COALESCE((p_prix_mensuel->>'juillet')::DECIMAL, NULL),
            COALESCE((p_prix_mensuel->>'aout')::DECIMAL, NULL),
            COALESCE((p_prix_mensuel->>'septembre')::DECIMAL, NULL),
            COALESCE((p_prix_mensuel->>'octobre')::DECIMAL, NULL),
            COALESCE((p_prix_mensuel->>'novembre')::DECIMAL, NULL),
            COALESCE((p_prix_mensuel->>'decembre')::DECIMAL, NULL),
            p_reduction_pourcentage, p_forfait_mensuel, p_conditions, p_active
        )
        RETURNING id INTO v_convention_id;
    ELSE
        -- Mise à jour
        UPDATE conventions_tarifaires SET
            category_id = p_category_id,
            hotel_id = p_hotel_id,
            date_debut = p_date_debut,
            date_fin = p_date_fin,
            prix_defaut = p_prix_defaut,
            prix_janvier = COALESCE((p_prix_mensuel->>'janvier')::DECIMAL, prix_janvier),
            prix_fevrier = COALESCE((p_prix_mensuel->>'fevrier')::DECIMAL, prix_fevrier),
            prix_mars = COALESCE((p_prix_mensuel->>'mars')::DECIMAL, prix_mars),
            prix_avril = COALESCE((p_prix_mensuel->>'avril')::DECIMAL, prix_avril),
            prix_mai = COALESCE((p_prix_mensuel->>'mai')::DECIMAL, prix_mai),
            prix_juin = COALESCE((p_prix_mensuel->>'juin')::DECIMAL, prix_juin),
            prix_juillet = COALESCE((p_prix_mensuel->>'juillet')::DECIMAL, prix_juillet),
            prix_aout = COALESCE((p_prix_mensuel->>'aout')::DECIMAL, prix_aout),
            prix_septembre = COALESCE((p_prix_mensuel->>'septembre')::DECIMAL, prix_septembre),
            prix_octobre = COALESCE((p_prix_mensuel->>'octobre')::DECIMAL, prix_octobre),
            prix_novembre = COALESCE((p_prix_mensuel->>'novembre')::DECIMAL, prix_novembre),
            prix_decembre = COALESCE((p_prix_mensuel->>'decembre')::DECIMAL, prix_decembre),
            reduction_pourcentage = p_reduction_pourcentage,
            forfait_mensuel = p_forfait_mensuel,
            conditions = p_conditions,
            active = p_active,
            updated_at = NOW()
        WHERE id = p_id
        RETURNING id INTO v_convention_id;
    END IF;
    
    RETURN QUERY SELECT 
        true::BOOLEAN,
        'Convention enregistrée avec succès'::TEXT,
        v_convention_id;
END;
$$;

-- Vue pour faciliter la lecture des conventions avec détails
CREATE OR REPLACE VIEW v_conventions_tarifaires_detail AS
SELECT 
    ct.id,
    ct.client_id,
    c.raison_sociale AS client_nom,
    ct.category_id,
    rc.name AS category_nom,
    rc.capacity AS category_capacite,
    ct.hotel_id,
    h.nom AS hotel_nom,
    ct.date_debut,
    ct.date_fin,
    ct.prix_defaut,
    ct.prix_janvier,
    ct.prix_fevrier,
    ct.prix_mars,
    ct.prix_avril,
    ct.prix_mai,
    ct.prix_juin,
    ct.prix_juillet,
    ct.prix_aout,
    ct.prix_septembre,
    ct.prix_octobre,
    ct.prix_novembre,
    ct.prix_decembre,
    ct.reduction_pourcentage,
    ct.forfait_mensuel,
    ct.conditions,
    ct.active,
    ct.created_at,
    ct.updated_at
FROM conventions_tarifaires ct
LEFT JOIN clients c ON ct.client_id = c.id
LEFT JOIN room_categories rc ON ct.category_id = rc.id
LEFT JOIN hotels h ON ct.hotel_id = h.id;

-- Accorder les permissions
GRANT ALL ON conventions_tarifaires TO authenticated;
GRANT ALL ON v_conventions_tarifaires_detail TO authenticated;

-- Commentaires pour la documentation
COMMENT ON TABLE conventions_tarifaires IS 'Table des conventions tarifaires par client, catégorie et mois';
COMMENT ON COLUMN conventions_tarifaires.category_id IS 'ID de la catégorie de chambre concernée';
COMMENT ON COLUMN conventions_tarifaires.prix_defaut IS 'Prix par défaut si aucun prix mensuel spécifique';
COMMENT ON COLUMN conventions_tarifaires.prix_janvier IS 'Prix spécifique pour janvier';
COMMENT ON FUNCTION get_convention_price IS 'Récupère le prix applicable pour un client, catégorie et date donnés';
COMMENT ON FUNCTION check_convention_overlap IS 'Vérifie les chevauchements de périodes pour éviter les conflits';
COMMENT ON FUNCTION upsert_convention_tarifaire IS 'Crée ou met à jour une convention avec validation';