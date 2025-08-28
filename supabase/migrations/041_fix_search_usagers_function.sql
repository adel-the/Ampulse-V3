-- Fix search_usagers function to match expected return types
-- This corrects the type mismatch error

-- Drop existing function
DROP FUNCTION IF EXISTS search_usagers(TEXT, INTEGER, TEXT, TEXT);

-- Recreate with correct return types
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
  prescripteur_type VARCHAR, -- Changed from client_category to VARCHAR
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
    c.client_type::VARCHAR as prescripteur_type, -- Cast to VARCHAR
    CASE 
      WHEN c.client_type = 'Particulier' THEN COALESCE(c.nom || ' ' || COALESCE(c.prenom, ''), c.nom)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_usagers(TEXT, INTEGER, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION search_usagers(TEXT, INTEGER, TEXT, TEXT) TO authenticated;

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  SEARCH_USAGERS FUNCTION FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  ✅ Function recreated with correct types';
  RAISE NOTICE '  ✅ prescripteur_type now returns VARCHAR';
  RAISE NOTICE '  ✅ Permissions granted to anon/authenticated';
  RAISE NOTICE '  ✅ Function should now work properly';
  RAISE NOTICE '========================================';
END $$;