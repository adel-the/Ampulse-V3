-- Migration pour corriger le stockage des prix mensuels dans conventions_tarifaires
-- Le problème était que le JSON des prix mensuels n'était pas correctement converti en colonnes individuelles

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS upsert_convention_tarifaire;

-- Recréer la fonction avec le bon typage et la bonne conversion JSON
CREATE OR REPLACE FUNCTION upsert_convention_tarifaire(
    p_client_id INTEGER,
    p_category_id INTEGER,
    p_hotel_id INTEGER,
    p_date_debut DATE,
    p_date_fin DATE,
    p_prix_defaut DECIMAL(10,2),
    p_prix_mensuel TEXT DEFAULT NULL,  -- Changé de JSONB à TEXT car Supabase RPC passe une string
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
    v_prix_json JSONB;
BEGIN
    -- Convertir le texte JSON en JSONB si fourni
    IF p_prix_mensuel IS NOT NULL AND p_prix_mensuel != '' THEN
        BEGIN
            v_prix_json := p_prix_mensuel::JSONB;
        EXCEPTION
            WHEN OTHERS THEN
                v_prix_json := NULL;
        END;
    ELSE
        v_prix_json := NULL;
    END IF;

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
        -- Insertion avec extraction correcte des prix mensuels
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
            CASE WHEN v_prix_json IS NOT NULL THEN (v_prix_json->>'janvier')::DECIMAL(10,2) ELSE NULL END,
            CASE WHEN v_prix_json IS NOT NULL THEN (v_prix_json->>'fevrier')::DECIMAL(10,2) ELSE NULL END,
            CASE WHEN v_prix_json IS NOT NULL THEN (v_prix_json->>'mars')::DECIMAL(10,2) ELSE NULL END,
            CASE WHEN v_prix_json IS NOT NULL THEN (v_prix_json->>'avril')::DECIMAL(10,2) ELSE NULL END,
            CASE WHEN v_prix_json IS NOT NULL THEN (v_prix_json->>'mai')::DECIMAL(10,2) ELSE NULL END,
            CASE WHEN v_prix_json IS NOT NULL THEN (v_prix_json->>'juin')::DECIMAL(10,2) ELSE NULL END,
            CASE WHEN v_prix_json IS NOT NULL THEN (v_prix_json->>'juillet')::DECIMAL(10,2) ELSE NULL END,
            CASE WHEN v_prix_json IS NOT NULL THEN (v_prix_json->>'aout')::DECIMAL(10,2) ELSE NULL END,
            CASE WHEN v_prix_json IS NOT NULL THEN (v_prix_json->>'septembre')::DECIMAL(10,2) ELSE NULL END,
            CASE WHEN v_prix_json IS NOT NULL THEN (v_prix_json->>'octobre')::DECIMAL(10,2) ELSE NULL END,
            CASE WHEN v_prix_json IS NOT NULL THEN (v_prix_json->>'novembre')::DECIMAL(10,2) ELSE NULL END,
            CASE WHEN v_prix_json IS NOT NULL THEN (v_prix_json->>'decembre')::DECIMAL(10,2) ELSE NULL END,
            p_reduction_pourcentage, p_forfait_mensuel, p_conditions, p_active
        )
        RETURNING id INTO v_convention_id;
    ELSE
        -- Mise à jour avec gestion correcte des prix mensuels
        UPDATE conventions_tarifaires SET
            category_id = p_category_id,
            hotel_id = p_hotel_id,
            date_debut = p_date_debut,
            date_fin = p_date_fin,
            prix_defaut = p_prix_defaut,
            prix_janvier = CASE 
                WHEN v_prix_json IS NOT NULL AND v_prix_json->>'janvier' IS NOT NULL 
                THEN (v_prix_json->>'janvier')::DECIMAL(10,2) 
                ELSE prix_janvier 
            END,
            prix_fevrier = CASE 
                WHEN v_prix_json IS NOT NULL AND v_prix_json->>'fevrier' IS NOT NULL 
                THEN (v_prix_json->>'fevrier')::DECIMAL(10,2) 
                ELSE prix_fevrier 
            END,
            prix_mars = CASE 
                WHEN v_prix_json IS NOT NULL AND v_prix_json->>'mars' IS NOT NULL 
                THEN (v_prix_json->>'mars')::DECIMAL(10,2) 
                ELSE prix_mars 
            END,
            prix_avril = CASE 
                WHEN v_prix_json IS NOT NULL AND v_prix_json->>'avril' IS NOT NULL 
                THEN (v_prix_json->>'avril')::DECIMAL(10,2) 
                ELSE prix_avril 
            END,
            prix_mai = CASE 
                WHEN v_prix_json IS NOT NULL AND v_prix_json->>'mai' IS NOT NULL 
                THEN (v_prix_json->>'mai')::DECIMAL(10,2) 
                ELSE prix_mai 
            END,
            prix_juin = CASE 
                WHEN v_prix_json IS NOT NULL AND v_prix_json->>'juin' IS NOT NULL 
                THEN (v_prix_json->>'juin')::DECIMAL(10,2) 
                ELSE prix_juin 
            END,
            prix_juillet = CASE 
                WHEN v_prix_json IS NOT NULL AND v_prix_json->>'juillet' IS NOT NULL 
                THEN (v_prix_json->>'juillet')::DECIMAL(10,2) 
                ELSE prix_juillet 
            END,
            prix_aout = CASE 
                WHEN v_prix_json IS NOT NULL AND v_prix_json->>'aout' IS NOT NULL 
                THEN (v_prix_json->>'aout')::DECIMAL(10,2) 
                ELSE prix_aout 
            END,
            prix_septembre = CASE 
                WHEN v_prix_json IS NOT NULL AND v_prix_json->>'septembre' IS NOT NULL 
                THEN (v_prix_json->>'septembre')::DECIMAL(10,2) 
                ELSE prix_septembre 
            END,
            prix_octobre = CASE 
                WHEN v_prix_json IS NOT NULL AND v_prix_json->>'octobre' IS NOT NULL 
                THEN (v_prix_json->>'octobre')::DECIMAL(10,2) 
                ELSE prix_octobre 
            END,
            prix_novembre = CASE 
                WHEN v_prix_json IS NOT NULL AND v_prix_json->>'novembre' IS NOT NULL 
                THEN (v_prix_json->>'novembre')::DECIMAL(10,2) 
                ELSE prix_novembre 
            END,
            prix_decembre = CASE 
                WHEN v_prix_json IS NOT NULL AND v_prix_json->>'decembre' IS NOT NULL 
                THEN (v_prix_json->>'decembre')::DECIMAL(10,2) 
                ELSE prix_decembre 
            END,
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

-- Fonction de test pour vérifier que la conversion JSON fonctionne
CREATE OR REPLACE FUNCTION test_json_conversion(p_json_text TEXT)
RETURNS TABLE(
    janvier DECIMAL(10,2),
    juillet DECIMAL(10,2),
    aout DECIMAL(10,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_json JSONB;
BEGIN
    v_json := p_json_text::JSONB;
    
    RETURN QUERY SELECT 
        (v_json->>'janvier')::DECIMAL(10,2),
        (v_json->>'juillet')::DECIMAL(10,2),
        (v_json->>'aout')::DECIMAL(10,2);
END;
$$;

-- Commentaire sur la migration
COMMENT ON FUNCTION upsert_convention_tarifaire IS 'Fonction corrigée pour gérer correctement la conversion JSON vers colonnes individuelles de prix mensuels';
COMMENT ON FUNCTION test_json_conversion IS 'Fonction de test pour vérifier la conversion JSON des prix mensuels';