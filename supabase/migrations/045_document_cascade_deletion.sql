-- Documentation migration: Cascade deletion behavior for clients
-- This migration documents the existing CASCADE DELETE behavior and adds helpful comments

-- Document the cascade deletion behavior
COMMENT ON CONSTRAINT conventions_tarifaires_client_id_fkey ON conventions_tarifaires IS 
'Foreign key to clients table with CASCADE DELETE - conventions are automatically deleted when client is deleted';

COMMENT ON CONSTRAINT referents_client_id_fkey ON referents IS 
'Foreign key to clients table with CASCADE DELETE - referents are automatically deleted when client is deleted';

-- Create a helper function to check what will be deleted when a client is deleted
CREATE OR REPLACE FUNCTION check_client_cascade_impact(p_client_id INTEGER)
RETURNS TABLE (
    table_name TEXT,
    record_count BIGINT,
    deletion_behavior TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check referents (CASCADE)
    RETURN QUERY
    SELECT 
        'referents'::TEXT as table_name,
        COUNT(*)::BIGINT as record_count,
        'CASCADE - Will be automatically deleted'::TEXT as deletion_behavior
    FROM referents
    WHERE client_id = p_client_id;
    
    -- Check conventions_tarifaires (CASCADE)
    RETURN QUERY
    SELECT 
        'conventions_tarifaires'::TEXT,
        COUNT(*)::BIGINT,
        'CASCADE - Will be automatically deleted'::TEXT
    FROM conventions_tarifaires
    WHERE client_id = p_client_id;
    
    -- Check usagers where client is prescripteur (RESTRICT)
    RETURN QUERY
    SELECT 
        'usagers (as prescripteur)'::TEXT,
        COUNT(*)::BIGINT,
        'RESTRICT - Will prevent deletion if records exist'::TEXT
    FROM usagers
    WHERE prescripteur_id = p_client_id;
    
    -- Check reservations for this client as usager (RESTRICT by default)
    RETURN QUERY
    SELECT 
        'reservations'::TEXT,
        COUNT(*)::BIGINT,
        'RESTRICT - Will prevent deletion if records exist'::TEXT
    FROM reservations
    WHERE usager_id = p_client_id;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION check_client_cascade_impact IS 
'Check what records will be affected when deleting a client. Shows CASCADE and RESTRICT behaviors.';

-- Create a safe delete function that logs what was deleted
CREATE OR REPLACE FUNCTION safe_delete_client(p_client_id INTEGER)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    deleted_referents INTEGER,
    deleted_conventions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referent_count INTEGER;
    v_convention_count INTEGER;
    v_usager_count INTEGER;
    v_reservation_count INTEGER;
    v_client_name TEXT;
BEGIN
    -- Get client name for logging
    SELECT COALESCE(raison_sociale, nom || ' ' || prenom) INTO v_client_name
    FROM clients
    WHERE id = p_client_id;
    
    IF v_client_name IS NULL THEN
        RETURN QUERY SELECT 
            FALSE,
            'Client non trouvé',
            0,
            0;
        RETURN;
    END IF;
    
    -- Count records that will be deleted
    SELECT COUNT(*) INTO v_referent_count FROM referents WHERE client_id = p_client_id;
    SELECT COUNT(*) INTO v_convention_count FROM conventions_tarifaires WHERE client_id = p_client_id;
    
    -- Check for blocking constraints
    SELECT COUNT(*) INTO v_usager_count FROM usagers WHERE prescripteur_id = p_client_id;
    SELECT COUNT(*) INTO v_reservation_count FROM reservations WHERE usager_id = p_client_id;
    
    IF v_usager_count > 0 THEN
        RETURN QUERY SELECT 
            FALSE,
            format('Impossible de supprimer %s : %s usager(s) associé(s)', v_client_name, v_usager_count),
            0,
            0;
        RETURN;
    END IF;
    
    IF v_reservation_count > 0 THEN
        RETURN QUERY SELECT 
            FALSE,
            format('Impossible de supprimer %s : %s réservation(s) associée(s)', v_client_name, v_reservation_count),
            0,
            0;
        RETURN;
    END IF;
    
    -- Delete the client (CASCADE will handle referents and conventions)
    DELETE FROM clients WHERE id = p_client_id;
    
    -- Log the deletion
    RAISE NOTICE 'Deleted client % (ID: %) with % referents and % conventions', 
                 v_client_name, p_client_id, v_referent_count, v_convention_count;
    
    RETURN QUERY SELECT 
        TRUE,
        format('Client %s supprimé avec succès', v_client_name),
        v_referent_count,
        v_convention_count;
END;
$$;

COMMENT ON FUNCTION safe_delete_client IS 
'Safely delete a client with cascade deletion logging. Returns details about what was deleted.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_client_cascade_impact TO authenticated;
GRANT EXECUTE ON FUNCTION safe_delete_client TO authenticated;

-- Test the cascade deletion (commented out for safety - uncomment to test)
/*
DO $$
DECLARE
    test_client_id INTEGER;
    test_referent_id INTEGER;
    test_convention_id INTEGER;
BEGIN
    -- Create a test client
    INSERT INTO clients (nom, prenom, client_type, statut, email)
    VALUES ('TEST_CASCADE', 'Delete', 'Particulier', 'actif', 'test_cascade@example.com')
    RETURNING id INTO test_client_id;
    
    -- Create a test referent
    INSERT INTO referents (client_id, nom, prenom, fonction)
    VALUES (test_client_id, 'TEST_REF', 'Delete', 'Test')
    RETURNING id INTO test_referent_id;
    
    -- Create a test convention
    INSERT INTO conventions_tarifaires (
        client_id, category_id, hotel_id, 
        date_debut, date_fin, prix_defaut, active
    )
    VALUES (
        test_client_id, 1, 1,
        CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 100.00, true
    )
    RETURNING id INTO test_convention_id;
    
    -- Check what will be deleted
    RAISE NOTICE 'Before deletion - checking cascade impact:';
    PERFORM * FROM check_client_cascade_impact(test_client_id);
    
    -- Delete the client
    DELETE FROM clients WHERE id = test_client_id;
    
    -- Verify cascade deletion worked
    IF EXISTS (SELECT 1 FROM referents WHERE id = test_referent_id) THEN
        RAISE EXCEPTION 'CASCADE DELETE failed for referents';
    END IF;
    
    IF EXISTS (SELECT 1 FROM conventions_tarifaires WHERE id = test_convention_id) THEN
        RAISE EXCEPTION 'CASCADE DELETE failed for conventions_tarifaires';
    END IF;
    
    RAISE NOTICE 'CASCADE DELETE test passed successfully!';
END;
$$;
*/